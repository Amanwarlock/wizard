var crud = null,
    logger = null;
var cuti = require("cuti");
var http = require("http");

var e = {};

function getCustomerInfo(_id) {
    return cuti.request.getElement("customer", _id, "fName,lName,mobile");
}

function getCategory(_id) {
    return cuti.request.getElement("category", _id, "name");
}

function getBrand(_id) {
    return cuti.request.getElement("brand", _id, "name");
}

function getProductDetails(_product) {
    return new Promise((resolve, reject) => {
        cuti.request.getElement("product", _product.id, "name,barcode,invoice_seperately,mrp,images,brand,category,tax,HSNNumber,skuCode,allowReserveOrder,transferPrice,mapping").then(
            _p => {
                _p.quantity = _product.quantity;
                _p.mrp = _product.mrp;
                _p.offer = _product.offer;
                resolve(_p);
            },
            () => reject()
        );
    });
}

function getDeal(_deal, _type, franchise) {
    return new Promise((resolve, reject) => {
        cuti.request.getElement("deal", "franchiseDeal/" + _deal.id + "/" + franchise).then(
            _fatDeal => {
                var productList = _fatDeal.product.map(product => getProductDetails(product));
                var brand = getBrand(_fatDeal.brand[0]);
                var category = getCategory(_fatDeal.category[0]);
                Promise.all([Promise.all(productList), brand, category]).then(
                    _pbc => {
                        _pbc[1].id = _pbc[1]._id;
                        _pbc[2].id = _pbc[2]._id;
                        var invoice_seperately = false;
                        var subOrder = {
                            id: _fatDeal._id,
                            allowReserveOrder: _fatDeal.allowReserveOrder,
                            name: _fatDeal.name,
                            shipsIn: _fatDeal.shipsIn,
                            mrp: _fatDeal.mrp,
                            memberPrice: _fatDeal.memberPrice,
                            b2bPrice: _fatDeal.b2bPrice,
                            images: _fatDeal.images,
                            category: _pbc[2],
                            brand: _pbc[1],
                            products: [],
                            // price: _type == "Retail" ? _fatDeal.memberPrice : _fatDeal.b2bPrice,
                            orgPrice: _type == "Retail" ? _fatDeal.memberPrice : _fatDeal.b2bPrice
                            //price: (_type == "Retail" ? _fatDeal.memberPrice : _fatDeal.b2bPrice) * _deal.quantity
                        };
                        _pbc[0].forEach(_product => {

                            _product.taxInfo = { tax: _product.tax };
                            _fatDeal.product.map((el) => {
                                if (el.id == _product._id) {
                                    _product.taxInfo.isDefaultHSN = el.isDefaultHSN;
                                    _product.taxInfo.spMargin = el.spMargin;
                                    _product.offer = el.offer;

                                }
                            });
                            invoice_seperately = invoice_seperately || _product.invoice_seperately;
                            //invoice_seperately = false; //invoice_seperately || _product.invoice_seperately;
                            _product.quantity *= _deal.quantity;
                            if(isNaN(_product.quantity)){
                                _product.quantity = _deal.quantity;
                            }
                            _product.id = _product._id;
                            delete _product._id;
                            _product.barcodeScanned = false;
                            _product.HSNNumber = _product.HSNNumber;
                            subOrder.products.push(_product);
                        });

                        subOrder.invoice_seperately = invoice_seperately;
                        resolve(subOrder);
                    })
                    .catch( error => {
                         reject({ mssage: "Unable to fetch deal data" })
                    });
            }
        );
    });
}


function getShippingAddress(_fr) {
    return {
        line1: _fr.address.line1,
        line2: _fr.address.line2,
        landmark: _fr.address.landmark,
        city: _fr.city,
        district: _fr.district,
        state: _fr.state,
        pincode: _fr.pincode
    };
}

e.init = (_crud, _logger) => {
    crud = _crud;
    logger = _logger;
};

e.pendingOrderProductQty = (req, res) => {
    var productId = crud.swagMapper(req)["id"];
    var whId = crud.swagMapper(req)["whId"];
    /*var q = [
        { "$unwind": "$subOrders" },
        { "$match": { "subOrders.status": "Confirmed" } },
        { "$unwind": "$subOrders.products" },
        { "$match": { "subOrders.products.id": productId } },
        { "$group": { "_id": null, "totalQuantity": { "$sum": "$subOrders.products.quantity" } } }
    ];*/

    var q = [
        {
            "$match": {
                "typeOfOrder": { $in: ["SK", "WMFORDERS", "RESERVEORDERS"] }, "source": whId, "subOrders.products.id": productId, "subOrders.status": "Confirmed",
                "subOrders.readyForBatching": false
            }
        },
        { $project: { "_id": 1, "subOrders": 1 } }
    ];
    crud.model.aggregate(q).exec().then(docs => {
        if (docs.length) {
            var ttlQty = 0;
            var blkQty = 0;
            docs.forEach(doc => {
                doc.subOrders.forEach(sOrder => {
                    sOrder.blockedProducts.forEach(blk => {
                        if (blk.productId == productId)
                            blkQty = blkQty + blk.quantity;
                    });
                    sOrder.products.forEach(prd => {
                        if (prd.id == productId)
                            ttlQty = ttlQty + prd.quantity;
                    });
                });
            });
            docs = ttlQty - blkQty;
        } else {
            docs = 0;
        }
        res.status(200).json(docs);
    }, err => res.status(500).json({ message: err.message }));
};
/**
 * so we need to capture customer and billing address and shipping address when the cart checks out
 */
e.fillMissingInfo = (_order, _data) => {
    if (_data == undefined)
        _data = {};

    return new Promise((resolve, reject) => {
        if (_data.shippingAddress) _order.shippingAddress = _data.shippingAddress;
        else _order.shippingAddress = getShippingAddress(_order.franchise);
        if (_data.paymentMode) _order.paymentMode = _data.paymentMode;
        if (_data.transactionId) _order.transactionId = _data.transactionId;
        if (_data.billingAddress) _order.billingAddress = _data.billingAddress;

        _order.paymentStatus = "Paid";
        _order.status = "Confirmed";
        _order.batchEnabled = true;
        _order.save(err => {
            resolve(_order);
        });
        // getFulfillmentCenter(_order.source).then(fc => {
        //     var fcAddress = getFcAddress(fc);
        //     var fcFinanceDetails = getFcFinancedetails(fc);
        //     _order.warehouseAddress = fcAddress;
        //     _order.warehouseDetails = fcFinanceDetails;
        //     _order.save(err => {
        //         resolve(_order);
        //     });
        // }).catch(e => reject(e));
    });
};

function getFulfillmentCenter(whId) {
    return new Promise((resolve, reject) => {
        var _select = ["_id", "whId", "address", "state", "district", "town", "pincode", "name", "companyName", "financeDetails","isSkWarehouse","contacts"];
        var _path = `/fulfillmentcenter?filter=${encodeURIComponent(JSON.stringify({ "whId": whId }))}&select=${_select}`;
        _fireHttpRequest("wh", _path, "GET", null).then(fc => {
            if (fc && fc.length)
                resolve(fc[0]);
            else
                reject(new Error(`Could not find fulfillment center`));
        }).catch(e => reject(e));
    });
}

function getFcAddress(fc) {
    if (fc) {
        var contactNo = (fc.contacts.length) ? (fc.contacts[0].mobile).toString() : "";
        return {
            "name": fc.name,
            "companyName": fc.companyName,
            "doorNo": fc.address ? fc.address.door_no : "",
            "street": fc.address ? fc.address.street : "",
            "landmark": fc.address ? fc.address.landmark : "",
            "city": fc.town,
            "district": fc.district,
            "state": fc.state,
            "pincode": fc.pincode,
            "mobile": contactNo
        }
    } else {
        return;
    }
}

function getFcFinancedetails(fc) {
    if (fc) {
        return {
            "gstno": fc.financeDetails ? fc.financeDetails.gstno : "",
            "serviceTax": fc.financeDetails ? fc.financeDetails.serviceTax : "",
            "vat": fc.financeDetails ? fc.financeDetails.vat : "",
            "cinno": fc.financeDetails ? fc.financeDetails.cinno : ""
        }
    } else {
        return;
    }
}

e.createSubOrders = (_deal, _type, franchise) => {
    return new Promise((resolve, reject) => {
        getDeal(_deal, _type, franchise).then(
            _suborder => {
                _suborder.quantity = _deal.quantity;
                _suborder.isShowCaseDeal = _deal.isShowCaseDeal;
                _suborder.price = _deal.price;
                _suborder.orgPrice = _deal.orgPrice;
                _suborder.couponDisc = _deal.couponDisc;
                _suborder.kingsaleDisc = _deal.kingsaleDisc;
                _suborder.kingsale = _deal.kingsale;
                _suborder.delivery_chalan = _deal.delivery_chalan;
                _suborder.b2bPrice = _deal.b2bPrice;
                _suborder.shippingCharges = _deal.shippingCharges;
                _suborder.shipsIn = _deal.shipsIn;
                _suborder.memberPrice = _deal.memberPrice;
                _suborder.logs = [];
                _suborder.logs.push({ "status": "Order Placed", createdAt: new Date() });
                resolve(_suborder);
            },
            err => reject(err ? err : { mssage: "Unable to create sub orders" })
        );
    });
};

/*
    - This has been commented as this no longer needed for new reservation design;
    - This code was causing subOrders status to be in pending state;
    - Commented by - Aman kareem <aman.kareem@storeking.in>
 */
/* var updateBlockedDeals = (document) => {
    if (document.status == "Confirmed" && document.subOrdersCreated && document.fulfilledBy == "MPS0") {
        if (document.subOrders.length > 0) {
            return Promise.all(document.subOrders.map((subOrders, subIndex) => {
                if (subOrders.snapshots.length > 0) {
                    return new Promise(res => {
                        return Promise.all(subOrders.snapshots.map((el, index) => {
                            return new Promise(resolve => {
                                if (!el.productId) {
                                    cuti.request.getUrlandMagicKey("wh")
                                        .then(options => {
                                            options.path += "/snapshot/" + el.snapShotId;
                                            http.request(options, response => {
                                                var data = "";
                                                response.on("data", _data => data += _data.toString());
                                                response.on("end", () => {
                                                    data = JSON.parse(data);
                                                    el.productId = data.productId;
                                                    el.ref = data.ref;
                                                    el.expiryDate = data.shelfLife;
                                                    el.location = data.location;
                                                    el.rackId = data.rackId;
                                                    el.area = data.area;
                                                    el.binId = data.binId;
                                                    el.mrp = data.mrp;
                                                    el.purchasePrice = data.purchasePrice;
                                                    resolve(el);
                                                });
                                            }).end();
                                        });
                                } else {
                                    resolve(el);
                                }
                            })
                        })).then((snapShots) => { if (snapShots.length > 0) document.subOrders[subIndex].snapshots = snapShots; return res(); });
                    });
                }
            })).then(() => {
                return Promise.all(document.subOrders.map((el, index) => {
                    return new Promise(resolve => {
                        if (!el.readyForBatching) {
                            var blockCount = {};
                            var blockedProducts = [];
                            var requestedProducts = [];
                            if (el.snapshots.length > 0) {
                                el.snapshots.forEach(snapShot => {
                                    blockCount[snapShot.productId] = blockCount[snapShot.productId] ? blockCount[snapShot.productId] + snapShot.quantity : snapShot.quantity;
                                });
                            }
                            var blockKeys = Object.keys(blockCount);
                            var blockedProductCounts = [];
                            if (blockKeys.length) {
                                blockKeys.forEach(key => {
                                    blockedProductCounts[key] = blockCount[key];
                                    blockedProducts.push({
                                        productId: key,
                                        quantity: blockCount[key]
                                    });
                                });
                            }
                            el.blockedProducts = blockedProducts;
                            var requestCount = {};
                            el.products.forEach(product => {
                                product.blockedQty = blockedProductCounts[product.id] ? blockedProductCounts[product.id] : 0;
                                requestCount[product.id] = requestCount[product.id] ? requestCount[product.id] + product.quantity : product.quantity;
                            });
                            var requestKeys = Object.keys(requestCount);
                            var flag = true;
                            requestKeys.forEach(key => {
                                requestedProducts.push({
                                    productId: key,
                                    quantity: requestCount[key]
                                });
                                flag = blockCount[key] == requestCount[key] ? flag : false;
                            });
                            flag = requestKeys.length == blockKeys.length ? flag : false;
                            el.requestedProducts = requestedProducts;
                            if (el.readyForBatching != flag) {
                                el.readyForBatching = flag;
                            } else if (!el.gotRequestedProducts) {
                                el.gotRequestedProducts = true;
                            }

                            document.subOrders[index] = el;
                            return resolve();
                        }
                        else {
                            document.subOrders[index] = el;
                            return resolve();
                        }
                    });
                }))

            }).then(() => { return document; })
                .catch((err) => console.log("err", err));
        }
    } else {
        return new Promise(res => res(document));
    }
} */

/*
    - This functions implementation is changed as this logic is no longer required for the new reservation flow;
    - Just resolve empty promise in order to maintain the promise chain to the caller;
    - Commented by Aman Kareem <aman.kareem@storeking.in>
 */
var updateBlockedDeals = (document) => {
    return new Promise((resolve, reject) => {
        resolve(document);
    });
}


/**
 * @description Common Http request making function block;
 * @param {*String} _magickey //Redis-Key;
 * @param {*String} _path //API Path;
 * @param {*String} _method // Http method - POST , PUT , GET;
 * @param {*Object} _payload //Requset body;
 */
function _fireHttpRequest(_magickey, _path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_magickey) {
            reject(new Error(`Magic Key cannot be empty for HTTP request.`));
            return;
        }
        if (!_path) {
            reject(`Path cannot be empty for HTTP request.`);
            return;
        }
        if (!_method) {
            reject(`Http Method cannot be empty for HTTP request.`);
            return;
        }
        cuti.request.getUrlandMagicKey(_magickey)
            .then(options => {
                options.path += _path;
                options.method = _method;
                var request = http.request(options, response => {
                    var data = "";
                    response.on('data', _data => data += _data.toString());
                    response.on('end', () => {
                        if (response.statusCode === 200) {
                            try {
                                data = JSON.parse(data);
                                resolve(data);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error(data));
                        }
                    });
                });
                if ((_method === 'POST' || _method === 'PUT') && !_.isEmpty(_payload))
                    request.end(JSON.stringify(_payload));
                else
                    request.end();

            }).catch(e => reject(e));
    });
}

e.testFunction = () => {
    crud.model.findOne({ _id: "OR2017051625" })
        .exec().then((docs) => updateBlockedDeals(docs)).then
        (doc => {
            console.log("doc", JSON.stringify(doc));
        });
};


e._prepareCanResOrderQuery = () => {
    return new Promise((_res, _rej) => {
        var currentDate = new Date();

        var query = [
            {
                "$match": {
                    status: { "$in": ["Processing", "Confirmed", "Partially Shipped", "Partially Delivered"] },
                    typeOfOrder: { $in: ["RESERVEORDERS", "WMFORDERS"] },
                    paymentStatus: { "$nin": ["Reverted"] },
                    stockAllocation: { "$in": ["NotAllocated", "PartialAllocated"] },
                    subOrders: {
                        "$elemMatch": {
                            invoiced: false,
                            readyForBatching: false,
                            status: { $in: ["Confirmed"] }
                        }
                    },
                    "createdAt": {
                        $lte: new Date(currentDate.setDate(currentDate.getDate() - 4))
                    }
                }
            },
            {
                "$addFields": {
                    data: {
                        "$map": {
                            input: "$subOrders",
                            in: {
                                _id: "$$this._id",
                                blockedProducts: "$$this.blockedProducts",
                                requestedProducts: "$$this.requestedProducts"
                            }
                        }
                    }
                }
            },
            { $unwind: "$subOrders" },
            {
                "$match": {
                    "subOrders.invoiced": false,
                    "subOrders.readyForBatching": false,
                    "subOrders.status": { $in: ["Confirmed"] },
                }
            },
            { "$sort": { "createdAt": 1 } },
            { "$project": { "_id": 1 } }

        ];

        return _res(query);
    });
}

module.exports = e;
module.exports.updateBlockedDeals = updateBlockedDeals;
module.exports._fireHttpRequest = _fireHttpRequest;
module.exports.getFulfillmentCenter = getFulfillmentCenter;
module.exports.getFcAddress = getFcAddress;
module.exports.getFcFinancedetails = getFcFinancedetails;