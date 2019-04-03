"use strict;"
var http = require("http");
var https = require("https");
var request = require("request");
var async = require("async");
var _ = require("lodash");
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring');
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });
const walmartConfig = require("./walmart.config.json");

/* 
    - Implement all functions from the abstraction layer;
*/

/** 
 * - Not Implemented
*/
function getAllCategories() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * - This API gives only Parent categories;
 */
function getAllParentCategories(env) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var url = `${config.basePath}/category/${config.MerchantId}/NA`;

        _fire(config, url, 'GET', null).then(result => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });
    });

}

/**
 * - Not Implemented;
 */
function getCategoryById() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * - Not implemented
 */
function getParentCategory() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * - This API for a given Parent Id, gets All its linked children;
 * - If isLeaf = false , then there are linked childrens;
 * - If isLeaf = true , then its the last children in the hierarchy;
 * - Field : Lineage - Indicates the hierarchy of the categories;
 */
function getCategoryChildren(env, parentId) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var url = `${config.basePath}/category/${config.MerchantId}/${parentId}`;

        _fire(config, url, 'GET', null).then(result => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });
    });
}

/**
 * 
 */
function getProductsByCategory(env, categoryId) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var url = `${config.basePath}/Product/Category/${config.MerchantId}/${categoryId}`;

        _fire(config, url, 'GET', null).then(result => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });
    });
}

/**
 * Not implemented
 */
function getAllProducts() {
    return new Promise((resolve, reject) => {

    });
}

/**
 *
 */
function getProductById(env, productId) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var url = `${config.basePath}/Product/Information/${config.MerchantId}/${productId}`;

        _fire(config, url, 'GET', null).then(result => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });

    });
}

/**
 * 
 */
function productByLocation(env, fc, sku) {
    return new Promise((resolve, reject) => {

        const config = _getConfig(env);

        const locationId = fc.partner.locationId;

        const url = `${config.basePath}/Product/${config.MerchantId}/LocationStockPrice`;

        const headers = {
            CKey: config.consumerKey,
            Skey: config.secretkey,
        }

        const params = {
            query: { sKU: sku, locationId: locationId },
            headers: headers
        }

        _fire(config, url, 'POST', params).then(result => {

            if (result && result.LocationStockPrices && result.LocationStockPrices.length) {
                resolve(result.LocationStockPrices);
            } else {
                reject(new Error(`Could not get location-wise walmart inventory for SKU ${sku}`));
            }

        }).catch(e => {
            reject(e);
        });

    });
}

/**
 * 
 */
function volumetricPricing(env, fc, productId) {
    return new Promise((resolve, reject) => {

        const config = _getConfig(env);

        const url = `${config.frontApi}/VolumetricPricing/${config.MerchantId}`;

        const options = {
            query: {
                productid: productId,
                storeId: fc.partner.locationId
            }
        }

        _fire(config, url, 'GET', options).then(result => {
            resolve(result);
        }).catch(e => {
            reject(e);
        });

    });
}

/*
    - This gets products stock from walmart for a given product Id;
    - SK ERP system deals with buckets grouped by MRP and offer , hence walmart response has to be parsed in SK buckets format
    - This can fetch walmart invenotry in bulk for a given list of product Ids;
    - ex: 223690,336934
 */
function inventoryBuckets(env, fc, productList, options) {
    return new Promise((resolve, reject) => {
        /*
            {
                "productId": product.id,
                "mapping" : {},
                "quantity" : product.quantity * deal.quantity,
                "wmf": deal.defaultWhId,
                "dealId": deal._id
            } 
         */
        var config = _getConfig(env);

        var skuList = [];

        productList.map(p => {
            if (p.mapping && p.mapping.sku) {
                skuList.push(p.mapping.sku);
            }
        });

        var walmartProductPromise = new Promise((resolve, reject) => {
            Promise.all(productList.map(p => {
                return new Promise((_resolve, _reject) => {

                    var url = `${config.basePath}/Product/Information/${config.MerchantId}/${p.mapping.productId}`;

                    _fire(config, url, 'GET', null).then(result => {
                        _resolve(result);
                    }).catch(e => {
                        _reject(e);
                    });

                });
            })).then(walmartProducts => {
                if (walmartProducts && walmartProducts.length) {
                    resolve(walmartProducts);
                } else {
                    reject(new Error(`Could not get walmart products....`));
                }
            }).catch(e => reject(e));
        });


        var volumetricPromise = new Promise((resolve, reject) => {
            Promise.all(productList.map(p => {
                return new Promise((_resolve, _reject) => {

                    const url = `${config.frontApi}/VolumetricPricing/${config.MerchantId}`;

                    const options = {
                        query: {
                            productid: productId,
                            storeId: fc.partner.locationId
                        }
                    }


                    _fire(config, url, 'GET', options).then(result => {
                        _resolve(result);
                    }).catch(e => {
                        _resolve();
                    });
                    //Here add productid to the response;
                });
            })).then(volumes => {
                resolve();
            }).catch(e => reject(e));
        });

        Promise.all([walmartProductPromise, volumetricPromise]).then(result => {

            var walmartProductList = result[0];
            var volumeList = result[1];
            var sortedGroup = {};

            if (!walmartProductList || !walmartProductList.length) {
                reject(new Error(`Could not get walmart product list.....`));
                return;
            }
            //Convert to bucket format;
            productList.map(p => {

                // var walmartProduct = _.find(walmartProductList, { "Product.ProductId": parseInt(p.mapping.productId) });

                var walmartProduct = _.find(walmartProductList, (pr => {
                    if (pr.Product.ProductId === parseInt(p.mapping.productId)) {
                        return true;
                    }
                }));

                if (walmartProduct) {

                    if (!sortedGroup[p.whId]) {

                        sortedGroup[p.whId] = [];

                        sortedGroup[p.whId].push({
                            "productId": p.productId,
                            "totalQty": 0,
                            "snapShots": [{
                                whId: p.whId,
                                productId: p.productId,
                                mappedProductId: walmartProduct.Product.ProductId,
                                mrp: walmartProduct.Product.MRP,
                                transferPrice: walmartProduct.Product.WebPrice,
                                stock: parseInt(walmartProduct.Product.Inventory),
                                onHold: 0,
                                key: walmartProduct.Product.MRP,
                                snapShotIds: []
                            }],
                            "buckets": {},
                            "bucketKeys": []
                        });

                    } else {
                        //if wmf key exists , then check if in that wmf this productId exists; If not then add;
                        var exisiting = _.find(sortedGroup[p.whId], { productId: p.productId, whId: p.whId });

                        if (!exisiting) {
                            sortedGroup[p.whId].push({
                                "productId": p.productId,
                                "totalQty": 0,
                                "snapShots": [{
                                    whId: p.whId,
                                    productId: p.productId,
                                    mappedProductId: walmartProduct.Product.ProductId,
                                    mrp: walmartProduct.Product.MRP,
                                    transferPrice: walmartProduct.Product.WebPrice,
                                    stock: parseInt(walmartProduct.Product.Inventory),
                                    onHold: 0,
                                    key: walmartProduct.Product.MRP,
                                    snapShotIds: []
                                }],
                                "buckets": {},
                                "bucketKeys": []
                            });
                        }

                    }

                }
            });

            Object.keys(sortedGroup).map(whId => {
                var whGroup = sortedGroup[whId]; // List of product snapshots;
                whGroup.map(product => {
                    product.totalQty = _.sumBy(product.snapShots, "stock");
                    var group = _.groupBy(product.snapShots, "key");
                    product.buckets = group;
                    Object.keys(product.buckets).map(mrpKey => {
                        var _list = product.buckets[mrpKey];
                        var count = _.sumBy(_list, "stock");
                        product.buckets[mrpKey] = {
                            "whId": _list[0].whId,
                            "productId": _list[0].productId,
                            "mappedProductId": _list[0].mappedProductId,
                            "mrp": _list[0].mrp,
                            "transferPrice": _list[0].transferPrice,
                            "stock": count,
                            "onHold": 0,
                            "snapShotIds": []
                        }
                    })
                    /*  product.buckets[product.key] = {
                         "whId": _list[0].whId,
                         "productId": _list[0].productId,
                         "mappedProductId": walmartProduct.Product.ProductId,
                         "mrp": _list[0].mrp,
                         "transferPrice": _list[0].WebPrice,
                         "stock": count,
                         "onHold": 0,
                         "snapShotIds": []
                     } */
                    product.bucketKeys = Object.keys(group);
                    delete product.snapShots;
                });

            })

            if (options && options.bucketsOnly) {
                resolve({ buckets: sortedGroup });
            } else {
                var products = walmartProductList.map(p => p.Product);
                resolve({ buckets: sortedGroup, productList: products });
            }

        }).catch(e => reject(e));

        // Sample response format to send;
        /* var mock = {
            "WMF3": [
                {
                    productId: "PR10964",
                    totalQty: 10,
                    snapShots: [],
                    buckets: {
                        "10_Walmart Offer": {
                            whId: "WMF3",
                            productId: "PR10964",
                            mrp: 60,
                            transferPrice: _list[0].WebPrice,
                            stock: 10,
                            onHold: 0,
                            snapShotIds: []
                        }
                    },
                    bucketKeys: ["10_Walmart Offer"]
                }
            ]
        }; */
    });
}

function inventoryBuckets_V2(env, fc, productList, options) {
    return new Promise((resolve, reject) => {
        /*
            PAYLOAD:
           {
               "productId": product.id,
               "mapping" : {},
               "quantity" : product.quantity * deal.quantity,
               "dealId": deal._id,
               "whId": fc.whId,
               "locationId": 248
           } 
        */

        var config = _getConfig(env);

        var inventoryBuckets = {} //{"WMF3" : [ {"productId" : "PR123" , mapping: {} , snapshost: [] } ]}

        var walmartProductList = [];

        var grouped = _.groupBy(productList, "whId");

        Object.keys(grouped).map(whId => {

            inventoryBuckets[whId] = []; //Array of unique products only for that fc;

            let productList = grouped[whId];

            productList.map(p => {
                var record = _.find(inventoryBuckets[whId], { "productId": p.productId });
                if (!record) {//If not there for this whId/fc/location then only push, else skip;
                    var newRecord = {
                        "productId": p.productId,
                        "mapping": p.mapping,
                        "whId": p.whId,
                        "locationId": p.locationId,
                        "totalQty": 0,
                        "snapShots": [],
                        "buckets": {},
                        "bucketKeys": []
                    };
                    inventoryBuckets[whId].push(newRecord);
                }
            });

        });

        //Iterate Inventory Buckets location-wise , and for each locations , iterate products and get inventory of the product;
        Promise.all(Object.keys(inventoryBuckets).map(whId => {
            return new Promise((resolve, reject) => {

                let errorList = [];

                let productGroup = inventoryBuckets[whId]; //This list is unique for a given fc/whId/locationId;

                var queue = async.queue((p, queueCB) => {

                    let fcData = { 'partner': { 'locationId': p.locationId } };

                    const sku = p.mapping.sku;

                    productByLocation(env, fcData, sku).then(parnterInventories => {
                        /**
                         * TODO::
                         *  - Push to snapshots;
                         *  - Form buckets
                         *  - resolve
                         */
                        if (parnterInventories && parnterInventories.length) {

                            parnterInventories = _.sortBy(parnterInventories, ['WebPrice']);
                            //Form snapshots;
                            parnterInventories.map(inventory => {
                                var snapShot = {
                                    productId: p.productId,
                                    whId: p.whId,
                                    mappedProductId: p.mapping.productId,
                                    mrp: inventory.MRP,
                                    transferPrice: inventory.WebPrice,
                                    stock: parseInt(inventory.Inventory),
                                    onHold: 0,
                                    key: `${inventory.MRP}`,
                                    snapShotIds: []
                                };
                                p.snapShots.push(snapShot);
                            });

                            p.totalQty = _.sumBy(p.snapShots, 'stock');
                            //Form buckets;
                            p.buckets = _.groupBy(p.snapShots, 'key');
                            //Form bucketKeys;
                            p.bucketKeys = Object.keys(p.buckets);
                            //Buckets summarisation;

                            Object.keys(p.buckets).map(key => {
                                var bucketGroup = p.buckets[key];
                                var count = _.sumBy(bucketGroup, 'stock');
                                p.buckets[key] = {
                                    productId: bucketGroup[0].productId,
                                    whId: bucketGroup[0].whId,
                                    mappedProductId: bucketGroup[0].mappedProductId,
                                    mrp: bucketGroup[0].mrp,
                                    transferPrice: bucketGroup[0].transferPrice,
                                    stock: count,
                                    onHold: 0,
                                    snapShotIds: []
                                }
                            });

                            queueCB(null);

                        } else {
                            queueCB(new Error(`Could not get location-wise inventory for Product ${p.productId}`));
                        }

                    }).catch(e => queueCB(e));

                });

                queue.push(productGroup, (e, result) => {
                    if (e) {
                        productGroup = [];
                        errorList.push(e);
                    }
                });

                queue.drain = () => {
                    if (!errorList || !errorList.length) {
                        resolve();
                    } else {
                        reject(errorList);
                    }
                };

            });
        })).then(() => {

            resolve({ buckets: inventoryBuckets });

        }).catch(e => reject(e));

    });
}


/**
 * 
 */
function startSession() {
    return new Promise((resolve, reject) => {

    });
}


/**
 * 
 */
function accessToken(env) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var url = `${config.basePath}/Customer/GetAccessToken/${config.MerchantId}`;

        _fire(config, url, 'POST', null).then(result => {

            if (result && result.ErrorCode === 0 && result.Token) {
                resolve(result);
            } else {
                reject(new Error(`Could not get access token...`));
            }

        }).catch(e => {
            reject(e);
        });

    });
}

/**
 * 
 */
function login(env, fc) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        const url = `${config.basePath}/Customer/${MerchantId}/Login/true/${fc.partner.locationId}`;

        const options = {
            query: {
                username: config.userId,
                password: config.password
            },
            headers: {
                CKey: config.consumerKey,
                SKey: config.secretkey
            }
        }

        _fire(config, url, 'POST', options).then(result => {
            if (result && result.messageCode === '1004' && result.Token) {
                resolve(result.Token);
            } else {
                reject(new Error(`Login Error , Could not access token ....`));
            }
        }).catch(e => reject(e));

    });
}

/**
 * 
 */
function logout(env, fc) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        const url = `${config.basePath}`;

    });
}

/**
 * 
 */
function addToCart(env, fc, order) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        var error = [];
        var cartResult = [];

        var productList = [];

        order.subOrders.map(sO => {
            productList = productList.concat(sO.products);
        });

        //Get token;
        accessToken(env).then(tokenData => {

            const token = tokenData.Token.AccessToken;

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 3,
                AccessToken: token
            }

            var queue = async.queue(function (product, queueCB) {

                var url = `${config.basePath}/Carts/Add/${config.MerchantId}/${product.mapping.productId}/0/${product.quantity}/delveryMode=H`;

                const options = { headers: headers };

                _fire(config, url, 'GET', options).then(result => {
                    if (result.messageCode === "1004") {
                        queueCB(null, result);
                    } else {
                        queueCB(result);
                    }
                }).catch(e => {
                    queueCB(e);
                });

            });

            queue.push(productList, (err, result) => {
                if (err) {
                    error.push(err);
                    productList = [];// make it empty so that the queue wont proceed;
                    reject(err);
                    return;
                }
                if (result) {
                    cartResult.push(result);
                }
            });

            queue.drain = function () {
                resolve({ result: cartResult, error: error });
            }

        }).catch(e => reject(e));

    });
}

/**
 * 
 */
function viewCart(env, fc) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        console.log(chalker.blue.bold(` [ ${env.msg} ] Fetching cart for Merchant-Id ${config.MerchantId} .....`));

        accessToken(env).then(tokenData => {

            const token = tokenData.Token.AccessToken;

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 1,
                AccessToken: token
            };

            const url = `${config.basePath}/Carts/Cart/${config.MerchantId}`;

            const options = { headers: headers };

            _fire(config, url, 'GET', options).then(result => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error(`Cart Not Found`));
                }
            }).catch(e => reject(e));

        }).catch(e => reject(e));

    });
}

/**
 * 
 */
function removeFromCart() {
    return new Promise((resolve, reject) => {

    });
}

/** 
 * 
*/
function replaceItemsInCart() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * Place Order
 * TODO:::
 *  - Get Access Token;
 *  - Get shipping modes;
 *  - Change shipping mode in cart;
 *  - Checkout / Add to cart;
 *  - Query order information , after checkout and resolve;
 */
function checkOut(env, fc) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);
        var params = { env: env, fc: fc, config: config };

        async.waterfall([
            _getToken(params),
            _getShipmentModes,
            _changeShippingMode,
            _placeOrder,
            _getOrder
        ], function (err, order) {
            if (err)
                reject(err);
            else
                resolve(order);
        });

        function _getToken(params) {
            return function (callback) {

                accessToken(params.env).then(token => {
                    params.token = token.Token.AccessToken;
                    callback(null, params);

                }).catch(e => callback(e));
            }
        }

        function _getShipmentModes(params, callback) {

            const config = params.config;

            const url = `${config.basePath}/Carts/ShippingMode/${config.MerchantId}`;

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 1,
                AccessToken: params.token
            };

            const options = { headers: headers };

            _fire(config, url, 'GET', options).then(mode => {
                params.shipmentMode = mode.Carts.ShippingOptions[0].ShippingMode;
                callback(null, params);
            }).catch(e => callback(e));
        }

        function _changeShippingMode(params, callback) {

            const config = params.config;

            const url = `${config.basePath}/Carts/ShippingMode/${config.MerchantId}/${params.shipmentMode}/Change/true`;

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 1,
                AccessToken: params.token
            };

            const options = { headers: headers };

            _fire(config, url, 'GET', options).then(result => {
                params.modeChanged = true;
                callback(null, params);
            }).catch(e => callback(e));

        }

        function _placeOrder(params, callback) {

            const config = params.config;

            const url = `${config.basePath}/Order/PlaceOrder/${config.MerchantId}`;

            const query = {
                paymentOption: 'COD',
                paymentType: 'Credit',
                gatewayId: '42',
                channelType: null
            }

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 1,
                AccessToken: params.token
            };

            const options = { query: query, headers: headers };

            _fire(config, url, 'POST', options).then(result => {
                params.checkout = result;
                params.orderId = result.OrderCreationResponse.OrderID;
                callback(null, params);
            }).catch(e => callback(e));

        }

        function _getOrder(params, callback) {
            var orderId = params.orderId;
            getOrder(params.env, orderId).then(order => {
                params.order = order;
                callback(null, params);
            }).catch(e => callback(e));
        }

    });
}

/**
 * 
 */
function getOrder(env, orderId) {
    return new Promise((resolve, reject) => {

        var config = _getConfig(env);

        const url = `${config.basePath}/Order/${config.MerchantId}/${orderId}`;

        _fire(config, url, 'GET', null).then(order => {
            resolve(order);
        }).catch(e => callback(e));

    });
}

/**
 * 
 */
function cancelOrder() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * 
 */
function trackOrder() {
    return new Promise((resolve, reject) => {

    });
}

/**
 * 
 */
function shippmentModes(env, fc) {
    return new Promise((resolve, reject) => {

        const config = _getConfig(env);

        accessToken(env).then(token => {

            const url = `${config.basePath}/Carts/ShippingMode/${config.MerchantId}`;

            const headers = {
                CKey: config.consumerKey,
                Skey: config.secretkey,
                Ver: 1,
                AccessToken: token.Token.AccessToken
            };

            const options = { headers: headers };

            _fire(config, url, 'GET', options).then(modes => {
                resolve(modes);
            }).catch(e => reject(e));

        }).catch(e => reject(e));

    });
}

/**
 * 
 */
function _getConfig(env) {
    if (env.isProd) {
        return walmartConfig.production;
    } else {
        return walmartConfig.sandbox;
    }
}

function getOAuth(config, url, method, params) {

    const oauth = OAuth({
        consumer: {
            key: config.consumerKey,
            secret: config.secretkey
        },
        signature_method: 'HMAC-SHA1',
        nounce_length: 32,
        version: '1.0',
        hash_function(base_string, key) {
            return crypto.createHmac('sha1', key).update(base_string).digest('base64');
        }
    });

    const _url = params.query && !_.isEmpty(params.query) ? `${url}?${qs.stringify(params.query)}` : url;

    const _method = method

    const options = {
        url: _url,
        method: _method,
    };

    return oauth.authorize(options);
}

function _fire(config, url, method, params) {
    return new Promise((resolve, reject) => {

        if (!url) {
            reject(new Error(`URL cannot be empty for making HTTP call...`));
            return
        }
        if (!method) {
            reject(new Error(`HTTP method cannot be empty...`));
            return
        }
        if (!config) {
            reject(new Error(`Config is required to make requests to the integration layer....`));
            return
        }

        try {

            params = params ? params : {};

            const oAuth = getOAuth(config, url, method, params);

            const _headers = params.headers && !_.isEmpty(params.headers) ? Object.assign({ "Accept": "application/json" }, params.headers) : { "Accept": "application/json" };

            const _query = params.query && !_.isEmpty(params.query) ? Object.assign(params.query, oAuth) : oAuth;

            const _body = params.body && !_.isEmpty(params.body) ? params.body : {};

            const options = {
                url: url,
                method: method,
                qs: _query,
                form: _body,
                headers: _headers,
            }

            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                } else if (body) {

                    var data = JSON.parse(body);

                    if (data.messageCode === '1004') {
                        resolve(data);
                    } else {
                        reject(data);
                    }

                } else {
                    reject(new Error("Integration layer , Error occured , could not get response.."));
                }
            });

        } catch (e) {
            reject(e);
        }

    });
}


module.exports = {
    login: login,
    logout: logout,
    getAllCategories: getAllCategories,
    getAllParentCategories: getAllParentCategories,
    getCategoryById: getCategoryById,
    getParentCategory: getParentCategory,
    getCategoryChildren: getCategoryChildren,
    getProductsByCategory: getProductsByCategory,
    getAllProducts: getAllProducts,
    getProductById: getProductById,
    productByLocation: productByLocation,
    volumetricPricing: volumetricPricing,
    inventoryBuckets: inventoryBuckets_V2,//inventoryBuckets,
    startSession: startSession,
    accessToken: accessToken,
    addToCart: addToCart,
    viewCart: viewCart,
    removeFromCart: removeFromCart,
    replaceItemsInCart: replaceItemsInCart,
    checkOut: checkOut,
    getOrder: getOrder,
    cancelOrder: cancelOrder,
    trackOrder: trackOrder,
    shippmentModes: shippmentModes
}