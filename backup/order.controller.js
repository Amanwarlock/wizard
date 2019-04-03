"use strict";
var Mongoose = require("mongoose");
var http = require("http");
var request = require("request");
var SMCrud = require("swagger-mongoose-crud");
var definition = require("../helpers/order.model.js");
var _ = require("lodash");
var moment = require("moment");
var orderHelper = require("../helpers/order.helper.js");
var moveToEs = require("./moveToEs");
var orderHooks = require("../helpers/order.hooks");
var es_url = process.env.ES_URL || "localhost:9200";
var int_layer_url = process.env.INTEGRATION_LAYER_URL;
var events = require("../helpers/events");
var cuti = require("cuti");
var log4js = cuti.logger.getLogger;
var logger = log4js.getLogger("oms");
var async = require("async");
//cuti.counter.setDefaults("invoiceNos", 100000001);
var hooks = require("../helpers/order.hooks");
var mpshooks = require("../helpers/mps.hooks");
var masterAuditLogs = require("./../helpers/masterAuditLog.helper.js");
var constants = require("../helpers/constants.js");
var queryHelper = require("../helpers/queryHelper.js");


var wmfIntergration = require("wmfintegration");
wmfIntergration = new wmfIntergration();
wmfIntergration.init(process.env, logger);

var schema = new Mongoose.Schema(definition);
schema.pre("save", hooks.generateId);
schema.pre("save", mpshooks.mpsValidation); // mps
schema.pre("save", mpshooks.getCommission); //  mps
schema.pre("save", hooks.applyCoupon);
//schema.pre("save",masterAuditLogs.auditLog);
schema.post("save", hooks.sellerPayment);
schema.post("save", cuti.moveToES.moveToES);
//schema.post("save", moveToEs.moveToESHook);
schema.post("save", mpshooks.makePayments); // mps
schema.post("save", mpshooks.getLogisticCommission); // mps
schema.post("save", mpshooks.cullingOrders); // mps
// schema.post("save", hooks.updateCouponStatus); // coupon
schema.post("save", hooks.sendNotification);
schema.post("save", hooks.setSchedule);
schema.post("save", hooks.invokeCouponGeneration);
schema.post("save", hooks.removeCoupon);

var fields = {
    franchise: {
        master: "franchise",
        type: "ComplexKV",
        key: "id"
    },
    dealList: {
        master: "deal",
        type: "ComplexArray",
        key: "id"
    },
    customer: {
        master: "customer",
        type: "ComplexKV",
        key: "id"
    },
    source: {
        master: "franchise",
        type: "KV"
    }
};
cuti.moveToES.init(crud, "oms", logger, fields);
var crud = new SMCrud(schema, "omsMaster", logger);
orderHelper.init(crud, logger);
var nonTrackingFields = ["lastUpdated", "createdBy", "createdAt", "__v", "snapshotCreated", "ledgerReference"];
masterAuditLogs.init(crud, logger, nonTrackingFields, "Physical Order");
var orderController = require("./order.controller.js");
var orderReservationCtrl = require("./order.reservation.controller");
var orderManagementCtrl = require("./order.mgmt.controller");
var mpsController = require("./mps.controller.js");
var invoiceController = require("./invoice.controller.js");
var inwardScanBatchController = require("./inwardScanBatch.controller.js");
//var logisticController = require("./logistic.controller.js"); 
var elasticController = require("./elastic.controller");
elasticController.initialize("http://localhost:9200", "oms", "deleted");
mpsController.init(crud, logger);
orderReservationCtrl.init(crud, orderManagementCtrl);
orderManagementCtrl.init(crud);
logger = null;
var puttu = null, cartController = null;

function init(_logger, _puttu, _cartController) {
    logger = _logger;
    puttu = _puttu;
    cartController = _cartController;
}

function _requestHttp(service, path, method, params, cb) {
    var err = "Error";
    if (method != "GET")
        params = JSON.stringify(params);
    cuti.request.getUrlandMagicKey(service).then(options => {
        options.method = method;
        options.path += "/" + path;
        if (options.method == "GET" && params.length > 0) {
            options.path += "?" + params;
        }
        if (method == "GET")
            params = "";
        http.request(options, response => {
            var data = "";
            response.on("data", _data => data += _data.toString("utf8"));
            if (response.statusCode == 200) {
                response.on("end", () => {
                    if (data)
                        cb(null, JSON.parse(data));
                    else
                        cb(err, "");
                });
            } else
                return cb(err, "");
        }).end(params);
    }).catch(err => {
        cb(err);
    });
    //}
    //});
}

function getRecentOrders(req, res) {
    var ids = crud.swagMapper(req)["id"];
    crud.model.find({
        "franchise.id": {
            $in: ids.split(",")
        }
    }).sort({
        createdAt: 1
    }).exec()
        .then(documents => {
            var deals = [];
            var obj = {};
            documents.map(order => {
                order.deals.forEach(el => {
                    if (!obj[el.id]) {
                        obj[el.id] = 1;
                        deals.push({
                            dealId: el.id,
                            franchise: order.franchise
                        });
                    }
                });
            });
            res.status(200).json(deals);
        });
}
/**
 * Fetches purchase order and calls Initiate payment function for purchase order
 * This gets called once the order gets confirmed
 * @param {*} poOrderId 
 */
function paymentForPurchaseOrder(poOrderId) {
    return new Promise(resolve => {
        crud.model.findOne({
            _id: poOrderId
        }).exec()
            .then((doc) => {
                if (doc) {
                    var transactionId = doc.transactionId;
                    var transactionDetails = {
                        "transactionId": transactionId,
                        "franchise": doc.franchise
                    };
                    initiatePurchaseOrderPayment(transactionDetails)
                        .then(transactionData => {
                            resolve();
                        })
                        .catch(error => {
                            var errorMsg = "Purchase Order payment is failed with error" + poOrderId;
                            resolve();
                        });
                }
            })
            .catch(error => {
                resolve();
            });
    });
}
/**
 * Function calls initiate payment API for PO 
 * @param {*} transactionDetails 
 */
function initiatePurchaseOrderPayment(transactionDetails) {

    return new Promise((resolve, reject) => {

        var reqBody = {
            "paymentMode": "Cash",
            "billingAddress": {
                "line1": transactionDetails.franchise.address.door_no,
                "line2": transactionDetails.franchise.address.full_address,
                "landmark": transactionDetails.franchise.address.landmark,
                "city": transactionDetails.franchise.city, "district": transactionDetails.franchise.district,
                "state": transactionDetails.franchise.state, "pincode": transactionDetails.franchise.pincode
            }
        };
        cuti.request.getUrlandMagicKey("oms").then(options => {
            options.path += "/order/" + transactionDetails.transactionId + "/initiatePayment?useWallet=true&transType=transId";
            options.method = "POST";
            http.request(options, response => {
                logger.audit("[dealInformation]", response.statusCode, options.path);
                if (response.statusCode == 200) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        data = JSON.parse(data);
                        resolve(data);
                    });

                } else if (response.statusCode == 400) {
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        resolve({});
                    });

                } else {
                    resolve({});
                }

            }).end(JSON.stringify(reqBody));
        });

    });
}
/**
 * This function adds po deals to cart
 * @param {*} dealData 
 * @param {*} franchiseId 
 */
function addPODealToCart(dealData, franchiseId) {
    return new Promise((resolve, reject) => {
        cuti.request.getUrlandMagicKey("oms").then(options => {
            options.path += "/order/cart?type=B2B&id=" + franchiseId.trim();
            options.method = "POST";
            http.request(options, response => {
                if (response.statusCode == 200) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        data = JSON.parse(data);
                        resolve(data);
                    });
                }
                else if (response.statusCode == 400) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        data = JSON.parse(data);
                        if (data && data.message) {
                            reject(new Error("Error while accessing the cart data"));
                        }
                    });
                }
                else {
                    reject(new Error("Error while accessing the cart data"));
                }
            }).end(JSON.stringify(dealData));
        });
    });
}

/**
 * This function is used to create po for single seller and called by createPOForMultiple sellers function
 * @param {*} poOrders 
 * @param {*} franchiseId 
 * @param {*} sellerId 
 */
function createPoForSeller(poOrders, franchiseId, sellerId) {

    return new Promise((resolve, reject) => {

        var promiseCartArray = [];
        for (var i = 0; i < poOrders.length; i++) {
            var poOrder = poOrders[i];
            var dealData = poOrder.dealInfo;
            dealData.isPurchaseOrder = true;
            dealData.isPurchaseOrderForSFMF = true;
            var aPromise = addPODealToCart(dealData, franchiseId);
            promiseCartArray.push(aPromise);
        }

        Promise.all(promiseCartArray).then(cartDataArray => {
            checkoutPurchaseOrderCart(cartDataArray[0], franchiseId)
                .then(function (response) {
                    if (response.orders && response.orders.length > 0) {
                        var orderObject = response.orders[0];
                        resolve(orderObject);
                    }
                }, function (error) {
                    reject(error);
                });
        });
    });
}


/**
 * This function will check out sf/mf cart for automatic po 
 * This is called by createPoForSeller method
 * @param {*} cartDetails 
 * @param {*} franchiseId 
 */
function checkoutPurchaseOrderCart(cartDetails, franchiseId) {

    return new Promise((resolve, reject) => {
        var body = {
            "cartid": cartDetails._id,
            "remarks": "This Automatic order placed for seller",
            "customer": franchiseId,
            "isPurchaseOrder": 1
        };
        cuti.request.getUrlandMagicKey("oms").then(options => {
            options.path += "/order/cart/checkout?type=B2B&id=" + franchiseId.trim();
            options.method = "POST";
            http.request(options, response => {
                if (response.statusCode == 200) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        data = JSON.parse(data);
                        resolve(data);
                    });
                } else {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        data = JSON.parse(data);
                        reject(new Error("Checkout error while creating purchase order"));
                    });

                }
            }, function (error) {
                reject(error);
            }).end(JSON.stringify(body));

        });
    });
}
/**
 * This function creates automatic po for any order when needed for sf/mf
 * PO is created by following steps
 * - Adding deal to seller's cart
 * - Checking out cart
 * - initiating payment for order
 * - Even if payment fails, order will be created in pending status
 * - Same addDealToCart, checkout , initiate payment api which is used to place order is used for automatic po
 * @param {*} orderData 
 */
function createAutomaticPurchaseOrdersIfAny(orderData) {
    return new Promise((resolve, reject) => {
        var poOrders = orderData.purchaseOrdersForSeller;
        if (poOrders && poOrders.length > 0) { }
        else {
            resolve({});
            return;
        }
        var sellerFranchiseId = orderData.sellerInfo.sellerFranchiseId;
        var fullfilledById = orderData.fulfilledBy;
        createPoForSeller(poOrders, sellerFranchiseId, fullfilledById)
            .then(orderData => {
                resolve(orderData);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function createSKOrder(orderData) {
    return new Promise((resolve, reject) => {
        orderData.date = new Date();
        orderData.orderAmount -= orderData.discount;
        createAutomaticPurchaseOrdersIfAny(orderData)
            .then(poOrderData => {
                if (orderData.purchaseOrdersForSeller && orderData.purchaseOrdersForSeller.length > 0 && poOrderData) {
                    delete orderData.purchaseOrdersForSeller;
                    var orderId = poOrderData._id;
                    orderData.linkedPurchaseOrderId = orderId;
                }
                crud.model.create(orderData, function (err, doc) {
                    if (!err) {
                        doc.subOrders.forEach((_s, _i) => {
                            _s._id = doc._id + "_" + (_i + 1);
                            _s.status = "Pending";
                        });
                        if (doc && doc.cancelationTat) {
                            doc.cancellationDateAndTime = new Date(doc.createdAt.setMinutes(doc.createdAt.getMinutes() + doc.cancelationTat));
                        } else {
                            doc.cancellationDateAndTime = new Date(doc.createdAt.setMinutes(doc.createdAt.getMinutes() + 20));
                        }
                        doc.save();
                        resolve(doc);
                    } else {
                        reject(err);
                    }
                });
            })
            .catch(
                error => {
                    reject(error);
                });
    });
}

function updateHoldQuantities(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];
    var quantity = params["quantity"];
    var snapShotId = params["snapShotId"];
    // /"subOrders.gotRequestedProducts":false,
    var aggregate = [
        {
            $match: {
                "subOrders.invoiced": false,
                "subOrders.status": {
                    $in: ["Confirmed", "Processing"]
                }
            }
        },
        {
            $project: {
                "subOrders._id": 1,
                "subOrders.blockedProducts.productId": 1,
                "subOrders.requestedProducts.productId": 1,
                "subOrders.blockedProducts.quantity": 1,
                "subOrders.requestedProducts.quantity": 1,
                "res": {
                    "$cond": {
                        "if": {
                            "$gt": ["$subOrders.requestedProducts.quantity", "$subOrders.blockedProducts.quantity"]
                        },
                        "then": true,
                        "else": false
                    }
                }
            }
        },
        {
            $match: {
                "res": true
            }
        },
        {
            $match: {
                "subOrders.requestedProducts.productId": id
            }
        }
    ];
    //Pack Of 2 ProductId /// ProductId
    crud.model.aggregate(aggregate).sort({
        "createdAt": 1
    }).then((docs) => {
        if (docs.length) {
            docs.reduce((prev, curr) =>
                prev.then(() => {
                    return crud.model.findOne({
                        "_id": curr._id
                    }).exec()
                        .then(doc => holdStockForConfirmedOrder(doc, id, snapShotId))
                        .then(() => {
                            return Promise.resolve();
                        })
                        .catch((err) => {
                            logger.error("error", err.stack);
                        });
                    //.then((result) => resolve(result))
                }), new Promise(resolve => resolve(quantity)))
                .then(() => res.status(200).json({
                    message: "Blocking Quantities"
                }))
                .catch(err => logger.error("err", err));
        } else {
            res.status(200).json({
                message: "Blocking Quantities"
            });
        }
    });
}

function chkSnapshotCount(snapShotId) {
    return new Promise((resolve, reject) => {
        cuti.request.getUrlandMagicKey("wh").then(options => {
            var filter = {
                "holdStatus": "Confirmed"
            };
            options.path += "/snapshot/" + snapShotId;
            http.request(options, response => {
                var data = "";
                response.on("data", _data => data += _data.toString("utf8"));
                response.on("end", () => {
                    var whData = JSON.parse(data);
                    resolve(whData);
                });
            }).end();
        });
    });
}

function updateHoldOrderSnapShots(_order, sOrder, blockPrdObj, snpData, avlQty, id) {
    return new Promise((resolvePromise, rejectPromise) => {
        sOrder.snapshots.push({
            snapShotId: snpData._id,
            productId: snpData.productId,
            expiryDate: snpData.expiryDate,
            quantity: avlQty,
            mrp: snpData.mrp,
            ref: snpData.ref,
            location: snpData.location,
            area: snpData.area,
            rackId: snpData.rackId,
            binId: snpData.binId,
            type: "Reserved"
        });
        if (blockPrdObj.length > 0) {
            sOrder.blockedProducts.map((product) => {
                if (product.productId == id)
                    product.quantity = product.quantity + avlQty;
            });
        } else
            sOrder.blockedProducts.push({
                "productId": id,
                "quantity": avlQty
            });
        _order.save((err, document) => {
            updateStockAllocate(_order._id)
                .then(() => {
                    return updateStockStatus(snpData._id);
                })
                .then(() => resolvePromise());
        });
    });
}

function holdStockForConfirmedOrder(_order, id, snapId, i) {
    if (i == undefined)
        i = 0;
    if (_order.subOrders[i] == undefined)
        return;
    // Check quantity before exec
    // loop suborders
    //  get pending stock for suborder w.r.t productid 
    // check if snapshot stock is good to go else skip and proceed
    // if good to go then calc snap reduce qty for snapshot and do doc save and order doc save 
    var sOrder = _order.subOrders[i];
    var avlQty = 0;
    var blockQty = 0;
    chkSnapshotCount(snapId)
        .then((whData) => {
            if (whData.quantity > 0) {
                var blockPrdObj = sOrder.blockedProducts.filter(product => product.productId == id);
                var blockQtyObj = blockPrdObj.length ? blockPrdObj[0] : {
                    quantity: 0
                };
                var requestPrdObj = sOrder.requestedProducts.filter(product => product.productId == id)[0];
                if (requestPrdObj != undefined) {
                    if (blockQtyObj) {
                        blockQty = blockQtyObj.quantity;
                    }
                    avlQty = requestPrdObj.quantity - blockQty;
                    if (avlQty > whData.quantity)
                        avlQty = whData.quantity;
                    if (avlQty) {
                        var addSnapShotRequest = {
                            snapShotId: snapId,
                            quantity: avlQty,
                            orderId: _order._id,
                            subOrerId: sOrder._id
                        };
                        _requestHttp("wh", "WMF0/inventory/addHoldStock", "PUT", addSnapShotRequest)
                            .then(snpData => {
                                return updateHoldOrderSnapShots(_order, sOrder, blockPrdObj, snpData, avlQty, id)
                                    .then(() => {
                                        return holdStockForConfirmedOrder(_order, id, snapId, i + 1);
                                    });
                            })
                            .catch(err => logger.error("error", err));
                    } else
                        return holdStockForConfirmedOrder(_order, id, snapId, i + 1);
                } else
                    return holdStockForConfirmedOrder(_order, id, snapId, i + 1);
            }
        })
        .then(() => Promise.resolve());
    //  return;
    // return chkSnapshotCount(snapId)
    //     .then((whData) => {
    //         var quantity = whData.quantity; 
    //         var ledgerQty = 0;
    //         if (quantity > 0) {
    //              // console.log("Inside Bliock ---------------------===>",quantity);
    //             var filteredSubOrders = _order.subOrders.filter(el => el.invoiced == false  && ( el.status == "Confirmed" || el.status == "Processing") );
    //             var fremaining=0;
    //             filteredSubOrders.map(fltrOrd=>{
    //                 var flist = fltrOrd.blockedProducts.filter(product => product.productId == id);
    //                 var fblocked = flist.length ? flist[0] : { quantity: 0 };
    //                 var frequested = fltrOrd.requestedProducts.filter(product => product.productId == id)[0];
    //                 if (frequested) {
    //                     var fblockedQty = 0;
    //                     if (fblocked) {
    //                         fblockedQty = fblocked.quantity;
    //                     }
    //                     fremaining = frequested.quantity - fblockedQty;
    //                 }
    //             });
    //             if (filteredSubOrders.length > 0 && fremaining>0) {
    //                 //return new Promise((resolve, reject) => {
    //                     var remaining=0;
    //                    return Promise.all(_order.subOrders.map((subOrders, subIndex) => {
    //                         if (subOrders.readyForBatching == false && subOrders.status == "Confirmed") {
    //                             var list = subOrders.blockedProducts.filter(product => product.productId == id);
    //                             var blocked = list.length ? list[0] : { quantity: 0 };
    //                             var requested = subOrders.requestedProducts.filter(product => product.productId == id)[0];
    //                             if (requested) {
    //                                 var blockedQty = 0;
    //                                 if (blocked) {
    //                                     blockedQty = blocked.quantity;
    //                                 }
    //                                 remaining = requested.quantity - blockedQty;
    //                                 if(remaining<1)    
    //                                     reject();
    //                                 if (quantity<1)
    //                                     reject();
    //                                 if (remaining > quantity)
    //                                     remaining = quantity;
    //                                 console.log("remaining",remaining,list);
    //                                 if(remaining>0)
    //                                 {
    //                                     ledgerQty = ledgerQty + remaining;
    //                                     if (list.length > 0) {
    //                                         subOrders.blockedProducts.map((product,pl) => {
    //                                            if(product.productId == id)
    //                                            {
    //                                                _order.subOrders[subIndex].blockedProducts[pl].quantity = product.quantity + remaining;
    //                                            }
    //                                         });
    //                                         // console.log("list-------1111111111",_order.subOrders[subIndex].blockedProducts);
    //                                         // _order.subOrders[subIndex].blockedProducts = subOrders.blockedProducts.filter(product => product.productId == id);
    //                                         // _order.subOrders[subIndex].blockedProducts[0].quantity = subOrders.blockedProducts[0].quantity + remaining;
    //                                     } else
    //                                         _order.subOrders[subIndex].blockedProducts.push({ "productId": id, "quantity": remaining });
    //                                     var data1 = { snapShotId: snapId, quantity: remaining }
    //                                     // console.log("ssssssssssssssssssss",JSON.stringify(_order.subOrders[subIndex]));
    //                                     return new Promise((resolve1, reject1) => {
    //                                         if(remaining<1)    
    //                                             reject1("Invalid Quantity");
    //                                         if (quantity<1)
    //                                             reject1("Invalid Quantity");
    //                                         cuti.request.getUrlandMagicKey("wh").then(options => {
    //                                             options.path += "/WMF0/inventory/addHoldStock";
    //                                             options.method = "PUT";
    //                                             http.request(options, response => {
    //                                                 var data = "";
    //                                                 response.on("data", _data => data += _data.toString("utf8"));
    //                                                 response.on("end", () => {
    //                                                     var whData = JSON.parse(data);
    //                                                     _order.subOrders[subIndex].snapshots.push({
    //                                                         snapShotId: whData._id,
    //                                                         productId: whData.productId,
    //                                                         expiryDate: whData.expiryDate,
    //                                                         quantity: remaining,
    //                                                         mrp: whData.mrp,
    //                                                         ref: whData.ref,
    //                                                         location: whData.location,
    //                                                         area: whData.area,
    //                                                         rackId: whData.rackId,
    //                                                         binId: whData.binId,
    //                                                         type: "Reserved"
    //                                                     });
    //                                                     //requested.quantity==(remaining+blockedQty)
    //                                                     // var reqPrdCount=0;
    //                                                     // var blockedPrdCount=0;
    //                                                     // _order.subOrders[subIndex].requestedProducts.map(reqPrd=>{
    //                                                     //     reqPrdCount=reqPrdCount+parseInt(reqPrd.quantity);
    //                                                     // });
    //                                                     // _order.subOrders[subIndex].snapshots.map(blockPrd=>{
    //                                                     //     blockedPrdCount=blockedPrdCount+parseInt(blockPrd.quantity);
    //                                                     // });
    //                                                     // console.log("_order.subOrders[subIndex].blockedProducts=====>",_order.subOrders[subIndex].snapshots);    
    //                                                     // console.log("reqPrdCount",reqPrdCount,blockedPrdCount,_order._id);
    //                                                     // if(reqPrdCount==blockedPrdCount)
    //                                                     // {
    //                                                     //     _order.subOrders[subIndex].readyForBatching = true;
    //                                                     //     _order.subOrders[subIndex].gotRequestedProducts = false;
    //                                                     // }
    //                                                     //Reset Quantity
    //                                                     quantity=quantity-remaining;
    //                                                       return _order.save((err,document) => {
    //                                                         return updateStockAllocate(_order._id)
    //                                                         .then(() => {
    //                                                              updateStockStatus(whData._id)
    //                                                             .then(() => {
    //                                                                 var snapShots = [{
    //                                                                     snapShotId: whData._id,
    //                                                                     quantity: ledgerQty
    //                                                                 }];
    //                                                                 updateStockLedger(snapShots, _order._id);
    //                                                             })
    //                                                         })
    //                                                         .then(() => resolve1(_order));
    //                                                     }); 
    //                                                 });
    //                                             }).end(JSON.stringify(data1));
    //                                         });
    //                                     });
    //                                 }else
    //                                     Promise.reject();
    //                             }
    //                             else {
    //                                 Promise.resolve();
    //                             }
    //                         }
    //                         else {
    //                             Promise.resolve();
    //                         }
    //                     }));
    //                 //    return Promise.all(promise)
    //                 //         .then(() => {
    //                 //          
    //                 //     }).catch((err) => { console.log("err", err) });
    //                 //});
    //             }
    //             else {
    //                 Promise.resolve();
    //             }
    //         }
    //         else {
    //             Promise.resolve();
    //         }
    //     }).catch(err => { console.log("err",err); return err; });
}

function updateStockStatus(snapshotId) {
    return new Promise((resolve) => {
        cuti.request.getUrlandMagicKey("wh").then(options => {
            options.path += "/WMF0/inventory/updateHoldStatus/" + snapshotId;
            options.method = "PUT";
            http.request(options, response => {
                var data = "";
                response.on("data", _data => data += _data.toString("utf8"));
                response.on("end", () => resolve());
            }).end();
        });
    });
}

function holdQuantity(_order, count, id) {
    if (count > 0) {
        return new Promise(resolve => {
            var promise = _order.subOrders.map(order => {
                var list = order.blockedProducts.filter(product => product.productId == id);
                var blocked = list.length ? list[0] : {
                    quantity: 0
                };
                var requestedList = order.requestedProducts.filter(product => product.productId == id);
                var requested = requestedList.length ? requestedList[0] : {
                    quantity: 0
                };
                var remaining = requested.quantity - blocked.quantity;
                var payload = {
                    products: [{
                        productId: id,
                        quantity: remaining,
                        isSourcable: false
                    }],
                    dealId: "Internal",
                    requested: 1
                };
                var snapShots = [];
                blockAtWarehouse(payload)
                    .then(el => {
                        Object.keys(el.quantity.snapshots).forEach(key => {
                            snapShots.push({
                                snapShotId: key,
                                quantity: el.quantity.snapshots[key]
                            });
                            order.snapshots.push({
                                snapShotId: key,
                                quantity: el.quantity.snapshots[key]
                            });
                            order.blockedProducts.push({
                                productId: id,
                                quantity: el.quantity.snapshots[key]
                            });
                            if (el.quantity.snapshots[key] == requested) {
                                order.readyForBatching = true;
                                order.gotRequestedProducts = true;
                            }
                            count -= el.quantity.snapshots[key];
                        });
                        resolve(order);
                    });
            });
            Promise.all(promise)
                .then(doc => doc.save(err => logger.error(err)))
                .then(() => updateStockAllocate(_order._id))
                .then(() => updateStockLedger(snapShots, _order._id));
        });
    } else {
        return new Promise(resolve => resolve(count));
    }
}

function updateStockLedger(snapShots, orderId) {
    if (snapShots != undefined && snapShots.length > 0) {
        return new Promise((resolve) => {
            snapShots.map(snp => {
                cuti.request.getUrlandMagicKey("wh").then(options => {
                    options.path += "/snapshot?filter={\"_id\":\"" + snp.snapShotId + "\"}";
                    options.method = "GET";
                    http.request(options, response => {
                        var data = "";
                        response.on("data", _data => data += _data.toString("utf8"));
                        response.on("end", () => {
                            var whdata = JSON.parse(data);
                            var snpInput = [];
                            whdata.forEach(wh => {
                                wh.quantity = snp.quantity;
                                wh.referenceId = [{
                                    "type": "OrderOnHold",
                                    "id": orderId
                                }];
                                wh.stktype = "Out";
                                wh.referencetype = "OrderOnHold";
                                snpInput.push(wh);
                            });
                            var data1 = {
                                data: snpInput
                            };
                            cuti.request.getUrlandMagicKey("wh").then(options => {
                                options.path += "/" + snpInput[0].whId + "/bulkInsert";
                                options.method = "PUT";
                                http.request(options, response => {
                                    var data = "";
                                    response.on("data", _data => data += _data.toString("utf8"));
                                    response.on("end", () => {
                                        var ledgerdata = JSON.parse(data);
                                        resolve();
                                    });
                                }).end(JSON.stringify(data1));
                            });
                        });
                    }).end();
                });
            });
        });
    }
}

function blockAtWarehouse(deal) {
    return new Promise((resolve) => {
        cuti.request.getUrlandMagicKey("wh").then(options => {
            options.path += "/WMF0/inventory/onHold";
            options.method = "PUT";
            http.request(options, response => {
                var data = "";
                response.on("data", _data => data += _data.toString("utf8"));
                response.on("end", () => resolve({
                    discount: deal.discount,
                    b2bDiscount: deal.b2bDiscount,
                    dealId: deal.dealId,
                    quantity: JSON.parse(data)
                }));
            }).end(JSON.stringify(deal));
        });
    });
}

/**
 * This function updated reserved stock per deal by ordered quantity 
 * and reduced stock by order quantity for given seller
 * @param {*} deal 
 * @param {*} seller 
 * @param {*} type 
 * @param {*} typeOfOrder 
 */
function blockSellerDeals(deal, seller, type, typeOfOrder) {
    return new Promise((resolve, reject) => {
        cuti.request.getUrlandMagicKey("deal")
            .then(options => {
                options.path += "/" + deal.id + "/reduce?quantity=" + deal.quantity + "&seller=" + seller + "&type=" + type + "&typeOfOrder=" + typeOfOrder;
                options.method = "PUT";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    if (response.statusCode == 200) {
                        response.on("end", () => resolve(JSON.parse(data)));
                    } else {
                        deal.quantity = 0;
                        response.on("end", () => resolve(JSON.parse(data)));
                    }
                }).end();
            }).catch(err => reject(err));
    });
}

/**
 * @deprecated
 * 
 */
function makeInitiate(orders, body, useWallet) {
    if (orders) {
        return Promise.all(orders.map(el => {
            el.status = "Payment Initiated";
            el.body = body;
            el.useWallet = useWallet;
            el.save((err, doc) => {
                return Promise.resolve();
            });
        }));
    } else {
        Promise.resolve();
    }
}

/**
 * @deprecated
 */
function initiatePayment(req, res) {
    var id = crud.swagMapper(req)["id"];
    var body = crud.swagMapper(req)["data"];
    var useWallet = crud.swagMapper(req)["useWallet"];
    var transType = crud.swagMapper(req)["transType"];
    var applicationType = crud.swagMapper(req).data["applicationType"];
    var condition1 = {};
    var mpscondition1 = {};
    var orcondition = {
        $or: [{
            status: "Created"
        },
        {
            status: "Received",
            "partnerOrderDetails.paymentType": "COD"
        }
        ]
    };
    if (transType == "transId")
        condition1.transactionId = id;
    else
        condition1._id = id;
    var condition = Object.assign(condition1, orcondition);
    crud.model.find(condition).exec()
        .then(orders => {
            // make cross service call to account to get franchise balance
            var orders = orders.length > 0 ? orders : null;
            if (orders) { // StoreKing, Mps,Seller Orders - omsmasters collecton
                checkFranchiseBalance(useWallet, id, req, res, transType)
                    .then((flag) => {
                        if (flag) {
                            res.status(400).json({
                                "message": "Sorry! Insufficient Funds"
                            });
                        } else {
                            makeInitiate(orders, body, useWallet)
                                .then(() => {
                                    return new Promise((_resolve, _reject) => {
                                        var finalCondition = Object.assign(condition1, orcondition, {
                                            "fulfilledBy": "MPS0"
                                        });
                                        crud.model.findOne(finalCondition).exec()
                                            .then((order) => {
                                                if (order) {
                                                    order.body = body;
                                                    order.useWallet = useWallet;
                                                    order.paymentDate = new Date();
                                                    var priceField = order.orderType == "Retail" ? "discount" : "b2bDiscount";
                                                    var deals = {};
                                                    var dealsBlocked = {};
                                                    var dealCount = [];
                                                    order.subOrders.forEach(el => deals[el.id] = deals[el.id] ? deals[el.id] + el.quantity : el.quantity);
                                                    Object.keys(deals).forEach(el => dealCount.push({
                                                        dealId: el,
                                                        requested: deals[el]
                                                    }));
                                                    blockDeals(dealCount, order.source)
                                                        .then(_deals => {
                                                            order.deals = [];
                                                            _deals.forEach(el => {
                                                                var index = order.subOrders.findIndex(els => els.id == el.dealId);
                                                                order.subOrders[index].snapshots = [];
                                                                Object.keys(el.quantity.prices).forEach(_el => {
                                                                    var price = _el * (el[priceField] / 100);
                                                                    var deal = {
                                                                        id: el.dealId,
                                                                        price: price,
                                                                        quantity: el.quantity.prices[_el]
                                                                    };
                                                                    order.deals.push(deal);
                                                                });
                                                                Object.keys(el.quantity.snapshots).forEach(key => order.subOrders[index].snapshots.push({
                                                                    snapShotId: key,
                                                                    quantity: el.quantity.snapshots[key]
                                                                }));
                                                            });
                                                            //Setting payment date
                                                            order.save((err, document) => {
                                                                if (err) {
                                                                    _reject("Oops something went wrong please try later");
                                                                } else {
                                                                    _resolve();
                                                                }
                                                            });
                                                        });
                                                } else {
                                                    var queryCond = {};
                                                    if (transType == "transId")
                                                        queryCond.transactionId = id;
                                                    else
                                                        queryCond._id = id;
                                                    var mpsOrdCondition = Object.assign(mpscondition1, queryCond);
                                                    crud.model.findOne(mpsOrdCondition).exec()
                                                        .then(mpsordData => {
                                                            if (mpsordData) {
                                                                mpsordData.paymentDate = new Date();
                                                                mpsordData.save((err, document) => {
                                                                    _resolve();
                                                                });
                                                            } else
                                                                _resolve();
                                                        });
                                                }
                                            }).catch(err => res.status(400).json({
                                                "message": err
                                            }));
                                    }).then(() => {
                                        if (orders.length > 0 && orders[0].useWallet) {
                                            var amount = orders.reduce((prev, curr) => curr.orderAmount + prev, 0);
                                            amount = amount.toFixed(2);
                                            Promise.all(orders.map(el => {
                                                var mobileNo;
                                                if (el.orderType == "Retail")
                                                    mobileNo = el.customer.mobile;
                                                else
                                                    mobileNo = el.franchise.mobile;
                                                return createTransaction(el.orderAmount, el.franchise.id, el._id, el.orderType, mobileNo);
                                            })).then((finalOrders) => {
                                                var smsBody = {};
                                                if (orders[0].isPurchaseOrder) {
                                                    orders.map(orderObj => {
                                                        // item.body._id
                                                        // smsBody.d=0
                                                        var productArray = orderObj.subOrders.map(suborder => {
                                                            var productIds = suborder.products.map(function (product) {
                                                                return product.id;
                                                            });
                                                            return productIds.join(",");
                                                        });

                                                        productArray = productArray.join(",");

                                                        if (applicationType == "ERP") {
                                                            smsBody.OrderId = orderObj._id;
                                                            smsBody.OrderValue = orderObj.orderAmount;
                                                            smsBody.event = "EVENTSELL00016";
                                                            smsBody.ProductNo = productArray;
                                                            smsBody.id = orderObj.franchise.id;

                                                        } else if (applicationType != "mobile") {
                                                            smsBody.OrderId = orderObj._id;
                                                            smsBody.OrderValue = orderObj.orderAmount;
                                                            smsBody.event = "EVENTSELL00017";
                                                            smsBody.ProductNo = productArray;
                                                            smsBody.id = orderObj.franchise.id;

                                                        }
                                                        sendSMS(smsBody);
                                                    }
                                                    )

                                                }

                                                res.status(200).json({
                                                    "message": "Payment Completed Successfully"

                                                })
                                            })
                                                .catch(err => crud.Error(res, err));
                                        } else {
                                            res.status(200).json(orders);
                                        }
                                    }).catch(err => res.status(400).json({
                                        "message": err
                                    }));
                                });
                        }
                    }).catch(err => res.status(400).json({
                        "message": err
                    }));
            } else {
                res.status(400).json({
                    "message": "Sorry! This Transaction already Initiated or Not Exists"
                });
            }
        });
}

function retryPayment(req, res) {
    var id = crud.swagMapper(req)["id"];
    var body = crud.swagMapper(req)["data"];
    var promises = [
        Mongoose.models["omsmps"].find({
            transactionId: id,
            status: {
                $in: ["Payment Initiated", "Created"]
            }
        }).exec(),
        crud.model.find({
            transactionId: id,
            status: "Payment Initiated"
        }).exec()
    ];
    Promise.all(promises)
        .then(results => {
            var amount = 0;
            results.forEach(el => {
                el.forEach(_el => {
                    _el.useWallet = true;
                    amount += _el.orderAmount;
                    _el.save();
                });
            });
            return amount;
        }).then(amount => createTransaction(amount, req.user.franchise, id, body))
        .then(() => res.status(200).json({
            message: "Payment Retried"
        }))
        .catch(err => crud.Error(res, err));
}

/**
 * @deprecated
 */
function createTransaction(amount, franchise, transactionId, orderType, mobileNo) {
    return new Promise((resolve, reject) => {
        var body = {
            entityId: transactionId,
            from: franchise,
            to: "WMF0",
            amount: amount,
            service: orderType + "OrderManagementSystem",
            payoutType: "Debit",
            type: "Order Confirm",
            master: "oms",
            path: "/order/confirm?id=" + transactionId,
            method: "POST",
            customerNumber: parseInt(mobileNo),
            comments: "Amount debited for order transaction : order Id - " + transactionId
        };
        cuti.request.getUrlandMagicKey("account")
            .then(options => {
                options.path += "/idBasedPayments";
                options.method = "PUT";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    if (response.statusCode == 200) {
                        response.on("end", () => resolve(JSON.parse(data)));
                    } else {
                        response.on("end", () => reject(JSON.parse(data)));
                    }
                }).end(JSON.stringify(body));
            });
    });
}

function revertOrderAmount(orderId, subOrders, franchise, amount, orderType, mobileNo) {
    var entryid = orderId;
    var subOrdersList = "";
    if (subOrders.length > 0) {
        entryid = orderId;
        subOrdersList = subOrders.toString();
    }
    return new Promise((resolve, reject) => {
        var body = {
            entityId: entryid,
            from: "WMF0",
            to: franchise,
            amount: amount,
            service: orderType + "OrderManagementSystem",
            payoutType: "Credit",
            type: "Order Refund",
            master: "oms",
            customerNumber: parseInt(mobileNo),
            comments: "Amount credited for order refund order Id - " + orderId + "Sub Orders -" + subOrdersList
        };
        cuti.request.getUrlandMagicKey("account")
            .then(options => {
                options.path += "/idBasedPayments";
                options.method = "PUT";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    if (response.statusCode == 200) {
                        response.on("end", () => resolve(JSON.parse(data)));
                    } else {
                        response.on("end", () => reject(JSON.parse(data)));
                    }
                }).end(JSON.stringify(body));
            });
    });
}

function changeOrderDestination(req, res) {
    var params = crud.swagMapper(req);
    var data = params["data"];
    var id = params["id"];
    cuti.request.getElement("franchise", data.toFranchise, "sk_franchise_details,name,state,district,city,pincode,address")
        .then(franchise => {
            if (franchise.sk_franchise_details.linked_rmf == data.fromFranchise) {
                var promises = [];
                promises.push(Mongoose.models["omsmps"].find({
                    transactionId: id
                }).exec());
                promises.push(Mongoose.models["omsMaster"].find({
                    transactionId: id
                }).exec());
                Promise.all(promises)
                    .then(resolved => resolved.map(el => changeOwnerShip(el, franchise)))
                    .then(promises => Promise.all(promises))
                    .then(() => res.status(200).json({
                        message: "Updated the franchiseId"
                    }));
            } else {
                res.status(400).json({
                    message: "Only parent RMF can place order on behalf of a franchise"
                });
            }
        });
}

function addAWBSeller(req, res) {
    var id = crud.swagMapper(req)["id"];
    var awb = crud.swagMapper(req)["awb"];
    crud.model.findOne({
        _id: id,
        status: "Invoiced"
    }).exec()
        .then(doc => {
            if (doc) {
                doc.awbNumber = awb;
                doc.save(err => !err ? res.status(200).json(doc) : res.status(400).json({
                    message: err.message
                }));
            } else {
                res.status(404).json({
                    message: "Not found"
                });
            }
        }).catch(err => res.status(400).json({
            message: err.message
        }));
}

function invoiceSellerOrder(req, res) {
    var id = crud.swagMapper(req)["id"];
    var invoice = crud.swagMapper(req)["invoice"];
    var date = crud.swagMapper(req)["invoiceDate"];
    crud.model.findOne({
        _id: id,
        status: "Confirmed"
    }).exec()
        .then(doc => {
            if (doc) {
                doc.invoiceGeneratedOn = new Date(date);
                doc.invoices.push({
                    invoiceNo: invoice
                });
                doc.status = "Invoiced";
                doc.invoiced = true;
                var obj = {
                    _id: invoice,
                    order: id,
                    franchise: doc.franchise
                };
                Mongoose.models["omsInvoice"].create(obj, (err, _doc) => {
                    doc.save(err => !err ? res.status(200).json(doc) : res.status(400).json({
                        message: err.message
                    }));
                });
            } else {
                res.status(404).json({
                    message: "Not found"
                });
            }
        }).catch(err => res.status(400).json({
            message: err.message
        }));
}

function changeOwnerShip(documents, franchise) {
    return Promise.all(documents.map(el => new Promise((resolve) => {
        el.placedBy = el.franchise.id;
        el.franchise.id = franchise._id;
        el.franchise.name = franchise.name;
        el.franchise.state = franchise.state;
        el.franchise.district = franchise.district;
        el.franchise.city = franchise.city;
        el.franchise.address = franchise.address;
        el.franchise.pincode = franchise.pincode;
        el.save(err => logger.error(err));
        resolve();
    })));
}

function revertOrder(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];
    crud.model.findOne({
        _id: id
    }).exec()
        .then(doc => {
            if (doc && doc.status == "Confirmed") {
                return new Promise((_res, _rej) => {
                    if (doc && doc.status == "Confirmed" && doc.fulfilledBy == "MPS0") {
                        doc.status = "Created";
                        var snapshots = [];
                        doc.subOrders.map(el => {
                            if (el.snapshots.length) {
                                el.snapshots.map(ell => {
                                    snapshots.push(ell);
                                });
                            }
                        });
                        cuti.request.getUrlandMagicKey("wh")
                            .then(options => {
                                options.path += "/returnProducts";
                                options.method = "PUT";
                                http.request(options, response => {
                                    if (response.statusCode == 200) {
                                        doc.subOrders.map((el, index) => {
                                            el.snapshots = [];
                                            el.requestedProducts = [];
                                            el.blockedProducts = [];
                                            el.products.forEach(p => {
                                                p.blockedQty = 0;
                                            });
                                            el.readyForBatching = false;
                                            el.gotRequestedProducts = false;
                                            el.status = "Pending";
                                        });
                                        doc.paymentStatus = "Unpaid";
                                        //added by Robin on 02 MAY 2018 to fix order confirm issue
                                        // since stockAllocation was not changeed back when unconfirmed,
                                        // confirm order was failing after that.
                                        doc.stockAllocation = "NotAllocated";
                                        doc.save();
                                        _res();
                                        //res.status(200).json({ message: "Stock returned back to warehouse" });
                                    } else {
                                        var data = "";
                                        response.on("data", _data => data += _data.toString());
                                        response.on("end", () => {
                                            _rej("Warehouse returned with " + response.statusCode + ". Please try again");
                                            //res.status(400).json({ message: "Warehouse returned with " + response.statusCode + ". Please try again!" });
                                        });
                                    }
                                }).end(JSON.stringify(snapshots));
                            });
                    } else if (doc && doc.status == "Confirmed" && doc.fulfilledBy != "MPS0") {
                        doc.status = "Cancelled";
                        doc.save();
                        res.status(200).json({
                            message: "Order has been cancelled"
                        });
                    } else {
                        res.status(404).json({
                            message: "No order found"
                        });
                    }
                }).then(() => { // Revert Payment to Franchise
                    var mobileNo;
                    if (doc.orderType == "Retail")
                        mobileNo = doc.customer.mobile;
                    else
                        mobileNo = doc.franchise.mobile;
                    return revertOrderAmount(doc._id, [], doc.franchise.id, doc.orderAmount, doc.orderType, mobileNo);
                }).then(() => res.status(200).json({
                    message: "Order Unconfirmed Successfully"
                }));
            } else {
                res.status(404).json({
                    message: "Sorry! Order Already Unconfirmed"
                });
            }
        }).catch(err => res.status(400).json({
            message: err
        }));
}

function releaseOrderStocks(req, res) { }

function cancelOrder(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];
    var body = crud.swagMapper(req)["data"];
    crud.model.findOne({
        _id: id
    }).exec()
        .then(doc => {
            doc.cancelledBy = req.user.name;
            if (doc && doc.status == "Confirmed") {
                return new Promise((_res, _rej) => {
                    if (doc && doc.status == "Confirmed" && doc.fulfilledBy == "MPS0") {
                        doc.status = "Cancelled";
                        //If the Order is Cancelled then Revert the Coupon
                        if (doc && doc._id) {
                            orderHooks.removeCoupon(doc);
                        }
                        var snapshots = [];
                        doc.subOrders.map(el => {
                            if (el.snapshots.length) {
                                el.snapshots.map(ell => {
                                    snapshots.push(ell);
                                });
                            }
                        });
                        cuti.request.getUrlandMagicKey("wh")
                            .then(options => {
                                options.path += "/returnProducts";
                                options.method = "PUT";
                                http.request(options, response => {
                                    if (response.statusCode == 200) {
                                        doc.subOrders.map((el, index) => {
                                            el.snapshots = [];
                                            el.requestedProducts = [];
                                            el.blockedProducts = [];
                                            el.products.forEach(p => {
                                                p.blockedQty = 0;
                                            });
                                            el.readyForBatching = false;
                                            el.gotRequestedProducts = false;
                                            el.products.forEach(p => {
                                                p.blockedQty = 0;
                                            });
                                            el.status = "Cancelled";
                                            el.logs.push({
                                                "status": "Order Cancelled",
                                                createdAt: new Date()
                                            });
                                        });
                                        doc.paymentStatus = "Reverted";
                                        doc.save();
                                        _res();
                                    } else {
                                        var data = "";
                                        response.on("data", _data => data += _data.toString());
                                        response.on("end", () => {
                                            _rej("Warehouse returned with " + response.statusCode + ". Please try again");
                                        });
                                    }
                                }).end(JSON.stringify(snapshots));
                            });
                    } else if (doc && doc.status == "Confirmed" && doc.fulfilledBy.indexOf(SEL) != -1) {
                        doc.status = "Cancelled";
                        if (doc && doc._id) {
                            orderHooks.removeCoupon(doc);
                        }
                        doc.subOrders.map((el, index) => {
                            doc.subOrders[index].status == "Cancelled";
                            doc.subOrders[index].logs.push({
                                "status": "Order Cancelled",
                                createdAt: new Date()
                            });
                        });
                        doc.subOrders.map(el => {
                            new Promise((__res, __rej) => {
                                cuti.request.getUrlandMagicKey("deal")
                                    .then(options => {
                                        options.path += "v1/" + el.id + "return?seller=" + doc.fulfilledBy + "&quantity=" + el.quantity + "type=B2C";
                                        options.method = "PUT";
                                        http.request(options, response => {
                                            if (response.statusCode == 200) {
                                                __res();
                                            } else {
                                                var data = "";
                                                response.on("data", _data => data += _data.toString());
                                                response.on("end", () => {
                                                    __rej();
                                                });
                                            }
                                        }).end();
                                    });
                            });
                        });
                        doc.save();
                        _res();
                    } else if (doc && doc.fulfilledBy != "MPS0") {
                        doc.status = "Cancelled";
                        if (doc && doc._id) {
                            orderHooks.removeCoupon(doc);
                        }
                        doc.subOrders.map((el, index) => {
                            doc.subOrders[index].status = "Cancelled";
                            doc.subOrders[index].logs.push({
                                "status": "Order Cancelled",
                                createdAt: new Date()
                            });
                        });
                        doc.save();
                        _res();
                    } else {
                        res.status(404).json({
                            message: "No order found"
                        });
                    }
                }).then(() => { // Revert Payment to Franchise
                    var mobileNo;
                    if (doc.orderType == "Retail")
                        mobileNo = doc.customer.mobile;
                    else
                        mobileNo = doc.franchise.mobile;
                    return revertOrderAmount(doc._id, [], doc.franchise.id, doc.orderAmount, doc.orderType, mobileNo);
                }).then(() => res.status(200).json({
                    message: "Order cancelled successfully"
                }));
            } else if (doc && doc.status == "Created") {
                doc.status = "Cancelled";
                if (doc && doc._id) {
                    orderHooks.removeCoupon(doc);
                }
                doc.subOrders.map((el, index) => {
                    doc.subOrders[index].status = "Cancelled";
                    doc.subOrders[index].logs.push({
                        "status": "Order Cancelled",
                        createdAt: new Date()
                    });
                });
                doc.save();
                res.status(200).json({
                    message: "Order has been cancelled Successfully"
                });
            } else {
                res.status(404).json({
                    message: "Sorry! the order already cancelled /shipped"
                });
            }
        }).catch(err => res.status(400).json({
            message: err.message
        }));
}

/**
 * 
 * @param {*Request Payload} req 
 * @param {*Respoonse Payload} res
 * @desc API to release stock 
 */
function releaseStocks(req, res) {
    var payload = req.swagger.params["data"].value;
    var subOrderIds = payload.subOrders;

    var orderId = req.swagger.params["id"].value;
    crud.model.findOne({
        _id: orderId
    }).exec()
        .then(doc => {
            if (doc.fulfilledBy == "MPS0") {
                var snapShots = [];
                var selected_subOrders = [];
                //
                if (subOrderIds && subOrderIds.length) {
                    // cancel only the selected suborders;
                    selected_subOrders = doc.subOrders.filter(el => subOrderIds.indexOf(el.id) > -1 && el.status === "Confirmed" && el.snapshots.length > 0);
                } else {
                    //cancel all the suborders;
                    selected_subOrders = doc.subOrders.filter(el => el.status === "Confirmed" && el.snapshots.length > 0);
                }
                //Get snapshots from subOrders;
                if (selected_subOrders && selected_subOrders.length) {
                    selected_subOrders.map(subOrder => {
                        snapShots = snapShots.concat(subOrder.snapshots);
                    });
                } else {
                    res.status(400).send({
                        "messge": "No Suborders found to cancel"
                    });
                    return;
                }
                //If snapshots are available then make request;
                if (snapShots && snapShots.length) {
                    cuti.request.getUrlandMagicKey("wh")
                        .then(options => {
                            options.path += "/returnProducts";
                            options.method = "PUT";
                            http.request(options, response => {
                                if (response.statusCode == 200) {
                                    selected_subOrders.map(selected => {
                                        doc.subOrders.map(el => {
                                            if (selected.id == el.id) {
                                                el.snapshots = [];
                                                el.requestedProducts = [];
                                                el.blockedProducts = [];
                                                el.products.forEach(p => {
                                                    p.blockedQty = 0;
                                                });
                                                el.readyForBatching = false;
                                                el.gotRequestedProducts = false;
                                                el.logs.push({
                                                    "status": "Stocks Released",
                                                    createdAt: new Date()
                                                });
                                            }
                                        });
                                        doc.save((err, doc) => {
                                            if (!err)
                                                res.status(200).send({
                                                    message: "Success"
                                                });
                                            else
                                                res.status(400).send({
                                                    message: "Error"
                                                });
                                        });
                                    });

                                } else {
                                    var data = "";
                                    response.on("data", _data => data += _data.toString());
                                    response.on("end", () => {
                                        res.status(400).send({
                                            message: "Warehouse returned with " + response.statusCode + ". Please try again"
                                        });
                                    });
                                }
                            }).end(JSON.stringify(snapShots));
                        });
                } else {
                    res.status(400).send({
                        message: "Coudnot find snapshots to release stocks"
                    });
                }
            } else {
                res.status(400).send({
                    message: "Fullfilment is not MPS0",
                    code: "INVALID"
                });
            }
        }).catch(e => res.status(400).send({
            "message": e.message,
            code: "ERROR_OCCURED"
        }));

}

/**
 * @deprecated
 */
function cancelSuborders(req, res) {
    var payload = req.swagger.params["data"].value;
    var subOrderIds = payload.subOrderIds;
    var orderId = req.swagger.params.orderId.value;
    crud.model.findOne({
        _id: orderId
    }).exec()
        .then(doc => {
            doc.cancelledBy = req.user.name;
            if (doc.fulfilledBy == "MPS0") {
                var snapShots = [];
                var selected_subOrders = [];
                //
                if (subOrderIds && subOrderIds.length) {
                    // cancel only the selected suborders;
                    selected_subOrders = doc.subOrders.filter(el => subOrderIds.indexOf(el.id) > -1 && el.status === "Confirmed" && el.snapshots.length > 0);
                } else {
                    //cancel all the suborders;
                    selected_subOrders = doc.subOrders.filter(el => el.status === "Confirmed" && el.snapshots.length > 0);
                }
                //Get snapshots from subOrders;
                if (selected_subOrders && selected_subOrders.length) {
                    selected_subOrders.map(subOrder => {
                        snapShots = snapShots.concat(subOrder.snapshots);
                    });
                } else {
                    res.status(400).send({
                        "messge": "No Suborders found to cancel"
                    });
                    return;
                }
                //If snapshots are available then make request;
                if (snapShots && snapShots.length) {
                    cuti.request.getUrlandMagicKey("wh")
                        .then(options => {
                            options.path += "/returnProducts";
                            options.method = "PUT";
                            http.request(options, response => {
                                if (response.statusCode == 200) {
                                    selected_subOrders.map(selected => {
                                        doc.subOrders.map(el => {
                                            if (selected.id == el.id) {
                                                el.snapshots = [];
                                                el.requestedProducts = [];
                                                el.blockedProducts = [];
                                                el.products.forEach(p => {
                                                    p.blockedQty = 0;
                                                });
                                                el.readyForBatching = false;
                                                el.gotRequestedProducts = false;
                                                el.status = "Cancelled";
                                                el.logs.push({
                                                    "status": "SubOrder Cancelled",
                                                    createdAt: new Date()
                                                });
                                            }
                                        });
                                        doc.save((err, doc) => {
                                            if (!err)
                                                res.status(200).send({
                                                    message: "Success"
                                                });
                                            else
                                                res.status(400).send({
                                                    message: "Error"
                                                });
                                        });
                                    });
                                    /* doc.subOrders.map((el, index) => {
                                        el.snapshots = [];
                                        el.requestedProducts = [];
                                        el.blockedProducts = [];
                                        el.readyForBatching = false;
                                        el.gotRequestedProducts = false;
                                        el.status = "Cancelled";
                                        el.logs.push({
                                            "status": "Order Cancelled",
                                            createdAt: new Date()
                                        });
                                    });
                                    doc.paymentStatus = "Reverted";
                                    doc.save();
                                    _res(); */
                                } else {
                                    var data = "";
                                    response.on("data", _data => data += _data.toString());
                                    response.on("end", () => {
                                        res.status(400).send({
                                            message: "Warehouse returned with " + response.statusCode + ". Please try again"
                                        });
                                    });
                                }
                            }).end(JSON.stringify(snapShots));
                        });
                } else {
                    res.status(400).send({
                        message: "Coudnot find snapshots to cancel orders"
                    });
                }
            } else {
                res.status(400).send({
                    message: "Fullfilment is not MPS0",
                    code: "INVALID"
                });
            }
        }).catch(e => res.status(400).send({
            "message": e.message,
            code: "ERROR_OCCURED"
        }));
}

/* 
   - This function is set to the scheduler in post hook;
   - Invoked to update the order status to created from payment Intiated state;
*/
function updateStatus(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];

    logger.trace(`Scheduler : Auto update order status from payment Initiated to Created if stuck for order ${id} .....`);

    if (id && id.indexOf("MPS") == -1) {
        crud.model.findOne({
            _id: id
        }).exec()
            .then(doc => {
                if (doc) {
                    if (doc.status == "Payment Initiated") {
                        doc.status = "Created";
                        doc.paymentStatus = "Unpaid";
                        if (doc.fulfilledBy == "MPS0") {

                            var reservedSubOrders = [];

                            doc.subOrders.map((el, index) => {
                                var count = _.sumBy(el.snapshots, "quantity");
                                if (count > 0) {
                                    reservedSubOrders.push(el);
                                }
                            });

                            if (reservedSubOrders && reservedSubOrders.length) {
                                revertReservation(reservedSubOrders, doc.source, "Stock Unreservation");
                            }

                            doc.save();

                            res.status(200).send({ "message": "Success" });

                        } else {
                            doc.save();
                            res.status(200).json({
                                message: "Stock returned back to warehouse"
                            });
                        }
                    } else {
                        res.status(200).json({
                            message: "Order is already in Paid state"
                        });
                    }
                } else {
                    res.status(400).json({
                        message: "Order not Found"
                    });
                }
            });
    } else {
        //For MPS / seller / Partner orders
        Mongoose.models["omsmps"].findOne({
            _id: id
        }).exec()
            .then(doc => {
                if (doc.status == "Payment Initiated") {
                    doc.status = "Created";
                    doc.save();
                    res.status(200).json({
                        message: "Status updated"
                    });
                } else {
                    res.status(200).json({
                        message: "Order is already in Paid state"
                    });
                }
            });
    }
}
//subOrderIds
function updateOrderStatus(req, res) {
    var params = crud.swagMapper(req)["data"];
    var subOrderIds = [];
    params.subOrderIds.forEach(s => subOrderIds.push(s._id));
    subOrderIds = _.uniq(subOrderIds);
    crud.model.find({
        "subOrders._id": {
            "$in": subOrderIds
        }
    }).exec()
        .then(docs => {
            updateSubOrderStatus(docs, params).then((updatedDocs) => {
                res.status(200).json({ message: "Status updated From me" });
            }).catch(err => {
                res.status(400).json({ message: "Error Occured While updating the SubOrders " + err.mesage });
            });
        }).catch((err) => {
            res.status(400).json({ message: "Error Occured While getting order From suborderIds " + err.mesage });
        });
}

/**
 * This function will update the suborderStatus
 * @param {*Orders} docs 
 * @param {*request params} params 
 */
function updateSubOrderStatus(docs, params) {
    return Promise.all(docs.map(doc => {
        return new Promise((resolve, reject) => {
            doc.subOrders.map(subOrder => {
                if (params.status == "Returned") {
                    if (subOrder.status == "Shipped" || subOrder.status == "Delivered" || subOrder.status == "Partially Returned") {
                        //already when we trying to create the returns request we will update the order with returned Request Quantity so here no need worry about the suborder.product.returnedQuantity instead directly consider the suborder.product.returnedQuantity
                        var quanity = 0;
                        var returnedQuantity = 0;
                        subOrder.products.map(product => {
                            quanity += product.quantity ? product.quantity : 0;
                            returnedQuantity += product.returnedQuantity ? product.returnedQuantity : 0;
                        });
                        if (quanity == returnedQuantity) {
                            subOrder.status = "Returned";
                        } else {
                            subOrder.status = "Partially Returned";
                        }
                    }
                }
            });
            let status = _.countBy(doc.subOrders, o => {
                return o.status;
            });
            if (status && status.Returned == doc.subOrders.length) {
                doc.status = "Returned";
            } else if (status && status["Partially Returned"] >= 1) {
                doc.status = "Partially Returned";
            }
            doc.save((err, updatedDoc) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(updatedDoc);
                }
            });
        });
    }));

}

function blockDeals(deals, whId) {
    return new Promise(resolve => {
        cuti.request.getUrlandMagicKey("deal")
            .then(options => {
                options.method = "POST";
                options.path += "/blockDeals?whId=" + whId;
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => resolve(JSON.parse(data)));
                }).end(JSON.stringify(deals));
            });
    });
}

function getCommission(subOrder, franchise, type) {
    return new Promise((resolve) => {
        cuti.request.getUrlandMagicKey("commission")
            .then(options => {
                options.path = "/commission/v1/getCommission/" + subOrder.id + "/" + franchise + "?type=" + type;
                options.method = "POST";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        if (JSON.parse(data).value != undefined) {
                            var commission = (JSON.parse(data).value).toFixed(2);
                            var commissionPerc = 100 - (((subOrder.price - commission) / subOrder.price) * 100);
                            subOrder.commission = {
                                amount: commission,
                                perc: commissionPerc
                            };
                        }
                        resolve(subOrder);
                    });
                }).end(JSON.stringify({
                    mrp: parseFloat(subOrder.price),
                    quantity: subOrder.quantity
                }));
            })
            .catch(error => {
                console.log("getCommission Issue " + JSON.stringify(error));
            });
    });
}

/**
 * This function to get the networkCommision
 * @param {*} subOrder 
 * @param {*} franchise 
 * @param {*} type 
 */
function getNetworkCommission(subOrder, franchise, type) {
    return new Promise((resolve) => {
        cuti.request.getUrlandMagicKey("commission")
            .then(options => {
                options.path = "/commission/v1/getCommission/" + subOrder.id + "/" + franchise + "?type=" + type + "&commissionType=" + "NETWORK";
                options.method = "POST";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {
                        if (JSON.parse(data).value != undefined) {
                            var commission = (JSON.parse(data).value).toFixed(2);
                            var commissionPerc = 100 - (((subOrder.price - commission) / subOrder.price) * 100);
                            subOrder.networkCommission = {
                                amount: commission ? commission : 0,
                                perc: commissionPerc ? commissionPerc : 0
                            };
                        }
                        resolve(subOrder);
                    });
                }).end(JSON.stringify({
                    mrp: parseFloat(subOrder.price),
                    quantity: subOrder.quantity
                }));
            });
    });
}

function getImeiCommission(subOrder, franchise, type) {
    return Promise.all(subOrder.products.map((el, index) => {
        return new Promise((resolve) => {
            return cuti.request.getUrlandMagicKey("commission")
                .then(options => {
                    options.path = "/commission/v1/getImeiCommission/" + el.id + "/" + franchise + "?type=" + type;
                    options.method = "POST";
                    http.request(options, response => {
                        var data = "";
                        response.on("data", _data => data += _data.toString("utf8"));
                        response.on("end", () => {
                            var finaldata = JSON.parse(data);
                            if (finaldata.isCommissionAvailable) {
                                subOrder.products[index].imeiCommAvailable = finaldata.isCommissionAvailable;
                                subOrder.products[index].imeiSlab = {};
                                subOrder.products[index].imeiSlab.structure = finaldata.structure;
                                subOrder.products[index].imeiSlab._id = finaldata._id;
                            } else
                                subOrder.products[index].imeiCommAvailable = false;
                            resolve();
                        });
                    }).end();
                });
        })
            .then(() => {
                var ct = el.category.toString().split(",")[0];
                return cuti.request.getElement("category", ct, "stickyOrderPrice,collectSerialNumber")
                    .then((catDet) => {
                        if (catDet) {
                            subOrder.products[index].stickyOrderPrice = catDet.stickyOrderPrice;
                            subOrder.products[index].collectSerialNumber = catDet.collectSerialNumber;
                        }
                    });
            });
    })).then(() => {
        return subOrder;
    });
}

function initiateConfirmation(orderID, extId) {
    return new Promise((resolve, reject) => {
        crud.model.find({
            _id: orderID,
            status: {
                $in: ["Payment Initiated", "Created"]
            }
        }).exec() //  status excluding 
            .then(_order => Promise.all(_order.map(__order => orderHelper.fillMissingInfo(__order, __order.body))))
            .then(_orders => {
                if (_orders) {
                    _orders.forEach(el => {
                        el.paymentTransactionId = extId;
                        el.body = undefined;
                        /**
                         * PurchaseOrder Payment
                         */
                        if (el.linkedPurchaseOrderId) {
                            paymentForPurchaseOrder(el.linkedPurchaseOrderId);
                        }
                    });
                    var skOrders = _orders.filter(el => el.fulfilledBy == "MPS0");
                    var nonSkOrders = _orders.filter(el => el.fulfilledBy != "MPS0");
                    if (skOrders.length > 0) {
                        var d = skOrders[0];
                        return orderHelper.updateBlockedDeals(d)
                            .then(_d => {
                                _d.paymentDate = new Date();
                                return new Promise((_resolve, _reject) => {
                                    var map = {};
                                    var deals = [];
                                    _d.deals.forEach(el => {
                                        if (!map[el.id]) {
                                            map[el.id] = 1;
                                            deals.push(el);
                                        } else {
                                            var deal = deals.find(_el => el.id == _el.id);
                                            deal.quantity += el.quantity;
                                        }
                                    });
                                    var suborders = _d.subOrders;
                                    _d.subOrders.map((el, index) => {
                                        _d.subOrders[index].status = "Confirmed";
                                        var log = {
                                            status: "Order Confirmed",
                                            createdAt: new Date()
                                        };
                                        _d.subOrders[index].logs.push(log);
                                    });
                                    var result = [_d];
                                    var promises = [];
                                    if (nonSkOrders.length) {
                                        nonSkOrders.forEach(el => {
                                            var type = el.orderType == "Retail" ? "b2c" : "b2b";
                                            result.push(el);
                                            el.subOrders.map((el, nonSkindex) => {
                                                el.subOrders[nonskindex].status = "Confirmed";
                                                var log = {
                                                    status: "Order Confirmed",
                                                    createdAt: new Date()
                                                };
                                                el.subOrders[nonSkindex].logs.push(log);
                                            });
                                            el.deals.map(_el => blockSellerDeals(_el, el.fulfilledBy, type, el.typeOfOrder)).forEach(_el => promises.push(_el));
                                        });
                                    }
                                    return Promise.all(promises)
                                        .then(() => _resolve(result));
                                });
                            });
                    } else {
                        return new Promise((resolve) => {
                            var promises = [];
                            nonSkOrders.forEach(el => {
                                var type = el.orderType == "Retail" ? "b2c" : "b2b";

                                el.subOrders.map((s, index) => {
                                    el.subOrders[index].status = "Confirmed";
                                    var log = {
                                        status: "Order Confirmed",
                                        createdAt: new Date()
                                    };
                                    el.subOrders[index].logs.push(log);
                                });
                                el.deals.map(_el => blockSellerDeals(_el, el.fulfilledBy, type, el.typeOfOrder)).forEach(_el => promises.push(_el));
                            });
                            resolve(_orders);
                        });
                    }
                } else {
                    resolve(true);
                }
            }).then(_d => {
                /* _d.forEach(el => el.save(err => logger.error(err)));
                return _d; */
                return Promise.all(_d.map(el => {
                    return new Promise(resolve => {
                        el.save(err => {
                            logger.error(err);
                            resolve();
                        });
                    });
                })).then(() => _d);
            }).then(_d => Mongoose.models["omsmps"].find({
                _id: orderID,
                status: {
                    $in: ["Payment Initiated", "Created"]
                }
            }).exec()
                .then(docs => {
                    if (docs.length) {
                        var body = null;
                        docs.forEach(el => {
                            el.status = "Confirmed";
                            body = el.body;
                            el.body = undefined;
                            el.paymentTransactionId = extId;
                        });
                        Promise.all(docs.map(el =>
                            orderHelper.fillMissingInfo(el, body)))
                            .then(mpsOrders => resolve([mpsOrders, _d]))
                            .catch(err => logger.error(err));
                    } else {
                        resolve(_d);
                    }
                })).catch(err => reject(err));
    });
}

function getAmount(req, res) {
    var id = crud.swagMapper(req)["id"];
    getTotalAmount(id)
        .then(amount => res.status(200).json({
            amount: amount
        }));
}
// function getTransactionDetails(mode, path, amount) {
//     return new Promise((resolve, reject) => {
//         cuti.request.getUrlandMagicKey(mode)
//             .then(options => {
//                 options.path += path;
//                 http.request(options, response => {
//                     var data = "";
//                     if(response.statusCode == 200){
//                         response.on("data", _data => data += _data.toString());
//                         response.on("end", () => {
//                             var order = JSON.parse(data);
//                             if(mode == "wallet")
//                                 order.amount >= amount && order.status == "Success"?
//                                     resolve():reject(new Error(mode+" with amount "+ order.amount+" is in "+order.status));
//                             else if(mode == "pg")
//                                 order.amount >= amount && order.transactionStatus && 
//                                     order.transactionStatus.status == "CHARGED"?resolve():
//                                         reject(new Error(mode+" with amount "+ order.amount+" is in "+order.transactionStatus.status));
//                         });
//                     }
//                     else{
//                         reject(new Error("Order Not Found"));
//                     }
//                 }).end();
//             }).catch(err => reject(err));
//     });
// }

function getAccount(owner) {
    return new Promise((resolve, reject) => {
        cuti.request.getUrlandMagicKey("account")
            .then(options => {
                options.path += "?filter=" + JSON.stringify({
                    owner: owner
                });
                var request = http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    response.on("end", () => response.statusCode == 200 ? resolve(JSON.parse(data)) : reject(data));
                });
                request.end();
                request.on("error", err => reject(err));
            }).catch(err => reject(err));
    });
}

function requiredFunds(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];
    var promises = [
        crud.model.find({
            "franchise.id": id,
            status: {
                $in: ["Payment Initiated", "Created"]
            }
        }).select("orderAmount").lean().exec(),
        Mongoose.models["omsmps"].find({
            "franchise.id": id,
            status: {
                $in: ["Payment Initiated", "Created"]
            }
        }).select("orderAmount").lean().exec(),
        getAccount(id)
    ];
    Promise.all(promises)
        .then(docs => {
            var amount = docs[0].reduce((prev, curr) => prev + curr.orderAmount, 0);
            amount += docs[1].reduce((prev, curr) => prev + curr.orderAmount, 0);
            if (docs[2].length > 0) {
                var requiredFunds = amount - docs[2][0].balance;
                if (requiredFunds < 0)
                    res.status(200).json({
                        message: "Franchise has sufficient funds"
                    });
                else
                    res.status(200).json({
                        requiredFunds: requiredFunds
                    });
            } else {
                res.status(400).json({
                    message: "No accounts associated with this franchise found"
                });
            }
        }).catch(err => res.status(400).json(err));
}

function getTotalOrderAmount(transactionId) {
    return new Promise((resolve, reject) => {
        var promises = [];
        promises.push(Mongoose.models["omsmps"].find({
            transactionId: transactionId,
            status: {
                $in: [
                    "Payment Initiated", "Created"
                ]
            }
        }).exec());
        promises.push(crud.model.find({
            transactionId: transactionId,
            status: {
                $in: [
                    "Payment Initiated", "Created"
                ]
            }
        }).exec());
        return Promise.all(promises)
            .then(docs => {
                var amount = 0;
                if (docs[0].length > 0 || docs[1].length) {
                    docs.forEach(_docs => {
                        amount += _docs.reduce((prev, curr) => prev + curr.orderAmount, 0);
                    });
                    resolve(amount.toFixed(2));
                } else {
                    reject({
                        "message": "Sorry! The transaction is already paid or cancelled"
                    });
                }
            });
    });
}

function getTotalAmountForOrder(orderId) {
    return new Promise((resolve) => {
        var promises = [];
        promises.push(Mongoose.models["omsmps"].find({
            _id: orderId,
            $or: [{
                status: "Created"
            },
            {
                status: "Payment Initiated"
            }
            ]
        }).exec());
        promises.push(crud.model.find({
            _id: orderId,
            $or: [{
                status: "Created"
            },
            {
                status: "Payment Initiated"
            }
            ]
        }).exec());
        Promise.all(promises)
            .then(docs => {
                var amount = 0;
                docs.forEach(_docs => {
                    amount += _docs.reduce((prev, curr) => prev + curr.orderAmount, 0);
                });
                resolve(amount.toFixed(2));
            });
    });
}

function getTotalAmount(transactionId) {
    return new Promise((resolve) => {
        var promises = [];
        promises.push(Mongoose.models["omsmps"].find({
            transactionId: transactionId,
            $or: [{
                status: "Created"
            },
            {
                status: "Received",
                "partnerOrderDetails.paymentType": "COD"
            },
            {
                status: "Payment Initiated"
            }
            ]
        }).exec());
        promises.push(crud.model.find({
            transactionId: transactionId,
            $or: [{
                status: "Created"
            },
            {
                status: "Payment Initiated"
            }
            ]
        }).exec());
        Promise.all(promises)
            .then(docs => {
                var amount = 0;
                docs.forEach(_docs => {
                    amount += _docs.reduce((prev, curr) => prev + curr.orderAmount, 0);
                });
                resolve(amount);
            });
    });
}

function orderShippedWithinTAT(req, res) {
    crud.model.find({
        awbNumber: {
            $exist: false
        },
        fulfilledBy: {
            $ne: "WMF0"
        }
    }).exec()
        .then(docs => Promise.all(docs.map(el => getShipsInDate(el))))
        .then(() => res.status(200).json({
            message: "Notification Sent"
        }));
}

function getShipsInDate(order) {
    var type = order.orderType == "Wholesale" ? "b2b" : "b2c";
    return new Promise(resolve => {
        Promise.al(order.deals.map(el => cuti.request.getElement("deal", el)))
            .then(deals => deals.reduce((prev, curr) => {
                var shippingTime = curr.sellers.find(seller => seller.id == order.fulfilledBy)[type]["shippingTime"];
                return shippingTime < prev ? shippingTime : prev;
            }, Number.MAX_VALUE))
            .then(shippingTime => {
                var date = new Date;
                if (date - order.confirmationDate > shippingTime) {
                    cuti.request.getUrlandMagicKey("notification")
                        .then(options => {
                            options.method = "POST";
                            options.message += "/message";
                            var body = {
                                id: order._id,
                                event: "EVENTSELL10001"
                            };
                            http.request(options).end(JSON.stringify(body));
                            resolve();
                        });
                } else {
                    resolve();
                }
            });
    });
}
// function confirmOrder(req, res) {
//     var orderID = req.query.id,
//         data = req.body;
//     var mode = req.query.mode;
//     var status = req.query.status;
//     var extId = req.query.extId;
//     data.transactionId = orderID;
//     var path = "";
//     if (mode) {
//         if(mode == "wallet")
//             path = "/order/" + extId;
//         else if(mode == "pg")
//             path = "/payment/" + extId;
//         else
//             return res.status(400).json({message:"Invalid payment mode"});
//         getTotalAmount(orderID)
//             .then(amount => getTransactionDetails(mode,path,amount))
//             .then(() => initiateConfirmation(orderID, data))
//             .then(result => res.status(200).json(result))
//             .catch(err => res.status(400).json({ message: err.message }));
//     } else if (status == "Committed" && req.headers["magickey"]) {
//         initiateConfirmation(orderID, data)
//             .then(result => res.status(200).json(result))
//             .catch(err => res.status(400).json({ message: err.message }));
//     } else {
//         var promises = [crud.model.find({ transactionId: orderID }).exec(), Mongoose.models["omsmps"].find({ transactionId: orderID }).exec()];
//         Promise.all(promises)
//             .then(docs => {
//                 var date = new Date();
//                 date.setDate(date.getDate() + 1);
//                 cuti.counter.getCount("universalTransactionId" + date.getDate(), date, function(err, doc) {
//                     var count = 1000000;
//                     count += doc.next;
//                     date.setDate(date.getDate() - 1);
//                     var transactionId = count.toString() + date.getTime();
//                     docs.forEach(_docs => {
//                         _docs.forEach(el => {
//                             el.transactionId = transactionId;
//                             el.save();
//                         });
//                     });
//                     res.status(200).json(docs);
//                 });
//             });
//     }
// }

function confirmOrderPayment(req, res) {
    var amount = req.query.amount;
    var transactionId = req.query.id;
    var extId = req.query.extId || transactionId;
    var status = req.query.status;
    if (status == "Committed") {
        getTotalOrderAmount(transactionId)
            .then(_amount => {
                _amount = typeof _amount === "string" ? Number(_amount) : _amount;
                amount = typeof amount === "string" ? Number(amount) : amount;
                return _amount <= amount ? Promise.resolve() : Promise.reject(new Error("Insufficient Amount"));
            })
            .then(() => {
                var promises = [];
                promises.push(Mongoose.models["omsmps"].find({
                    transactionId: transactionId,
                    status: {
                        $in: [
                            "Payment Initiated", "Created"
                        ]
                    }
                }).exec());
                promises.push(crud.model.find({
                    transactionId: transactionId,
                    status: {
                        $in: [
                            "Payment Initiated", "Created"
                        ]
                    }
                }).exec());
                return Promise.all(promises);
            }).then((orders) => {
                var finalOrders;
                var franchiseId = "";
                if (orders[0].length > 0) {
                    finalOrders = orders[0];
                    franchiseId = finalOrders[0].franchise.id;
                }
                if (orders[1].length > 0) {
                    finalOrders = orders[1];
                    franchiseId = finalOrders[0].franchise.id;
                }
                return Promise.all(finalOrders.map(el => {
                    var mobileNo;
                    if (el.orderType == "Retail")
                        mobileNo = el.customer.mobile;
                    else
                        mobileNo = el.franchise.mobile;
                    return createTransaction(el.orderAmount, franchiseId, el._id, el.orderType, mobileNo);
                }));
            })
            .then(() => res.status(200).json({
                message: "Transaction Payment completed Successfully"
            }))
            .catch(err => {
                res.status(400).json({
                    message: err.message
                });
            });
    } else {
        res.status(400).json({
            message: "Sorry! Payment Failed"
        });
    }
}
/**
 * updateSellerDashboard Status
 * @param {*} orderId 
 */
function updateSellerDashboardStatus(orderId) {
    return new Promise(resolve => {
        crud.model.findOne({
            _id: orderId
        }).exec()
            .then((orderData) => {

                if (orderData && orderData.typeOfOrder == "SELLER" && orderData.fulfilledBy) {
                    var params = {
                        "sellerId": orderData.fulfilledBy,
                        "dashboardStatus": "ShowSecondaryDashboard"
                    };
                    _requestHttp('seller', "dashboardStatus/update", "POST", params, (err, sellerData) => {
                        resolve({
                            fulfilledBy: orderData.fulfilledBy,
                            _id: orderData._id,
                            orderAmount: orderData._id
                        });
                    })

                } else {
                    resolve({});
                }

            }).catch(err => console.log("err", err));

    })
}

/**
 * updateSellerCharges - calculate shipping TAT and seller charges based on commission data for deals
 * Commission is calculated per product and is only calculated for Third Party seller orders
 * @param {*} orderId 
 */
function updateSellerCharges(orderId) {
    return new Promise(resolve => {
        crud.model.findOne({
            _id: orderId
        }).exec()
            .then((orderData) => {

                //if order is of type SELLER, then go ahead and calculate the seller charges, that are needed for settlements
                if (orderData && orderData.typeOfOrder === constants.SELLER_ORDER_TYPE) {

                    var charges = []; //this is for finding the charges for each deal

                    Promise.all(orderData.deals.map(dealData => getDealDataAndCalculateCommission(dealData.id, orderData.sellerInfo.id, orderData, charges).then(commissionData => {



                        var shipmentDates = [];
                        var totalSellerCharges = 0;
                        for (var index in charges) { //search for the suborder based on deal id to save charges
                            var a = _.find(orderData.subOrders, function (obj) {
                                return obj.id === index;
                            });
                            a.shipmentDueDate = calculateShippingTAT(a.shipsIn);
                            shipmentDates.push(a.shipmentDueDate); //push the shipment date in list of shipment dates
                            a.sellerCharges = charges[index]; // this sets the value back to orderData object (reference), later we save this
                            totalSellerCharges += a.sellerCharges; //find the total charges
                        }

                        try {
                            //shipment Due Date strategy from configuration
                            switch (true) {
                                case constants.SHIPMENT_DUE_TAT_STRATEGY.toLowerCase() == "min":
                                    orderData.shipmentDueDate = moment.min(shipmentDates);
                                    break;
                                case constants.SHIPMENT_DUE_TAT_STRATEGY.toLowerCase() == "max":
                                    orderData.shipmentDueDate = moment.max(shipmentDates);
                                    break;
                                default:
                                    orderData.shipmentDueDate = moment.max(shipmentDates);
                            }
                        } catch (e) {
                            console.log(e);
                        }


                        orderData.sellerCharges = totalSellerCharges;
                        orderData.save((err, doc) => {
                            if (err) {
                                console.log('Error, couldnt update seller charges');
                            }
                            resolve(doc);
                        });

                    })))
                        .then(() => {
                            //all done
                            resolve();
                        })

                } else {
                    //not applicable, move on
                    resolve();
                }

            }).catch(err => console.log("err", err));



    });
}
/**
 * Internal API call to get deal details and deal commission
 * Calculated commission for this deal
 * @param {*} dealId 
 * @param {*} sellerId 
 * @param {*} orderData 
 * @param {*} charges 
 */
function getDealDataAndCalculateCommission(dealId, sellerId, orderData, charges) {
    return new Promise(resolve => {
        //get deal data from my deals API from deals micro services
        var params = "dealId=" + dealId + '&sellerId=' + sellerId;
        //make the cuti call to the micro service
        _requestHttp('deal', "seller/mydeals/detail", "GET", params, (err, dealData) => {
            //get commision data
            getDealCommission(dealData.deals, sellerId, orderData).then((commissionData) => {

                //search for pricing information in the seller array inside the deal data
                var sellerInformation = _.find(dealData.deals[0].sellers, function (obj) {
                    return obj.id === orderData.sellerInfo.id;
                });
                var prodQty = 1;
                if (orderData.subOrders && dealId) {
                    var subOrderInfo = _.find(orderData.subOrders, function (obj) {
                        return obj.id === dealId;
                    });
                    if (subOrderInfo.quantity) {
                        prodQty = subOrderInfo.quantity;
                    }
                }
                var commissionPercentage = commissionData.commission / 100;
                //record the charges for the deal
                charges[dealId] = (sellerInformation.b2b.offerPrice * prodQty) * commissionPercentage;
                //all done here
                resolve(commissionData);

            })

        })



    })
}

/**
 * This internal API call to fetch seller commission for this paid order and is called on confirm order
 */
function getDealCommission(dealData, sellerId, orderData) {
    return new Promise(resolve => {

        //get commission data for the deal based on brand and category from commission micro services
        var params = {
            "categoryBrands": {
                "categoryId": dealData[0].category[0],  //double check data
                "brandId": dealData[0].brand[0]
            },
            "dealId": dealData[0].id
        };
        _requestHttp('commission', "charges/" + sellerId, "POST", params, (err, commissionData) => {
            resolve(commissionData);
        })

    })
}

function calculateShippingTAT(shipsIn) {
    return moment().add(shipsIn, 'days').endOf('day');
}


function updateStockAllocate(orderId) {
    return new Promise(resolve => {
        crud.model.findOne({
            _id: orderId
        }).exec()
            .then((doc) => {
                if (doc) {
                    if (doc.subOrders && doc.fulfilledBy == "MPS0" && (doc.stockAllocation == undefined || doc.stockAllocation != "Allocated")) {
                        //var subOrders = doc.subOrders.filter(el => el.status == "Confirmed");
                        var count = [];
                        count.requestedproductcount = 0;
                        count.holdproductcount = 0;
                        doc.subOrders.map((el, index) => {
                            if (el.status == "Confirmed" || el.status == "Processing") {
                                var reqPrdCount = 0;
                                var blockedPrdCount = 0;
                                if (el.requestedProducts && el.requestedProducts.length) {
                                    el.requestedProducts.map(r => {
                                        count.requestedproductcount = parseInt(count.requestedproductcount) + parseInt(r.quantity);
                                        reqPrdCount = parseInt(reqPrdCount) + parseInt(r.quantity);
                                    });
                                }
                                if (el.blockedProducts && el.blockedProducts.length) {
                                    el.blockedProducts.map(b => {
                                        count.holdproductcount = parseInt(count.holdproductcount) + parseInt(b.quantity);
                                        blockedPrdCount = parseInt(blockedPrdCount) + parseInt(b.quantity);
                                    });
                                }
                                if (reqPrdCount == blockedPrdCount) {
                                    doc.subOrders[index].readyForBatching = true;
                                    doc.subOrders[index].gotRequestedProducts = false;
                                }
                            }
                        });

                        if (count.holdproductcount == 0) {
                            doc.stockAllocation = "NotAllocated";
                            doc.gotRequestedProducts = false;
                        } else if (count.holdproductcount != count.requestedproductcount) {
                            doc.stockAllocation = "PartialAllocated";
                            doc.gotRequestedProducts = false;
                        } else if (count.requestedproductcount == count.holdproductcount) {
                            doc.stockAllocation = "Allocated";
                            doc.gotRequestedProducts = true;
                        }

                        if (doc.paymentStatus == "Paid") // need to check why this is here
                            doc.batchEnabled = true;

                        doc.save((err, doc) => {
                            resolve(doc);
                        });
                    } else {
                        resolve(doc);
                    }
                } else {
                    resolve();
                }
            }).catch(err => logger.error("err", err));
    });
}

function confirmOrder(req, res) {
    var eveniId = null;
    var amount = req.query.amount;
    var transactionId = req.query.id;
    var extId = req.query.extId || transactionId;
    getTotalAmountForOrder(transactionId)
        .then(_amount => {
            if (Math.round(_amount) <= Math.round(amount)) {
                Promise.resolve();
            } else {
                Promise.reject(new Error("Sorry! Amount Mismatch"));
            }
        }).then(() => initiateConfirmation(transactionId, extId))
        .then(() => updateSellerCharges(transactionId)).catch((err) => { console.log(err) })
        .then(() => updateSellerDashboardStatus(transactionId)).catch((err) => { console.log(err) })
        //.then(() => updateStockAllocate(transactionId))
        .then(result => {
            //Send SMS
            var body = {
                "id": result.fulfilledBy,
                "OrderId": result._id,
                "event": "EVENTSELL00013",
                "OrderValue": amount
            };
            sendSMS(body);
            res.status(200).json(result)
        })
        .then(() => poCreation(transactionId).catch(e => logger.error("Error occured on auto PO creation...", e.message)))
        .catch(err => res.status(400).json({
            message: err.message
        }));
}

/* 
    - Auto create purchase order for isSkWarehouse = false type of orders;
    - This is for partner WMF's like Walmart;
    - To raise a PO , order status and order payment status should be confirmed;
*/
function poCreation(orderID) {
    /* 
        - Add this order to Walmarts cart;
        - checkout at walmart;
        - update walmart response at order;
        - raise a po against walmart;
    */
    return new Promise((resolve, reject) => {
        crud.model.findOne({
            _id: orderID,
            isSkWarehouse: false,
            status: {
                $in: ["Confirmed"]
            }
        }).lean().exec().then(order => {
            if (order) {
                logger.trace("Walmart order , creating a PO.....");
                async.waterfall([
                    _getFc(order),
                    _createPo,
                    _addToParterCart,
                    _partnerCartCheckout,
                    _orderUpdate
                ], function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            } else {
                resolve();
            }
        }).catch(e => reject(e));
    });
}

function _getFc(order) {
    return function (callback) {

        var select = ["_id", "whId", "state", "district", "fcConfig", "isSkWarehouse", "partner"];
        var _path = `/fulfillmentcenter?filter=${encodeURIComponent(JSON.stringify({ whId: order.source }))}`;
        _path += `&select=${select}`;

        _fireHttpRequest("wh", _path, "GET", null).then(fc => {
            if (fc && fc.length) {
                callback(null, order, fc[0]);
            } else {
                callback(new Error(`Could not find FC....`));
            }
        }).catch(e => callback(e));
    }
}

function _createPo(order, fc, callback) {
    logger.info("Auto creating PO for walmart.......");
    var orderProducts = [];
    var productIds = [];
    var categoryIds = [];

    order.subOrders.map(sO => {
        sO.products.map(p => {
            p.subOrderId = sO._id;
            orderProducts.push(p);
            productIds.push(p.id);
            categoryIds.push(p.category);
        });
    });

    //get vendor;
    var vendorPath = `/${fc.partner.vendor}`;
    var vendorPromise = _fireHttpRequest('vendor', vendorPath, "GET", null).catch(e => callback(e));
    //Get products;
    var productUrl = `?filter=${encodeURIComponent(JSON.stringify({ _id: { $in: productIds } }))}&count=${productIds.length}`;
    var productPromise = _fireHttpRequest("product", productUrl, "GET", null).catch(e => callback(e));

    var catUrl = `?filter=${encodeURIComponent(JSON.stringify({ _id: { $in: categoryIds } }))}&count=${categoryIds.length}`;
    var categoryPromise = _fireHttpRequest("category", catUrl, "GET", null).catch(e => callback(e));

    Promise.all([vendorPromise, productPromise, categoryPromise]).then(result => {
        var vendor = result[0];
        var productList = result[1];
        var categoryList = result[2];

        if (!vendor) {
            callback(new Error(`Could not get Vendor..`));
            return;
        }
        if (!productList || !productList.length) {
            callback(new Error(`Could not get products..`));
            return;
        }
        var updateVendor = false;
        var vendorContact = _.find(vendor.contact, { "isOwner": "true" });
        vendorContact = !vendorContact ? vendor.contact[0] : vendorContact;

        var po = {
            orderId: order._id,
            isSkWarehouse: false,
            contact: {
                isOwner: vendorContact.isOwner,
                name: vendorContact.name,
                designation: vendorContact.designation,
                email: vendorContact.email,
                mobile: vendorContact.mobile,
                _id: vendorContact._id,
                vendorName: vendor.name,
                vendorId: vendor._id,
                address: `${vendor.address.line1 ? vendor.address.line1 : ""}, ${vendor.address.line2 ? vendor.address.line2 : ""}, ${vendor.address.landmark ? vendor.address.landmark : ""}, ${vendor.city ? vendor.city : ""}, ${vendor.district} ${vendor.state}, ${vendor.pincode}`,//"#174,10th cross , 10th Main,Indiranagar, Bangalore, Karnataka, 560031",
                state: vendor.state
            },
            products: [],
            expectedAt: new Date().setDate(new Date().getDate() + 3).toString(),
            remarks: "Auto Po Creation - System",
            whId: order.source,
            poValue: 0,
            status: "Draft",
            createdAt: new Date()
        }

        orderProducts.map(orderProduct => {
            var p = _.find(productList, { _id: orderProduct.id }); // from products collection;
            var category = _.find(categoryList, { _id: orderProduct.category });

            if (p) {

                /* 
                p.marginDealerPrice = category ? category.marginDealerPrice : false;
                var priceToCompute = p.dealer_price && p.marginDealerPrice ? p.dealer_price : p.mrp;
                var oP = priceToCompute;
                p.priceToCompute = priceToCompute;

                // get margin;
                var marginList = vendor.margins.filter(m => (m.brand == p.brand[0] && m.category == p.category[0]) || m.product == p._id);
                marginList = marginList.filter(m => dateCheck(m));

                if (!marginList || !marginList.length) {

                    updateVendor = true;
                    marginList = vendor.margins.filter(m => (m.brand == p.brand[0] && m.category == p.category[0]) || m.product == p._id);

                    if (!marginList || !marginList.length) {
                        var end = new Date();
                        end.setFullYear(end.getFullYear() + 50);
                        vendor.margins.push({
                            "product": p._id,
                            "whId": order.source,
                            "margin": 5,
                            "weightage": 5,
                            "start_date": new Date().toISOString(),
                            "end_date": end.toISOString(),
                            "brand": p.brand[0],
                            "category": p.category[0],
                            "marginType": "Product",
                        });
                    };
                    marginList.map(m => {
                        var today = new Date();
                        today.setFullYear(today.getFullYear + 50);
                        m.end_date = today.toISOString();
                    })
                }

                var finalMargin = 0;
                var stopLoop = false;
                if (marginList.length) {
                    marginList.forEach(el => {
                        if (!stopLoop) {
                            if (el.marginType == "Product") {
                                finalMargin = el.margin;
                                stopLoop = true;
                            } else {
                                finalMargin = el.margin;
                                stopLoop = false;
                            }
                        }
                    });
                }
                p.margins = {
                    bMargin: finalMargin,
                    sMargin: 0,
                    sMarginType: '%'
                };


                if (p.margins.bMargin > 0) {
                    priceToCompute = priceToCompute * (1 - (p.margins.bMargin / 100));
                }

                if (p.margins.sMarginType === '%') {
                    if (p.margins.sMargin) {
                        priceToCompute = priceToCompute * (1 - (p.margins.sMargin / 100));
                    }
                } else {
                    if (p.margins.sMargin) {
                        priceToCompute = priceToCompute - p.margins.sMargin;
                    }
                }
                p.unitPrice = priceToCompute;
                p.unitPrice = parseFloat(p.unitPrice);
                p.unitPrice = p.unitPrice < 0 ? 0 : p.unitPrice;
                p.totMargin = (oP - p.unitPrice) / oP * 100;
                p.totMargin = p.totMargin;
                p.total = orderProduct.quantity * p.unitPrice;
                p.total = p.total < 0 ? 0 : p.total; 
                po.poValue += p.total;
                */

                p.priceToCompute = p.transferPrice;
                p.unitPrice = p.transferPrice;
                p.margins = {
                    bMargin: (p.mrp - p.transferPrice),
                    sMargin: 0,
                    sMarginType: '%'
                }
                p.totMargin = (p.mrp - p.transferPrice) / p.mrp * 100;
                p.total = orderProduct.quantity * p.unitPrice;

                po.poValue += p.total;

                po.products.push({
                    "productId": p._id,
                    "subOrderId": orderProduct.subOrderId,
                    "name": p.name,
                    "mrp": p.mrp,
                    "availableStock": 0,
                    "dealerPrice": p.dealer_price,
                    "openPoQty": 0,
                    "quantity": {
                        "suggested": 0,
                        "requested": orderProduct.quantity
                    },
                    "unitPrice": p.unitPrice,
                    "total": p.total,
                    "skuCode": p.skuCode,
                    "dealCount": 1, // Find - No of deals having this product id - query= {product:  {$elemMatch : {id: productId}}}.count();
                    "pendingOrderProductQty": 0,
                    "marginDealerPrice": p.marginDealerPrice,
                    "margins": p.margins,
                    "orderQty": 0,
                    "order30": 0,
                    "categoryId": p.category[0],
                    "brandId": p.brand[0],
                    "delivery_chalan": false,
                    "priceToCompute": p.priceToCompute,
                    "totMargin": p.totMargin,
                    "lastRequiredQtyValue": orderProduct.quanity,
                    "mapping": p.mapping
                });
            }

        });
        //201811081/state
        //{"status":"Submitted","message":"Tets"}
        //{"status":"Open","message":"Test"}
        if (updateVendor) {
            logger.trace("Updating vendor margins ...........................");
            vendor.contact.map(c => {
                if (typeof c.isOwner === "string" && c.isOwner === "true") {
                    c.isOwner = true;
                } else {
                    c.isOwner = false;
                }
            });
            var vendorUrl = `/${vendor._id}`;
            _fireHttpRequest('vendor', vendorUrl, "PUT", vendor, null).then(updatedVendor => {
                // create Po;
                var poUrl = ` `;
                _fireHttpRequest('po', poUrl, "POST", po, { "defaultWhId": order.source }).then(_po => {
                    //approve po;
                    _fireHttpRequest('po', `/${_po._id}/state`, "POST", { "status": "Submitted", "message": "System - Auto submitted" }).then(submittedPo => {

                        _fireHttpRequest('po', `/${_po._id}/state`, "POST", { "status": "Open", "message": "System - Auto Approved" })
                            .then(updatedPo => {
                                callback(null, order, fc, _po, productList);
                            }).catch(e => callback(e));

                    }).then().catch(e => callback(e));

                }).catch(e => callback(e));


            }).catch(e => callback(e));
        } else {
            // create Po;
            var poUrl = ` `;
            _fireHttpRequest('po', poUrl, "POST", po, { "defaultWhId": order.source }).then(_po => {

                _fireHttpRequest('po', `/${_po._id}/state`, "POST", { "status": "Submitted", "message": "System - Auto submitted" }).then(submittedPo => {
                    //callback(null, order, fc, _po, productList);

                    _fireHttpRequest('po', `/${_po._id}/state`, "POST", { "status": "Open", "message": "System - Auto Approved" })
                        .then(updatedPo => {
                            logger.info(` PO created for non-sk order  ${order._id} with POId : ${_po._id}`);
                            callback(null, order, fc, _po, productList);

                        }).catch(e => callback(e));

                }).then().catch(e => callback(e));

            }).catch(e => callback(e));
        }


    }).catch(e => callback(e));

    //mathUnitPrice

    //addProductToPO - margin cal

}

function dateCheck(_margin) {
    var a = moment(_margin.end_date);
    var b = moment(new Date());
    if (a.diff(b, 'days') > 0) {
        return true;
    } else {
        return false;
    }
};


function _addToParterCart(order, fc, po, productList, callback) {
    //get products in orders in order to get mappings;
    var productIds = [];

    order.subOrders.map(sO => {
        sO.products.map(p => {
            p.subOrderId = sO._id;
            productIds.push(p.id);
            var prod = _.find(productList, { _id: p.id });
            p.mapping = prod ? prod.mapping : {};
        });
    });

    wmfIntergration.addToCart(fc, order).then(data => {
        callback(null, order, fc, po, data);
    }).catch(e => callback(e));
}

function _partnerCartCheckout(order, fc, po, cartData, callback) {
    wmfIntergration.checkOut(fc, order).then(data => {
        //update order;
        callback(null, order, fc, po, cartData, data);
    }).catch(e => callback(e));
}

function _orderUpdate(order, fc, po, cartData, checkOutData, callback) {
    var setter = {
        poId: po._id
    };

    Mongoose.models['omsMaster'].findOneAndUpdate({ _id: order._id }, { $set: setter }).exec()
        .then(updatedOrder => {
            callback(null, po);
        }).catch(e => callback(e));
}

function changeTransactionId(transactionId) {
    return new Promise(resolve => {
        var promises = [
            crud.model.find({
                transactionId: transactionId
            }).exec(),
            Mongoose.models["omsmps"].find({
                transactionId: transactionId
            }).exec()
        ];
        Promise.all(promises)
            .then(docs => {
                var date = new Date();
                date.setDate(date.getDate() + 1);
                cuti.counter.getCount("universalTransactionId" + date.getDate(), date, function (err, doc) {
                    var count = 1000000;
                    count += doc.next;
                    date.setDate(date.getDate() - 1);
                    var transactionId = count.toString() + date.getTime();
                    docs.forEach(_docs => {
                        _docs.forEach(el => {
                            el.transactionId = transactionId;
                            el.save(err => logger.error(err));
                        });
                    });
                    resolve();
                });
            });
    });
}

function updateState(req, res) {
    var params = crud.swagMapper(req);
    var invoiceId = params["id"];
    var state = params["state"];
    var internal = params["internal"];
    crud.model.find({
        "invoices.invoiceNo": invoiceId
    }).exec()
        .then(docs => {
            if (docs.length > 0) {
                var subOrders = docs[0].subOrders.filter(el => el.invoiceNo == invoiceId);
                subOrders.forEach(el => {
                    el.status = internal ? state : el.status;
                    el.internalStatus = state;
                });
                if (state == "Shipped" || state == "Delivered") {
                    if (docs[0].subOrders.filter(el => el.status != state).length > 0)
                        docs[0].status = "Partially " + state;
                    else
                        docs[0].status = state;
                }
                docs[0].save();
                res.status(200).json();
            } else {
                Mongoose.models["omsmps"].findOne({
                    invoices: invoiceId
                }).exec()
                    .then(doc => {
                        if (doc) {
                            doc.status = internal ? state : doc.status;
                            doc.save(err => logger.error(err));
                            res.status(200).json(doc);
                        } else {
                            res.status(200).json({
                                message: "Invalid Invoice Id"
                            });
                        }
                    });
            }
        }).catch(err => res.status(400).json({
            message: err.message
        }));
}

function getsellerOrderIndex(req, res) {
    var reqParams = crud.swagMapper(req);
    var filter = reqParams["filter"] ? reqParams.filter : {};
    var sort = reqParams["sort"] ? {} : {
        lastUpdated: -1
    };
    reqParams["sort"] ? reqParams.sort.split(",").map(el => el.split("-").length > 1 ? sort[el.split("-")[1]] = -1 : sort[el.split("-")[0]] = 1) : null;
    var select = reqParams["select"] ? reqParams.select.split(",") : [];
    var page = reqParams["page"] ? reqParams.page : 1;
    var count = reqParams["count"] ? reqParams.count : 10;
    var skip = count * (page - 1);
    var self = crud;
    if (typeof filter === "string") {
        try {
            filter = JSON.parse(filter);
            filter = self.FilterParse(filter);
        } catch (err) {
            crud.logger.error("Failed to parse filter :" + err);
            filter = {};
        }
    }
    if (crud.omit.length) {
        filter = _.omit(filter, crud.omit);
    }
    filter.deleted = false;
    var query = crud.model.find(filter);
    if (crud.lean) {
        query.lean();
    }
    if (crud.select.length || select.length) {
        var union = crud.select.concat(select);
        query.select(union.join(" "));
    }
    query.skip(skip).limit(count).sort(sort);
    query.exec(function (err, documents) {
        if (err) {
            return self.Error(res, err);
        }
        return self.Okay(res, documents);
    });
}
/**
 * products
 *  productId 
 *  quantity
 * whId
 * poId
 */
function poToOrder(req, res) {
    var params = crud.swagMapper(req);
    var data = params["data"];
    cuti.request.getElement("franchise", data.franchise)
        .then(franchise => {
            Promise.all(data.products.map(el => createSuborders(el.productId, el.quantity)))
                .then(subOrders => returnOrder(subOrders, franchise, data))
                .then((order) => getFulfillmentCenter(order, data))
                .then(order => createOrderSnapshots(order))
                .then(order => {
                    crud.model.create(order, (err, doc) => {
                        if (err)
                            crud.Error(res, err);
                        else
                            res.status(200).json(doc);
                    });
                });
        }).catch(err => crud.Error(res, err));
}

function getFulfillmentCenter(order, data) {
    return new Promise((resolve, reject) => {
        var _select = ["_id", "whId", "address", "state", "district", "town", "pincode", "name", "companyName", "finance_details", "contacts"];
        var _path = `/fulfillmentcenter?filter=${encodeURIComponent(JSON.stringify({ "whId": data.source }))}&select=${_select}`;
        orderHelper._fireHttpRequest("wh", _path, "GET", null).then(fcList => {
            if (fcList && fcList.length) {
                var fc = fcList[0];
                var contactNo = (fc.contacts.length) ? (fc.contacts[0].mobile).toString() : "";
                order.warehouseAddress = {
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
                };
                order.warehouseDetails = {
                    "gstno": fc.finance_details ? fc.finance_details.gstNo : "",
                    "serviceTax": fc.finance_details ? fc.finance_details.service_tax_no : "",
                    "vat": fc.finance_details ? fc.finance_details.tin_vat_no : "",
                    "cinno": fc.finance_details ? fc.finance_details.cinNo : ""
                };
                resolve(order);
            }
            else
                resolve(order);
        }).catch(e => reject(e));
    });
}


function returnOrder(subOrders, franchise, data) {
    var order = {
        fromPO: data.poId,
        status: "Confirmed",
        paymentStatus: "Paid",
        orderAmount: subOrders.reduce((prev, curr) => prev + (curr.mrp * curr.quantity), 0),
        source: data.source,
        subOrders: subOrders,
        franchise: {
            id: franchise._id,
            name: franchise.name,
            address: franchise.address,
            state: franchise.state,
            district: franchise.district,
            city: franchise.city,
            pincode: franchise.pincode
        },
        fulfilledBy: "MPS0",
        subOrdersCreated: true,
        snapshots: []
    };
    return order;
}

function createOrderSnapshots(order) {
    return new Promise((resolve) => {
        var snapShot = [];
        Promise.all(order.subOrders.map(el => blockForPO(el, snapShot)))
            .then(() => {
                order.snapshots = snapShot;
                resolve(order);
            });
    });
}

function blockForPO(subOrder, snapshots) {
    return new Promise((resolve) => {
        var payload = {
            products: [{
                productId: subOrder.id,
                quantity: subOrder.quantity,
                isSourcable: false
            }],
            dealId: "Internal",
            requested: 1
        };
        blockAtWarehouse(payload)
            .then(el => {
                Object.keys(el.quantity.snapshots).forEach(key => {
                    snapshots.push({
                        snapShotId: key,
                        quantity: el.quantity.snapshots[key]
                    });
                    resolve();
                });
            });
    });
}

function createSuborders(productId, quantity) {
    return new Promise((resolve) => {
        cuti.request.getElement("product", productId)
            .then(product => {
                resolve({
                    id: product._id,
                    mrp: product.mrp,
                    images: product.images,
                    name: product.name,
                    category: {
                        id: product.category[0]
                    },
                    brand: {
                        id: product.brand[0]
                    },
                    products: [{
                        id: product._id,
                        name: product.name,
                        mrp: product.mrp,
                        barcode: product.barcode,
                        quantity: quantity,
                        images: product.images
                    }],
                    subOrdersCreated: true,
                    invoice_seperately: product.invoice_seperately,
                    quantity: quantity
                });
            });
    });
}

function duplicatedOrder(req, res) {
    var body = crud.swagMapper(req)["data"];
    var filter = {
        "invoices": {
            "$elemMatch": {
                "invoiceNo": body.invoiceNo
            }
        }
    };
    crud.model.findOne(filter).lean().exec().then(doc => {
        doc.isDuplicateOf = doc._id;
        doc.invoices = [{
            "invoiceNo": body.invoiceNo
        }];
        doc.status = "Confirmed";
        doc.deals = doc.deals.filter(function (el) {
            return body.deal === el.id;
        });
        doc.subOrders = doc.subOrders.filter(el => {
            return el.id === body.deal;
        }).map(el => {
            delete el.internalStatus;
            delete el.status;
            delete el.batchId;
            delete el.performaInvoiceNo;
            body.products.forEach(function (product) {
                el.products = [];
                doc.snapshots = doc.snapshots.filter(snapshot => {
                    return snapshot.productId === product.id;
                });
                el.products = body.products.filter(function (element) {
                    return element.name === el.name;
                });
            });
            return el;
        });
        doc.orderAmount = 0;
        doc.processed = false;
        doc.deals.forEach(deal => {
            doc.orderAmount += deal.quantity * deal.price;
        });
        delete doc._id;
        crud.model.create(doc, function (err, doc1) {
            if (!doc1)
                res.status(400).json(err);
            else {
                res.status(200).json(doc1);
            }
        });
    });
}

function filterOrder(invoiceNo) {
    return crud.model.findOne({
        "invoices.invoiceNo": invoiceNo
    })
        .exec()
        .then((omsData) => {
            return omsData;
        })
        .catch(err => logger.error(err));
}

function serviceOrder(req, res) {
    var invoiceNo = req.query.id;
    var query = "invoices.invoiceNo:" + invoiceNo;
    Promise.all([filterOrder(invoiceNo), elasticController.searchElastic(query)])
        .then((ordersArray) => {
            if (ordersArray[0] !== null) {
                res.status(200).json(ordersArray[0]);
            } else if (ordersArray[1].hits.total > 0) {
                res.status(200).json(ordersArray[1].hits.hits[0]._source);
            } else {
                res.status(404).json({
                    message: "Invalid invoice no."
                });
            }
        })
        .catch(err => logger.error(err));
}

function cancelAllOrders(req, res) {
    var date = new Date();
    date.setDate(date.getDate() - 15);
    crud.model.find({
        createdAt: {
            $lte: date
        },
        status: "Created"
    }).exec()
        .then(docs => docs.map(el => {
            el.status = "Cancelled";
            el.suborders.map(ell => {
                ell.status = "Cancelled";
                ell.logs.push({
                    "status": "Order Cancelled",
                    createdAt: new Date()
                });
            });
            return el.save();
        }))
        .then(promises => Promise.all(promises))
        .then(docs => res.status(200).json(docs))
        .catch(err => res.status(400).json({
            message: err.message
        }));
}
/*will cover omsmaster & omsmps*/
function allOrdersTotalAmount(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }
    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }
    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": null,
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            Mongoose.models["omsmps"].aggregate(aggregate).exec()
                .then(function (mpsdoc) {
                    if (omsdoc.length && mpsdoc.length) {
                        res.status(200).json(omsdoc[0].totalOrderAmount + mpsdoc[0].totalOrderAmount);
                    } else if (omsdoc.length) {
                        res.status(200).json(omsdoc[0].totalOrderAmount);
                    } else if (mpsdoc.length) {
                        res.status(200).json(mpsdoc[0].totalOrderAmount);
                    } else {
                        res.status(200).json(0);
                    }
                });
        });
}
/*will cover omsmaster & omsmps*/
function allOrdersTotalCount(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }
    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }
    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": null,
            "totalOrderCount": {
                $sum: 1
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            Mongoose.models["omsmps"].aggregate(aggregate).exec()
                .then(function (mpsdoc) {
                    if (omsdoc.length && mpsdoc.length) {
                        res.status(200).json(omsdoc[0].totalOrderCount + mpsdoc[0].totalOrderCount);
                    } else if (omsdoc.length) {
                        res.status(200).json(omsdoc[0].totalOrderCount);
                    } else if (mpsdoc.length) {
                        res.status(200).json(mpsdoc[0].totalOrderCount);
                    } else {
                        res.status(200).json(0);
                    }
                });
        });
}

function skOrdersTotalAmount(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }
    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }
    filter["fulfilledBy"] = "MPS0";
    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": null,
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            res.status(200).json(omsdoc[0].totalOrderAmount);
        });
}

/**
 * Get order values list by ststus for ERP order listing page stats
 * @since 07/02/2018
 * @author Robin <robin.s@techjini.com>
 */
function orderValueByStatus(req, res) {

    var filter = crud.swagMapper(req)["filter"];
    if (filter) {

        filter = JSON.parse(filter);
    } else {
        filter = {};
    }

    if (filter["date"]) {
        filter["createdAt"] = {};
        if (filter["date"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["date"]["$gte"]);
        }
        if (filter["date"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["date"]["$lte"]);
        }
        delete filter.date;
    }

    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": "$status",
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {

            res.status(200).json(_.groupBy(omsdoc, "_id"));
        });
}

function skOrdersTotalAmountByStatus(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }

    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }

    filter["fulfilledBy"] = "MPS0";

    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": "$status",
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            res.status(200).json(_.groupBy(omsdoc, "_id"));
        });
}

function sellerOrdersTotalAmount(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }
    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }
    filter["fulfilledBy"] = /SEL/;
    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": null,
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            if (omsdoc.length)
                res.status(200).json(omsdoc[0].totalOrderAmount);
            else
                res.status(200).json(0);
        });
}


function sellerOrdersTotalAmountByStatus(req, res) {
    var filter = crud.swagMapper(req)["filter"];
    if (filter) {
        filter = JSON.parse(filter);
    } else {
        filter = {};
    }

    if (filter["createdAt"]) {
        if (filter["createdAt"]["$gte"]) {
            filter["createdAt"]["$gte"] = new Date(filter["createdAt"]["$gte"]);
        }
        if (filter["createdAt"]["$lte"]) {
            filter["createdAt"]["$lte"] = new Date(filter["createdAt"]["$lte"]);
        }
    }

    filter["fulfilledBy"] = /SEL/;

    var aggregate = [{
        "$match": filter
    }, {
        "$group": {
            "_id": "$status",
            "totalOrderAmount": {
                $sum: "$orderAmount"
            }
        }
    }];
    Mongoose.models["omsMaster"].aggregate(aggregate).exec()
        .then(function (omsdoc) {
            if (omsdoc.length)
                res.status(200).json(_.groupBy(omsdoc, "_id"));
            else
                res.status(200).json([]);
        });
}

// function index(req, res) {
//     var filter = {};
//     if (req.user) {
//         if (req.swagger.params.filter.value) {
//             filter = JSON.parse(req.query.filter);
//             if (req.user.franchise != "WMF0") filter["franchise.id"] = req.user.franchise;
//             req.swagger.params.filter.value = JSON.stringify(filter);
//         } else if (req.user.franchise != "WMF0") {
//             filter["franchise.id"] = req.user.franchise;
//             req.swagger.params.filter.value = JSON.stringify(filter);
//         }
//         crud.index(req, res);
//     } else res.status(401).json({ message: "Unauthorized" });
// }

function index(req, res) {
    var filter = {},
        params = crud.swagMapper(req),
        page = params.page ? params.page : 1,
        count = params.count ? params.count : 10,
        select = params.select ? params.select.split(",") : [],
        result = [];
    var sort = "";
    try {
        sort = JSON.parse(params.sort);
    } catch (e) {
        sort = {
            "createdAt": 1
        };
    }
    if (req.user) {
        var filerArray = {};
        if (req.swagger.params.filter.value) {
            filter = JSON.parse(req.query.filter);
            if (req.user.franchise != "WMF0" && filter["franchise.id"]) {
                if (req.user.franchise)
                    filter["franchise.id"] = req.user.franchise;
            }
            req.swagger.params.filter.value = JSON.stringify(filter);
        } else if (req.user.franchise != "WMF0" && filter["franchise.id"]) { //&& !filter['franchise.id']['$in']
            if (req.user.franchise)
                filter["franchise.id"] = req.user.franchise;
            req.swagger.params.filter.value = JSON.stringify(filter);
        }
        delete filter.type;
        var elasticFilter = filter;
        delete elasticFilter.keyword;
        var orArray = [];
        var innerFilerArray = [];
        if (params.keyword) {
            var keyword = params.keyword;
            var OrObject = {
                "_id": new RegExp(keyword, "i")
            };
            orArray.push(OrObject);
            var franMobileObject = {
                "franchise.mobile": new RegExp(keyword, "i")
            };
            orArray.push(franMobileObject);
            var cusObject = {
                "customer.name": new RegExp(keyword, "i")
            };
            orArray.push(cusObject);
            innerFilerArray.push(filter);
            innerFilerArray.push({
                $or: orArray
            });
            filter = {
                $and: innerFilerArray
            };
        }
        // console.log("filter",filter);
        return getRFfromrmfId(params)
            .then((rfList) => {
                if (rfList) {
                    if (params.rmfFranchiseId != undefined) {
                        rfList.push(params.rmfFranchiseId);
                        filter["franchise.id"] = {
                            "$in": rfList
                        };
                    }
                }
                crud.model.find(filter).skip((page - 1) * count).limit(count).sort(sort).select(select.join(" ")).lean().exec()
                    .then(mOrders => {
                        if (mOrders.length && (filter["transactionId"] || filter["invoices.invoiceNo"])) {
                            res.status(200).json(mOrders);
                            return;
                        }
                        if (mOrders.length === count) {
                            res.status(200).json(mOrders);
                        } else {
                            var mongoCount = mOrders.length,
                                result = mOrders;
                            if (mOrders.length) {
                                var createdAt = mOrders[0].createdAt;
                                filter["createdAt"] = {
                                    "$gte": createdAt
                                };
                            }
                            checkIfElasticIsNeeded(result, elasticFilter, page, count, mongoCount, select, sort)
                                .then(finalOrders => {
                                    res.status(200).json(finalOrders);
                                })
                                .catch(err => {
                                    logger.error(err);
                                    res.status(500).json({ mesage: err.message });
                                });
                        }
                    })
                    .catch(err => {
                        logger.error(err);
                        res.status(500).json({ mesage: err.message });
                    });
            });
    } else {
        res.status(401).json({
            message: "Unauthorized"
        });
    }
}

function getRFfromrmfId(params) {
    var rfList = [];
    return new Promise((resolve, reject) => {
        if (!params.rmfFranchiseId)
            resolve(rfList);
        else {
            _requestHttp("franchise", "getRFList/" + params.rmfFranchiseId, "GET", {}, function (err, fdata) {
                if (fdata) {
                    fdata.forEach(f => rfList.push(f._id));
                    resolve(rfList);
                } else if (err)
                    resolve(rfList);
            });
        }
    });
}

function checkIfElasticIsNeeded(result, filter, page, count, mongoCount, select, sort) {
    if (result.length < count) {
        var query = mongoToElasticFilter(filter, 0, count - result.length, select, sort);
        return new Promise((resolve, reject) => {
            queryElastic(query, null)
                .then(docs => {
                    if (docs.length) {
                        for (var iter = 0; iter < docs.length; iter++) {
                            docs[iter]._source._id = docs[iter]._id;
                            result.push(docs[iter]._source);
                        }
                    }
                })
                .then(() => resolve(result))
                .catch(err => {
                    resolve(result);
                });
        });
    } else {
        return new Promise(res => res());
    }
}

function mongoToElasticFilter(filter, page, count, select, sort) {
    var esSort = [];
    if (sort)
        Object.keys(sort).forEach(key => {
            var obj = {};
            key = key == "_id" ? "_uid" : key;
            obj[key] = sort[key] == 1 ? "asc" : "desc";
            esSort.push(obj);
        });
    var flag = true;
    var query = {
        from: page * count,
        size: count,
        sort: esSort,
        _source: {
            "includes": select ? select : []
        },
        query: {
            bool: {
                must: [],
                must_not: []
            }
        }
    };
    if (filter["franchise.id"]) {
        var obj = {
            "match": {
                "franchise.id": filter["franchise.id"]
            }
        };
        if (filter["franchise.id"]["$in"])
            obj = {
                "terms": {
                    "franchise.id.keyword": filter["franchise.id"]["$in"]
                }
            };
        query.query.bool.must.push(obj);
    }
    if (filter["date"]) {
        var obj = {
            "range": {
                "date": {
                    "gte": filter["date"]["$gte"],
                    "lte": filter["date"]["$lte"]
                }
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["status"]) {
        var obj = {};
        if (filter["status"]["$in"]) {
            obj = {
                "terms": {
                    "status.keyword": filter["status"]["$in"]
                }
            };
            query.query.bool.must.push(obj);
        } else if (filter["status"]["$nin"]) {
            var ninobj = {
                "terms": {
                    "status.keyword": filter["status"]["$nin"]
                }
            };
            query.query.bool["must_not"].push(ninobj);
        } else {
            obj = {
                "match": {
                    "status": filter["status"]
                }
            };
            query.query.bool.must.push(obj);
        }
    }
    if (filter["_id"]) {
        var obj = {
            "match": {
                "_id": filter["_id"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["mpsOrderId"]) {
        var obj = {
            "match": {
                "mpsOrderId": filter["mpsOrderId"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["typeOfOrder"]) {
        var obj = {
            "match": {
                "typeOfOrder": filter["typeOfOrder"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["mpsOrderType"]) {
        var obj = {
            "match": {
                "mpsOrderType": filter["mpsOrderType"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["partnerOrderDetails.paymentType"]) {
        var obj = {
            "match": {
                "partnerOrderDetails.paymentType": filter["partnerOrderDetails.paymentType"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["mpsPaymentStatus"]) {
        var obj = {
            "match": {
                "mpsPaymentStatus": filter["mpsPaymentStatus"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["isOffline"]) {
        var obj = {
            "match": {
                "isOffline": filter["isOffline"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["trackingId"]) {
        var obj = {
            "match": {
                "trackingId": filter["trackingId"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["inwardScan"]) {
        var obj = {
            "match": {
                "inwardScan": filter["inwardScan"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["orderType"]) {
        var obj = {
            "match": {
                "orderType": filter["orderType"]
            }
        };
        if (filter["orderType"]["$in"])
            obj = {
                "terms": {
                    "orderType.keyword": filter["orderType"]["$in"]
                }
            };
        query.query.bool.must.push(obj);
    }
    if (filter["paymentStatus"]) {
        var obj = {
            "match": {
                "paymentStatus": filter["paymentStatus"]
            }
        };
        if (filter["paymentStatus"]["$in"])
            obj = {
                "terms": {
                    "paymentStatus.keyword": filter["paymentStatus"]["$in"]
                }
            };
        query.query.bool.must.push(obj);
    }
    if (filter["shippingAddress.state"]) {
        var obj = {
            "match": {
                "shippingAddress.state": filter["shippingAddress.state"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["shippingAddress.state"] && filter["shippingAddress.district"]) {
        var obj = {
            "match": {
                "shippingAddress.district": filter["shippingAddress.district"]
            }
        };
        query.query.bool.must.push(obj);
    }
    if (filter["shippingAddress.state"] && filter["shippingAddress.district"] && filter["shippingAddress.city"]) {
        var obj = {
            "match": {
                "shippingAddress.city": filter["shippingAddress.city"]
            }
        };
        query.query.bool.must.push(obj);
    }
    return query;
}

function queryElastic(query, _type) {
    return new Promise((resolve, reject) => {
        var options = {},
            host, port;
        options.method = "POST";
        if (es_url.indexOf("@") > 0) {
            host = es_url.split("@")[1].split(":")[0];
            port = es_url.split(":").pop();
            options.auth = es_url.split("@")[0];
        } else {
            host = es_url.split(":")[0];
            port = es_url.split(":")[1];
        }
        options.host = host;
        options.port = port;
        options.path = "/oms_alias/deleted/_search";
        var req = http.request(options, response => {
            var data = "";
            response.on("data", _data => data += _data.toString());
            response.on("end", () => {
                if (response.statusCode == 200) {
                    if (_type === "count") {
                        resolve(JSON.parse(data).hits.total);
                    } else {
                        resolve(JSON.parse(data).hits.hits);
                    }
                } else {
                    reject(JSON.parse(data));
                }
            });
        });
        req.end(JSON.stringify(query));
        req.on("error", (err) => reject(err));
    });
}

function countOrder(req, res) {
    var filter = {},
        params = crud.swagMapper(req),
        result = [];
    if (req.user) {
        if (req.swagger.params.filter.value) {
            filter = JSON.parse(req.query.filter);
            if (req.user.franchise != "WMF0" && req.user.franchise) filter["franchise.id"] = req.user.franchise;
            req.swagger.params.filter.value = JSON.stringify(filter);
        } else if (req.user.franchise != "WMF0" && req.user.franchise) {
            filter["franchise.id"] = req.user.franchise;
            req.swagger.params.filter.value = JSON.stringify(filter);
        }
        crud.model.find(filter).count().exec()
            .then(mOrders => {
                let query = mongoToElasticFilter(filter, 0, -1, undefined);
                queryElastic(query, "count")
                    .then(elData => {
                        res.status(200).json(mOrders + elData);
                    })
                    .catch(err => {
                        res.status(200).json(mOrders);
                    });
            })
            .catch(err => logger.error(err));
    } else res.status(401).json({
        message: "Unauthorized"
    });
}

function pendingPayOrderNotify(req, res) {
    crud.model.find({
        status: {
            $in: ["Created", "Payment Initiated"]
        }
    })
        .exec()
        .then(pendingOrders => {
            if (pendingOrders.length) {
                pendingOrders.map(el => {
                    events.postNotification(el._id, "EVENTOMS10029");
                });
                res.status(200).json({
                    mesage: "Notification sent"
                });
            } else {
                res.status(200).json({
                    mesage: "No Payment Pending Orders."
                });
            }
        })
        .catch(err => logger.error(err));
}

function createSubordersForCheckout(skOrders, mpsOrders) {
    return Promise.all(skOrders.map((_subOrders, index) => {
        return new Promise((_resolve, _reject) => {
            return getFcDetails(_subOrders)
                .then((_d) => {
                    // var fcAddress = orderHelper.getFcAddress(fc);
                    // var fcFinanceDetails = orderHelper.getFcFinancedetails(fc);
                    // _d.warehouseAddress = fcAddress;
                    // _d.warehouseDetails = fcFinanceDetails;
                    if (_d.fulfilledBy == "MPS0" || _d.fulfilledBy.indexOf("SEL") > -1) {
                        var map = {};
                        var deals = [];
                        _d.deals.forEach(el => {
                            if (!map[el.id]) {
                                map[el.id] = 1;
                                deals.push(el);
                            } else {
                                var deal = deals.find(_el => el.id == _el.id);
                                deal.quantity += el.quantity;
                            }
                        });
                        var suborders = deals.map(deal => orderHelper.createSubOrders(deal, _d.orderType, _d.franchise.id));
                        Promise.all(suborders).then(
                            _suborders => {
                                _suborders.forEach((_s, _i) => _s._id = _d._id + "_" + (_i + 1));
                                _d.subOrders = _suborders;
                                _d.subOrdersCreated = true;
                                _d.status = "Created";
                                var type = _d.orderType == "Retail" ? "b2c" : "b2b";
                                Promise.all(_d.subOrders.map(el => getCommission(el, _d.franchise.id, type)))
                                    .then((resolvedSubOrders) => {
                                        Promise.all(resolvedSubOrders.map(ell => getNetworkCommission(ell, _d.franchise.id, "RMF"))).then((finalSubOrders) => {
                                            Promise.all(resolvedSubOrders.map(ell => getImeiCommission(ell, _d.franchise.id, type))).then((finalSubOrders) => {
                                                _d.subOrders = finalSubOrders;
                                                // _d.subOrders = resolvedSubOrders;
                                                skOrders[index] = _d;
                                                var result = [_d];
                                                var promises = [];
                                                _resolve(result);
                                            });
                                        });

                                    });
                            },
                            _e => _reject(_e)
                        );
                    } else {
                        var type = _d.orderType == "Retail" ? "b2c" : "b2b";
                        Promise.all(_d.subOrders.map(el => getCommission(el, _d.franchise.id, type)))
                            .then((resolvedSubOrders) => {
                                _d.subOrders = resolvedSubOrders;
                                skOrders[index] = _d;
                                var result = [_d];
                                var promises = [];
                                _resolve(result);
                            });
                    }
                });
        });
    })).then(() => [skOrders, mpsOrders]);
}

function getFcDetails(subOrder) {

    if ((subOrder.source).indexOf("SEL") == -1) {
        return orderHelper.getFulfillmentCenter(subOrder.source)
            .then((fc) => {
                var fcAddress = orderHelper.getFcAddress(fc);
                var fcFinanceDetails = orderHelper.getFcFinancedetails(fc);
                subOrder.warehouseAddress = fcAddress;
                subOrder.warehouseDetails = fcFinanceDetails;
                subOrder.isSkWarehouse = fc.isSkWarehouse;
                return subOrder;
            })
    } else {
        return new Promise(resolve => {
            resolve(subOrder);
        });
    }

}

function updateOrderBatchstatus(req, res) {
    var params = crud.swagMapper(req);
    var orderId = params.id;
    crud.find({
        "_id": orderId
    }).exec()
        .then(function (ordData) {
            if (ordData.length > 0) {
                ordData.disabledBatch = params.disabledBatch;
                res.status(200).send(ordData);
            } else {
                res.status(400).json({
                    message: "No data found."
                });
            }
        })
        .catch(function (err) {
            res.status(500).json({
                message: "Something went Wrong"
            });
        });
}

function cancelSubOrder(req, res) {
    var params = crud.swagMapper(req);
    var id = params["id"];
    var body = crud.swagMapper(req)["data"];
    var subOrders = body.subOrders;
    var updateType = body.updateType || "Cancelled";
    if (subOrders.length > 0) {
        crud.model.findOne({
            "_id": id,
            "subOrders._id": {
                $in: subOrders
            },
            $or: [{
                "subOrders.status": "Pending"
            }, {
                "subOrders.status": "Confirmed"
            }]
        })
            .exec().then(doc => {
                if (doc) {
                    var finalSubOrders = [];
                    doc.subOrders.map((el, index) => {
                        if (_.includes(subOrders, el._id)) {
                            if (el.status == "Pending" || el.status == "Confirmed")
                                finalSubOrders.push(el);
                        }
                    });
                    if (finalSubOrders.length) {
                        var getStatus = finalSubOrders[0].status;
                        if (getStatus == "Pending") {
                            if (finalSubOrders.length == doc.subOrders.length)
                                doc.status = "";
                            var status = true;
                            doc.subOrders.map((el, index) => {
                                if (_.includes(subOrders, el._id)) {
                                    if (el.status == "Pending" || el.status == "Confirmed") {
                                        el.status = "Cancelled";
                                        el.logs.push({
                                            "status": "Order Cancelled",
                                            createdAt: new Date()
                                        });
                                    }
                                }
                                if (el.status != "Cancelled")
                                    status = false;
                            });
                            if (status)
                                doc.status = "Cancelled";
                            doc.save();
                            res.status(200).json({
                                message: "Orders Cancelled successfully"
                            });
                        } else if (getStatus == "Confirmed") {
                            if (doc.fulfilledBy == "MPS0") {
                                var totalAmount = 0;
                                var snapshots = [];
                                if (finalSubOrders.length == doc.subOrders.length) {
                                    doc.status = "Cancelled";
                                    totalAmount = doc.orderAmount;
                                    doc.paymentStatus = "Reverted";
                                    doc.subOrders.map(el => {
                                        el.status = "Cancelled";
                                        el.logs.push({
                                            "status": "Order Cancelled",
                                            createdAt: new Date()
                                        });
                                        el.snapshots.map(ell => {
                                            snapshots.push(ell);
                                        });
                                        el.requestedProducts = [];
                                        el.snapshots = [];
                                        el.blockedProducts = [];
                                        el.products.forEach(p => {
                                            p.blockedQty = 0;
                                        });
                                        el.gotRequestedProducts = false;
                                        el.readyForBatching = false;
                                    });
                                } else {
                                    var status = true;
                                    doc.subOrders.map((el, index) => {
                                        if (_.includes(subOrders, el._id)) {
                                            if (_.includes(subOrders, el._id)) {
                                                if (el.status == "Pending" || el.status == "Confirmed") {
                                                    el.status = "Cancelled";
                                                    el.logs.push({
                                                        "status": "Order Cancelled",
                                                        createdAt: new Date()
                                                    });
                                                    el.snapshots.map(ell => {
                                                        snapshots.push(ell);
                                                    });
                                                    el.requestedProducts = [];
                                                    el.snapshots = [];
                                                    el.gotRequestedProducts = false;
                                                    el.readyForBatching = false;
                                                    el.blockedProducts = [];
                                                    el.products.forEach(p => {
                                                        p.blockedQty = 0;
                                                    });
                                                    var sellingPrice = el.price;
                                                    var price = (sellingPrice * el.quantity) + el.shippingCharges;
                                                    totalAmount += price;
                                                }
                                            }
                                        }
                                        if (el.status != "Cancelled")
                                            status = false;
                                    });
                                }
                                if (status)
                                    doc.status = "Cancelled";
                                return new Promise((_res, _rej) => {
                                    cuti.request.getUrlandMagicKey("wh")
                                        .then(options => {
                                            options.path += "/returnProducts";
                                            options.method = "PUT";
                                            http.request(options, response => {
                                                if (response.statusCode == 200) {
                                                    doc.save();
                                                    _res();
                                                } else {
                                                    var data = "";
                                                    response.on("data", _data => data += _data.toString());
                                                    response.on("end", () => {
                                                        _rej("Oops Some thing Went Wrong ! Plesae try again");
                                                    });
                                                }
                                            }).end(JSON.stringify(snapshots));
                                        });
                                }).then(() => {
                                    var mobileNo;
                                    if (doc.orderType == "Retail")
                                        mobileNo = doc.customer.mobile;
                                    else
                                        mobileNo = doc.franchise.mobile;
                                    return revertOrderAmount(doc._id, subOrders, doc.franchise.id, totalAmount, doc.orderType, mobileNo);
                                }).then(() => res.status(200).json({
                                    message: "Orders Cancelled successfully"
                                }));
                            } else if (doc.fulfilledBy.index("SEL") == -1) {
                                if (doc.subOrders.length == finalSubOrders.length) {
                                    doc.status = "Cancelled";
                                    doc.paymentStatus = "Reverted";
                                }
                                return new Promise((_res, _rej) => {
                                    doc.subOrders.map(el => {
                                        if (_.includes(subOrders, el._id)) {
                                            if (el.status == "Pending" || el.status == "Confirmed") {
                                                el.status == "Cancelled";
                                                el.logs.push({
                                                    "status": "Order Cancelled",
                                                    createdAt: new Date()
                                                });
                                                var sellingPrice = el.orderType == "Retail" ? el.memberPrice : el.b2bPrice;
                                                var price = (sellingPrice * el.quantity) + el.shippingCharges;
                                                totalAmount += price;
                                                new Promise((__res, __rej) => {
                                                    cuti.request.getUrlandMagicKey("deal")
                                                        .then(options => {
                                                            options.path += "v1/" + el.id + "return?seller=" + doc.fulfilledBy + "&quantity=" + el.quantity + "type=B2C";
                                                            options.method = "PUT";
                                                            http.request(options, response => {
                                                                if (response.statusCode == 200) {
                                                                    __res();
                                                                } else {
                                                                    var data = "";
                                                                    response.on("data", _data => data += _data.toString());
                                                                    response.on("end", () => {
                                                                        __rej("sorry! Unable to revert the quantity");
                                                                    });
                                                                }
                                                            }).end();
                                                        });
                                                });
                                            }
                                        }
                                    });
                                    doc.save();
                                    _res();
                                }).then(() => {
                                    var mobileNo;
                                    if (doc.orderType == "Retail")
                                        mobileNo = doc.customer.mobile;
                                    else
                                        mobileNo = doc.franchise.mobile;
                                    return revertOrderAmount(doc._id, subOrders, doc.franchise.id, totalAmount, doc.orderType, mobileNo);
                                }).then(() => res.status(200).json({
                                    message: "Orders Cancelled successfully"
                                }));
                            } else {
                                res.status(400).json({
                                    message: "Sorry! Mps Orders Not enabled for Cancellation"
                                });
                            }
                        }
                    } else {
                        res.status(400).json({
                            message: "Sorry! The requested orders has been cancelled or shipped already"
                        });
                    }
                } else {
                    res.status(400).json({
                        message: "Sorry! The requested orders has been cancelled or shipped already"
                    });
                }
            }).catch(err => res.status(500).json({
                message: "Something went Wrong"
            }));
    } else {
        res.status(400).json({
            message: "Sorry! The requested orders has been cancelled or shipped already"
        });
    }
}

function revertScannedPackage(req, res) {
    var params = crud.swagMapper(req);
    var body = params["data"];
    var invoiceNo = body.invoiceNo;
    // revertOrderStatus(req,res,invoiceNo)
    // then(()=>revertInvoiceStatus(invoiceNo))
    //then(()=>revertBatchStatus(invoiceNo))
    return revertLogisticStatus(invoiceNo) // .then(()=>revertLogisticStatus(invoiceNo))
        // .then(()=>revertInvoiceFromMotherBox(invoiceNo))
        .then(() => res.status(200).json({
            "message": "Package Reverted"
        }))
        .catch((err) => res.status(400).json({
            "message": err
        }));
}

function revertOrderStatus(req, res, invoiceNo) {
    var invoice_arr = [];
    invoice_arr.push(invoiceNo);
    return new Promise((resolve, reject) => {
        return mpsController.crud.model.findOne({
            invoice: {
                "$in": invoice_arr
            },
            status: {
                "$nin": ["Ready To Ship", "Shipped", "Delivered"]
            }
        }).exec()
            .then((mpsdocs) => {
                if (mpsdocs) {
                    mpsdocs.payoutStage = "Inwarded";
                    mpsdocs.status = "Created";
                    mpsdocs.save();
                    return inwardScanBatchController.crud.model.findOne({
                        "trackingIds.trackingId": mpsdocs.trackingId
                    }).exec()
                        .then((batchdocs) => {
                            if (batchdocs) {
                                batchdocs.status = "Pending";
                                batchdocs.save();
                                resolve(batchdocs);
                            }
                        });
                } else {
                    return crud.model.findOne({
                        "subOrders.invoiceNo": invoiceNo,
                        "subOrders.status": {
                            "$nin": ["Shipped", "Delivered"]
                        }
                    }).exec()
                        .then((omsdocs) => {
                            if (omsdocs) {
                                omsdocs.inwardScan = false;
                                omsdocs.subOrders = omsdocs.subOrders.filter(el => el.invoiceNo == invoiceNo);
                                omsdocs.subOrders.forEach(sOrder => {
                                    if (sOrder.status != "Shipped" && sOrder.status != "Delivered") {
                                        sOrder.status = "Packed";
                                        omsdocs.save((err, document) => logger.error(err, document));
                                    }
                                });
                                omsdocs.save();
                                return inwardScanBatchController.crud.model.findOne({
                                    "trackingIds.trackingId": invoiceNo
                                }).exec()
                                    .then((batchdocs) => {
                                        if (batchdocs) {
                                            batchdocs.status = "Pending";
                                            batchdocs.save();
                                            resolve(batchdocs);
                                        }
                                    });
                            } else
                                res.status(400).json("Invalid InvoiceNo");
                        });
                }
            });
    });
}

function revertInvoiceStatus(invoiceNo) {
    return new Promise((resolve, reject) => {
        return invoiceController.crud.model.find({
            _id: invoiceNo
        }).exec()
            .then((invoicedocs) => {
                if (invoicedocs) {
                    resolve(invoicedocs);
                }
            });
    });
}

function revertBatchStatus(invoiceNo) {
    var invoice_arr = [];
    invoice_arr.push(invoiceNo);
    return new Promise((resolve, reject) => {
        mpsController.crud.model.findOne({
            invoice: {
                "$in": invoice_arr
            },
            status: {
                "$nin": ["Ready To Ship", "Shipped", "Delivered"]
            }
        }).exec()
            .then((doc) => {
                return inwardScanBatchController.crud.model.findOne({
                    "trackingIds.trackingId": doc.trackingId
                }).exec()
                    .then((batchdocs) => {
                        if (batchdocs) {
                            batchdocs.status = "Pending";
                            batchdocs.save();
                            resolve(batchdocs);
                        }
                    });
            });
    });
}

function revertLogisticStatus(invoiceNo) {
    var inputs = {};
    inputs.invoiceNo = invoiceNo;
    inputs.trayClosed = false;
    inputs.trayGenerated = false;
    inputs.useCourier = false;
    inputs.courierId = "";
    inputs.firstHopPincode = "";
    inputs.motherBox = "";
    inputs.status = "Pending Segregation Scan";
    var data1 = {
        data: inputs
    };
    return new Promise((resolve, reject) => {
        return cuti.request.getUrlandMagicKey("logistics")
            .then(options => {
                options.method = "PUT";
                options.path += "/";
                http.request(options, response => {
                    var data1 = "";
                    response.on("data", _data => data1 += _data.toString("utf8"));
                    if (response.statusCode == 200) {
                        response.on("end", () => {
                            var data = JSON.parse(data1);
                            resolve1(data);
                        });
                    }
                }).end(JSON.stringify(data1));
            });
    });
}

function revertInvoiceFromMotherBox(invoiceNo) {
    var inputs = {};
    inputs.invoiceNo = invoiceNo;
    var data1 = {
        data: inputs
    };
    return new Promise((resolve, reject) => {
        return cuti.request.getUrlandMagicKey("logistics")
            .then(options => {
                options.method = "PUT";
                options.path += "/removeInvoiceFrommotherBox";
                http.request(options, response => {
                    var data1 = "";
                    response.on("data", _data => data1 += _data.toString("utf8"));
                    if (response.statusCode == 200) {
                        response.on("end", () => {
                            var mBoxData = JSON.parse(data1);
                            resolve1(mBoxData);
                        });
                    }
                }).end(JSON.stringify(data1));
            });
    });
}

/**
 * @deprecated
 */
function checkFranchiseBalance(useWallet, transactionId, req, res, transType) {
    return new Promise((resolve, reject) => {
        var condition = {};
        condition.status = "Created";
        if (transType == "transId")
            condition.transactionId = transactionId;
        else
            condition._id = transactionId;
        var promises = [
            Mongoose.models["omsmps"].find(condition).exec(),
            crud.model.find(condition).exec()
        ];
        Promise.all(promises)
            .then(results => {
                var amount = 0;
                results.forEach(el => {
                    el.forEach(_el => {
                        _el.useWallet = true;
                        amount += _el.orderAmount;
                        _el.save();
                    });
                });
                return {
                    "amount": amount,
                    "results": results
                };
            }).then(details => {
                if (details.amount) {
                    if (useWallet) {
                        var results = details.results.find(el => el.length > 0);
                        return cuti.request.getElement("account", "franchiseBalance/" + results[0].franchise.id)
                            .then((franInfo) => {
                                franInfo = franInfo;
                                var flag = false;
                                if (franInfo.availableBalance < details.amount) {
                                    flag = true;
                                }
                                resolve(flag);
                            });
                    } else {
                        resolve(false);
                    }
                } else {
                    reject("Sorry! The Transaction is already Intitated or Not exists");
                    //res.status(400).json({ "message": "Sorry! The Transaction is already Intitated or Not exists" });
                }
            }).catch(err => {
                return err;
            });
    });
}

/**
 * Function to do auto cancellation of SK ORDERS
 * @param {*} req 
 * @param {*} res 
 */
function autoCancelOrders(req, res) {
    var date = new Date();
    var conditions = {
        "typeOfOrder": "SK",
        "status": "Created",
        "paymentStatus": "Unpaid",
        "cancellationDateAndTime": {
            $lte: new Date()
        }
    };

    crud.model.find(conditions).sort({
        "createdAt": 1
    }).exec().then((docs) => {
        if (docs && docs.length) {
            docs.reduce((prev, curr) =>
                prev.then(() => {
                    cancelUnPaidOrders(curr);
                    changingCouponStatusForCanceledOrder(curr);
                }), new Promise(resolve => resolve()))
                .then(() => res.status(200).json({
                    message: "Orders Cancelled Successfully"
                }));
        } else {
            logger.info("No orders found to auto cancel unpaid orders.");
            res.status(400).send({ "message": "No orders found to auto cancel unpaid orders." });
        }
    });
}

//Update Coupon Status For Cancelled Order 
function changingCouponStatusForCanceledOrder(data) {

    if (data) {
        let doc = {
            "orderId": data._id
        };
        if (data && data.coupon.couponCode) {
            doc.couponCode = data.coupon.couponCode;
        }
        cuti.request.getUrlandMagicKey("coupons")
            .then(options => {
                options.path += "/updateCouponStatusForCancelledOrders";
                options.method = "PUT";
                http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    response.on("end", () => {
                        logger.info(data);
                    });
                }).end(JSON.stringify(doc));
            });

    }

}

function cancelUnPaidOrders(doc) {
    return new Promise(resolve => {
        if (doc && doc.status == "Created") {
            doc.status = "Cancelled";
            var reservedSubOrders = [];
            doc.subOrders.map((el, index) => {
                el.status = "Cancelled";
                el.logs.push({
                    "status": "Order Cancelled",
                    createdAt: new Date(),
                    remarks: "Auto Cancelled"
                });
                var count = _.sumBy(el.snapshots, "quantity");
                if (count > 0) {
                    reservedSubOrders.push(el);
                }
            });
            if (reservedSubOrders && reservedSubOrders.length) {
                revertReservation(reservedSubOrders, doc.source, "Order Cancellation");
            }
            doc.save((err, document) => {
                if (document) {
                    events.postNotification(doc._id, "EVENTOMS10032");
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

function revertReservation(subOrderList, whId, referenceType) {
    logger.trace("[REVERT] :  Reverting reservation ..................");
    if (subOrderList && subOrderList.length && whId) {
        var stockPile = [];
        var idList = [];
        subOrderList.map(subOrder => {
            if (subOrder.snapshots && subOrder.snapshots.length) {
                _.each(subOrder.snapshots, snapShot => {
                    var pile = {
                        "snapShotId": snapShot.snapShotId,
                        "warehouseId": snapShot.whId ? snapShot.whId : whId,
                        "productId": snapShot.productId,
                        "reference": { "subOrderId": subOrder._id },
                        "requestQty": snapShot.quantity,
                        "referenceType": referenceType
                    };
                    idList.push(subOrder._id);
                    stockPile.push(pile);
                });
            }
        });

        stockPile = stockPile.filter(el => el.requestQty > 0 ? true : false);

        if (stockPile && stockPile.length) {

            var path = "/stockledger?filter=" + encodeURIComponent(JSON.stringify({ "reference.subOrderId": { "$in": idList }, "referenceType": { $in: [referenceType, "Order Cancellation", "Stock Unreservation"] } }));

            _fireHttpRequest("wh", path, "GET", null).then(ledgers => {
                if (!ledgers || !ledgers.length) {
                    var payload = {
                        "list": stockPile,
                        "webhook": {
                            "magicKey": "oms",
                            "path": "/webhook/onReservationChange"
                        }
                    };
                    _fireHttpRequest("wh", "/stockledger/bulkStockVariation", "PUT", payload).then((result) => {

                    }).catch(e => logger.error("AUTO CANCEL : cancel reservation  ", e.message));
                } else {
                    logger.trace("[REVERT] Orders reservation is already reverted....");
                }
            }).catch(e => logger.error("AUTO CANCEL : Ledger fetch call  ", e.message));
        }
    }
}


/**
 * Function to do auto cancellation of RESERVE ORDERS & WMF Orders- 30 th May 2018
 * Both RESERVE orders and WMF orders will be cancelled if stock not allocated after 2 days
 * @param {*} req 
 * @param {*} res 
 */
function autoCancelReserveOrders(req, res) {

    return orderHelper._prepareCanResOrderQuery()
        .then((query) => {
            _execeuteCanResOrderQuery(query)
                .then((docs) => {
                    if (docs.length) {
                        _processResOrdCancelling(docs)
                            .then(() => res.status(200).json({ message: "Orders Cancelled Successfully" }));
                    } else {
                        res.status(200).json({ message: "Orders Cancelled Successfully" });
                    }
                });

        });
}


function _processResOrdCancelling(docs) {
    return new Promise((_res, _rej) => {
        docs.reduce((prev, curr) =>
            prev.then(() => {
                _cancelResOrders(curr);
            }), new Promise(resolve => resolve())).then(() => _res());
    });
}

function _cancelResOrders(doc) {
    return new Promise((resolve, reject) => {
        if (doc && (doc.status == "Confirmed" || doc.status == "Processing" || doc.status == "Partially Shipped" || doc.status == "Partially Delivered" || doc.status == "Confirmed")) {
            var toCancelSuborders = [];
            var refundAmount = 0;
            doc.subOrders.forEach((el, index) => {
                if (el.status === "Confirmed") {
                    toCancelSuborders.push(el._id);
                    el.status = "Cancelled";
                    el.logs.push({
                        "status": "Order Cancelled",
                        createdAt: new Date(),
                        remarks: "Auto Cancelled"
                    });
                    refundAmount += (el.price * el.quantity) + el.shippingCharges;
                }

            });
            if (toCancelSuborders.length) {
                if (toCancelSuborders.length == doc.subOrders.length) {
                    refundAmount += doc.logistics;
                    doc.status = "Cancelled";
                    doc.autoCancel = true;
                }
                doc.paymentStatus = doc.status === "Cancelled" ? "Reverted" : doc.paymentStatus;
                doc.save((err, document) => {
                    if (document) {
                        var mobileNo;
                        if (doc.orderType == "Retail")
                            mobileNo = doc.customer.mobile;
                        else
                            mobileNo = doc.franchise.mobile;
                        revertOrderAmount(doc._id, toCancelSuborders, doc.franchise.id, refundAmount, doc.orderType, mobileNo)
                            .then(() => resolve())
                            .catch(err => reject(err));

                    } else {
                        resolve();
                    }
                });
            }
        } else {
            resolve();
        }
    });
}



/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @deprecated
 * THis function is called after a grn is done = Post GRN process;
    THis will find all open orders against those products;
 */
function HoldQuantities(req, res) { //req, res
    var body = crud.swagMapper(req);
    var data = body["data"];
    var snapShotQueue = async.queue(function (inv, callbackOrder) {
        inv.snapShotId = inv._id;
        async.waterfall([
            _getstockSnapshots(inv),//get snapshots by snapSHot Id;
            _getUnavailableOrdersByGrn,//finds all open orders;
            _getOrderInstances,//Again find orders with found order taking just order ids;
            _holdUnconfirmedOrders
        ], function (err, success) {
            if (err)
                callbackOrder("No Orders Found", "");
            else if (success)
                callbackOrder(null, success);
        });
    }, 1);
    snapShotQueue.drain = function () {
        res.status(200).json({
            "message": "Orders Processed"
        });
    };
    _.each(data, function (inv) {
        snapShotQueue.push(inv, function (err) {
            if (err) logger.error(err);
        });
    });
}

function HoldQuantitiesfromInvoice(snapShotId, OrderIds, callback) { //req, res
    var params = {};
    params.snapShotId = snapShotId;
    params.orderIds = OrderIds;
    async.waterfall([
        _getstockSnapshots(params),
        _checkOrderprefereneces,
        // _holdUnconfirmedOrders,
        //_getstockSnapshots(params),
        _getUnavailableOrders,
        _getOrderInstances,
        _holdUnconfirmedOrders
    ], function (err, success) {
        if (err)
            callback(err, "");
        else if (success)
            callback(null, success);
    });
}
/* Stage 1 */ //Stage 4.1;
//Here params = inv
function _getstockSnapshots(params, Orders) {
    return function (callback1) {
        var inputParams = "filter={\"_id\":\"" + params.snapShotId + "\"}";
        orderController._requestHttp("wh", "snapshot", "GET", inputParams, function (err, whdata) {
            if (whdata && whdata.length > 0) {
                if (whdata[0].quantity <= 0) {
                    var err = "Quntity is 0";
                    callback1(err, null);
                    return;
                } else {
                    if (params.productId == undefined)
                        params.productId = whdata[0].productId;
                    if (Orders)
                        params.Orders = Orders;
                    if (whdata)
                        params.whdata = whdata;
                    var ordList = [];
                    callback1(null, params);
                }
            } else {
                var err = "Invalid SnapShotId";
                callback1(err, null);
            }
        });
    };
}

function _checkOrderprefereneces(params, callback2) {
    var oids = [];
    if (params.orderIds != undefined && params.orderIds.length > 0) {
        params.orderIds.forEach(function (el, i) {
            oids.push(el);
        });
        crud.model.find({
            "_id": {
                "$in": oids
            }
        }).exec()
            .then((ordList) => {
                callback2(null, ordList, params);
            });
    } else {
        var ordList = [];
        callback2(null, ordList, params);
    }
}

function _getUnavailableOrders(ordList, params, callback3) {
    //var ordList=[];
    var productId = params["productId"];
    var aggregate = [{
        $match: {
            "subOrders.invoiced": false,
            "subOrders.status": {
                $in: ["Confirmed", "Processing"]
            },
            "subOrders._id": {
                $in: params.orderIds
            }
        }
    },
    {
        $unwind: "$subOrders"
    },
    {
        $match: {
            "subOrders.invoiced": false,
            "subOrders.status": {
                $in: ["Confirmed", "Processing"]
            },
            "subOrders._id": {
                $in: params.orderIds
            }
        }
    },
    {
        $project: {
            "subOrders._id": 1,
            "subOrders.blockedProducts.productId": 1,
            "subOrders.requestedProducts.productId": 1,
            "subOrders.blockedProducts.quantity": 1,
            "subOrders.snapshots": 1,
            "subOrders.requestedProducts.quantity": 1,
            "blockedProductsLength": {
                $size: "$subOrders.blockedProducts"
            },
            "requestedProductsLength": {
                $size: "$subOrders.requestedProducts"
            },
            "requestedProductsQty": {
                $sum: "$subOrders.requestedProducts.quantity"
            },
            "blockedProductsQty": {
                $sum: "$subOrders.blockedProducts.quantity"
            },
            "res": {
                "$cond": {
                    "if": {
                        "$ne": [{
                            $size: "$subOrders.blockedProducts"
                        }, {
                            $size: "$subOrders.requestedProducts"
                        }]
                    },
                    "then": true,
                    "else": {
                        "$cond": {
                            "if": {
                                "$eq": [{
                                    $sum: "$subOrders.requestedProducts.quantity"
                                }, {
                                    $sum: "$subOrders.blockedProducts.quantity"
                                }]
                            },
                            "then": false,
                            "else": true
                        }
                    }
                }
            }
        }
    },
    {
        $match: {
            "res": true
        }
    },
    {
        $match: {
            "subOrders.requestedProducts.productId": productId
        }
    }
    ];
    crud.model.aggregate(aggregate).sort({
        "createdAt": 1
    })
        .then(Orders => {
            if (Orders.length > 0)
                callback3(null, ordList, Orders, params);
            else {
                if (ordList.length > 0) {
                    callback3(null, ordList, Orders, params);
                } else {
                    var err = "No Orders Found";
                    callback3(err, "");
                }
            }
        }).catch(err => callback3(err, ""));
}
/* Stage 2; */
function _getUnavailableOrdersByGrn(params, callback3) {
    //callback3
    var ordList = [];
    //{
    var productId = params["productId"];
    var aggregate = [{
        $unwind: "$subOrders"
    },
    {
        $match: {
            "subOrders.invoiced": false,
            "subOrders.status": {
                $in: ["Confirmed", "Processing"]
            }
        }
    },
    {
        $project: {
            "subOrders._id": 1,
            "subOrders.blockedProducts.productId": 1,
            "subOrders.requestedProducts.productId": 1,
            "subOrders.blockedProducts.quantity": 1,
            "subOrders.snapshots": 1,
            "subOrders.requestedProducts.quantity": 1,
            "res": {
                "$cond": {
                    "if": {
                        "$gt": ["$subOrders.requestedProducts.quantity", "$subOrders.blockedProducts.quantity"]
                    },
                    "then": true,
                    "else": false
                }
            }
        }
    },
    {
        $match: {
            "res": true
        }
    },
    {
        $match: {
            "subOrders.requestedProducts.productId": productId
        }
    }
    ];
    crud.model.aggregate(aggregate).sort({
        "createdAt": 1
    })
        .then(Orders => {
            if (Orders.length > 0) {
                callback3(null, ordList, Orders, params);
            } else {
                if (ordList.length > 0) {
                    callback3(null, ordList, Orders, params);
                } else {
                    var err = "No Orders Found";
                    callback3(err, "");
                }
            }
        }).catch(err => callback3(err, ""));
    //}
}
/* Stage 3; */
function _getOrderInstances(preferenceOrders, Orders, params, callback4) {
    var oids = [];
    Orders.forEach(function (el, i) {
        oids.push(el._id);
    });
    if (oids.length > 0) {
        crud.model.find({
            "_id": {
                "$in": oids
            }
        }).sort({
            "CreatedAt": 1
        }).exec()
            .then((ordList) => {
                var OrdersArr = [];
                if (preferenceOrders.length > 0) {
                    preferenceOrders.forEach(o => {
                        OrdersArr.push(o);
                    });
                }
                ordList.forEach(o => {
                    OrdersArr.push(o);
                });
                return callback4(null, OrdersArr, params);
            });
    } else if (preferenceOrders.length > 0) {
        var OrdersArr = [];
        if (preferenceOrders.length > 0) {
            preferenceOrders.forEach(o => {
                OrdersArr.push(o);
            });
        }
        return callback4(null, OrdersArr, params);
    } else {
        return callback4("No Orders", "");
    }
}
/* Stage 4; */
function _holdUnconfirmedOrders(Orders, params, callback5) {
    if (Orders != undefined && Orders.length > 0) {
        var ordersQueue = async.queue(function (Order, callbackOrder) {
            async.waterfall([
                _getstockSnapshots(params, Order),
                allotStocktosubOrder,
                updateStockAllocationStatus
            ], function (err, success) {
                if (err) {
                    callbackOrder(err, "");
                } else {
                    callbackOrder(null, Order);
                }
            });
        }, 1);
        ordersQueue.drain = function () {
            callback5(null, params);
        };
        _.each(Orders, function (order) {
            ordersQueue.push(order, function (err) {
                if (err) logger.error(err);
            });
        });
    } else {
        callback(null, params);
    }
}
//Stage 4.2;
function allotStocktosubOrder(params, callback) {
    var HoldOrders = [];
    var Order = params.Orders;
    var whData = params.whdata;
    var subOrdersQueue = async.queue(function (subOrder, callbackOrder) {
        var blockedPrdObj = subOrder.blockedProducts.filter(bprd => bprd.productId == params.productId)[0];
        var requestedPrdObj = subOrder.requestedProducts.filter(rprd => rprd.productId == params.productId)[0];
        if (requestedPrdObj == undefined) {
            callbackOrder(null, subOrder);
        } else {
            if (blockedPrdObj == undefined || blockedPrdObj == "") {
                blockedPrdObj = {};
                blockedPrdObj.quantity = 0;
            }
            var requiredQtytoHold = requestedPrdObj.quantity - blockedPrdObj.quantity;
            if (requiredQtytoHold > 0) {
                if (whData[0].quantity <= requiredQtytoHold)
                    requiredQtytoHold = whData[0].quantity;
                var addSnapShotRequest = {
                    snapShotId: params.snapShotId,
                    quantity: requiredQtytoHold,
                    orderId: Order._id,
                    subOrerId: subOrder._id
                };
                _requestHttp("wh", "WMF0/inventory/addHoldStock", "PUT", addSnapShotRequest, function (err, requestHoldData) {
                    if (err) {
                        callbackOrder(err, "");
                    } else if (requestHoldData) {
                        var cont = 0;
                        subOrder.snapshots.push({
                            snapShotId: requestHoldData._id,
                            productId: requestHoldData.productId,
                            expiryDate: requestHoldData.expiryDate,
                            quantity: requiredQtytoHold,
                            mrp: requestHoldData.mrp,
                            ref: requestHoldData.ref,
                            location: requestHoldData.location,
                            area: requestHoldData.area,
                            rackId: requestHoldData.rackId,
                            binId: requestHoldData.binId,
                            type: "Reserved"
                        });
                        if (blockedPrdObj.productId != undefined) {
                            subOrder.blockedProducts.forEach((product) => {
                                if (product.productId == params.productId) {
                                    product.quantity = product.quantity + requiredQtytoHold;
                                    cont = 1;
                                }
                            });
                        } else {
                            subOrder.blockedProducts.push({
                                "productId": params.productId,
                                "quantity": requiredQtytoHold
                            });
                            cont = 1;
                        }
                        if (cont == 1) {
                            Order.save((error, success) => {
                                if (success) {
                                    callbackOrder(null, subOrder);
                                } else {
                                }
                            });
                        } else {
                            err = "Error...Something Went Wrong";
                            callbackOrder(err, "");
                        }
                    } else {
                    }
                });
            } else
                callbackOrder(null, subOrder);
        }
    }, 1);
    subOrdersQueue.drain = function () {
        callback(null, params);
    };
    _.each(Order.subOrders, function (subOrders) {
        subOrdersQueue.push(subOrders, function (err) {
            if (err) logger.error(err);
        });
    });
}

function updateCommissionReleased(req, res) {
    var body = crud.swagMapper(req);
    var data = body["data"];
    var status = data.commissionReleased;
    var mongoStatus = "";
    if (status == "Ready") {
        mongoStatus = "Pending";
    } else if (status == "InProcess") {
        mongoStatus = "Ready";
    } else if (status == "Released") {
        mongoStatus = "InProcess";
    } else if (status == "returnDebitInProcess") {
        mongoStatus = "Released";
    } else if (status == "returnDebited") {
        mongoStatus = "returnDebitInProcess";
    }
    var mongoQuery = {};
    var query = req.query.id;
    var invoice = req.query.invoiceNo;
    if (query) {
        mongoQuery = {
            "_id": query,
            "invoices": {
                $elemMatch: {
                    "invoiceNo": invoice,
                    "commissionReleased": mongoStatus
                }
            }
        };
    } else {
        mongoQuery = {
            "invoices": {
                $elemMatch: {
                    "invoiceNo": invoice,
                    "commissionReleased": mongoStatus
                }
            }
        };
    }
    crud.model.update(mongoQuery, {
        $set: {
            "invoices.$.commissionReleased": status
        }
    }).exec().
        then(d => {
            res.status(200).json(d);
        });
}
//===== credit Debit after return ====
function returnCreditDebit(req, res) {
    crud.model.find({
        "invoices": {
            $elemMatch: {
                "processRefund": true,
                "refundStatus": "Pending"
            }
        }
    }).exec().
        then(d => {
            if (d.length) {
                async.each(d, function (item, callback) {
                    async.each(item.invoices, function (elem, cb) {
                        if (elem.processRefund) {
                            if (elem.processRefund == true && elem.refundStatus == "Pending") {
                                var body = {
                                    "processRefund": true,
                                    "refundStatus": "InProcess"
                                };
                                _requestHttp("oms", "order/updateinvoiceData?invoiceNo=" + elem.invoiceNo, "PUT", body, function (error, response) {
                                    if (error) {
                                        cb();
                                    } else {
                                        var reqBody = {
                                            "from": item.source,
                                            "to": item.franchise.id,
                                            "amount": elem.amount,
                                            "comments": "Refund for SK Order ID " + item._id + ", Invoiice No " + elem.invoiceNo,
                                            "type": "Order Return Refund",
                                            "reference_no": elem.invoiceNo,
                                            "referenceId": elem.invoiceNo,
                                            "service": "RetailOrderManagementSystem",
                                            "payoutType": "Credit"
                                        };
                                        _requestHttp("account", "idBasedPayments", "PUT", reqBody, function (err, resp) {
                                            if (err)
                                                cb();
                                            else {
                                                // console.log("item---------------------------", JSON.stringify(item));
                                                var updateBody = {
                                                    "processRefund": true,
                                                    "refundStatus": "Released"
                                                };
                                                _requestHttp("oms", "order/updateinvoiceData?invoiceNo=" + elem.invoiceNo, "PUT", updateBody, function (error, response) {
                                                    if (error) {
                                                        cb();
                                                    } else {
                                                        // console.log("response",response);   
                                                        if (elem.commissionReleased == "Released") {
                                                            debitCommission(item, elem.invoiceNo, function (e, r) {
                                                                cb(null, resp);
                                                            });
                                                        } else {
                                                            cb(null, resp);
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }, function (error) {
                        callback();
                    });
                },
                    function (err) {
                        if (err)
                            logger.error(err);
                        else {
                            res.status(200).json({
                                "msg": "Processed All Data Return refund and Commission Debit"
                            });
                        }
                    });
            } else {
                res.status(200).json({
                    "msg": "No data found for processing Return Refund"
                });
            }
        });
}

function returnDebitCommission(req, res) {

    crud.model.find({
        "subOrders": {
            $elemMatch: {
                "status": "Returned"
            }
        },
        "invoices.commissionReleased": { $in: ["Released"] }
    }).exec().
        then(d => {
            if (d.length) {
                async.each(d, function (item, callback) {

                    async.each(item.invoices, function (elem, cb) {
                        if (elem.commissionReleased == "Released") {
                            debitCommission(item, elem.invoiceNo, function (e, r) {
                                cb();
                            });

                        } else {
                            cb();
                        }

                    }, function (err) {
                        if (err) {
                            logger.error(err);
                        } else {
                            callback();
                        }
                    });
                }, function (err) {
                    if (err) {
                        logger.error(err);
                    } else {
                        res.status(200).json({
                            "message": "Processed All Data Return Commission Debit"
                        });
                    }

                });

            } else {
                res.status(200).json({
                    "message": "No data found for Debiting Physical Commission "
                });
            }

        });

}

//Debit commission
function debitCommission(item, invoiceNo, cb) {
    var commission = 0;
    async.each(item.subOrders, function (subOrder, callback) {
        if (subOrder.invoiceNo == invoiceNo && subOrder.status == "Returned") {
            commission = commission + (subOrder.commission.amount * subOrder.quantity);
            callback();
        } else {
            callback();
        }
    }, function (err) {
        var body = {
            "from": item.franchise.id,
            "to": item.source,
            "amount": commission,
            "comments": "Commission Debit for SK Order ID " + item._id + ", MPS OID " + item.mpsOrderId,
            "type": "Debit Physical Commission",
            "reference_no": invoiceNo,
            "referenceId": invoiceNo,
            "service": "RetailOrderManagementSystem",
            "payoutType": "Debit"
        };
        var reqBody = {
            "commissionReleased": "returnDebitInProcess"
        };
        _requestHttp("oms", "order/updateCommissionStatus?id=" + item._id + "&invoiceNo=" + invoiceNo, "PUT", reqBody, function (err, response) {
            if (response) {
                _requestHttp("account", "idBasedPayments", "PUT", body, function (err, resp) {
                    if (err) {
                        cb(err, null);
                    } else {
                        var reqBody = {
                            "commissionReleased": "returnDebited"
                        };
                        _requestHttp("oms", "order/updateCommissionStatus?id=" + item._id + "&invoiceNo=" + invoiceNo, "PUT", reqBody, function (err, reply) {
                            if (reply) {
                                cb(null, reply);
                            }
                        });
                    }
                });
            } else {
                cb(err, null);
            }
        });
    });
}

function updateRTO(req, res) {
    var body = crud.swagMapper(req);
    var data = body["data"];
    var status = data.isRTO;
    var query = {};
    var setQuery;
    if (data.hasOwnProperty("isRTO")) {
        query["invoices.$.isRTO"] = status;
    }
    if (data.hasOwnProperty("processRefund")) {
        query["invoices.$.processRefund"] = data.processRefund;
        query["invoices.$.refundStatus"] = data.refundStatus;
    }
    if (data.hasOwnProperty("isCustomerReturn")) {
        query["invoices.$.isCustomerReturn"] = data.isCustomerReturn;
    }
    if (data.hasOwnProperty("shippedOn")) {
        query["invoices.$.shippedOn"] = data.shippedOn;
    }
    if (data.hasOwnProperty("deliveredOn")) {
        query["invoices.$.deliveredOn"] = data.deliveredOn;
    }
    if (data.hasOwnProperty("paymentSettled")) {
        query["invoices.$.paymentSettled"] = data.paymentSettled;
    }
    if (data.hasOwnProperty("paymentSettledOn")) {
        query["invoices.$.paymentSettledOn"] = data.paymentSettledOn;
    }
    if (data.hasOwnProperty("returnedOn")) {
        query["invoices.$.returnedOn"] = data.returnedOn;
    }
    var mongoQuery = {};
    var invoice = req.query.invoiceNo;
    mongoQuery = {
        "invoices": {
            $elemMatch: {
                "invoiceNo": invoice
            }
        }
    };
    setQuery = {
        $set: query
    };
    crud.model.update(mongoQuery, query).exec().
        then(d => {
            res.status(200).json(d);
        });
}

function updateSubOrders(req, res) {
    var body = crud.swagMapper(req);
    var data = body["data"];
    var invoice = req.query.invoiceNo;
    var findQuery = {
        "subOrders.invoiceNo": invoice
    };
    // db.Form.find(findQuery).forEach(
    //     function (Form) {
    //         Form.formData.forEach(
    //             function (formData) {
    //                 formData.status="Returned";
    //                 db.Form.save(Form).exec()
    //                  .then(d=>{
    //                      c
    //                  });
    //             });
    //         })
    var setQuery;
    var query = {};
    if (data.status) {
        query["subOrders.$*.status"] = data.status;
    }
    setQuery = {
        $set: query
    };
    crud.model.find(findQuery).exec().then(elem => { });
    // db.blog.update({_id: doc._id}, {$set: {'b': doc.b.map(function(x) { return x + 1; }) } } )
    var doc = crud.model.findOne(findQuery).exec().then(elem => {
        crud.model.update({
            "_id": elem._id
        }, {
                $set: {
                    "subOrders": elem.subOrders.map(function (el) {
                        if (el.invoiceNo == invoice) {
                            el.status = "Returned";
                            return el;
                        } else {
                            return el;
                        }
                    })
                }
            }).exec().
            then(d => {
                res.status(200).json(d);
            });
    });
}
//Stage 4.3;
function updateStockAllocationStatus(params, callback) {
    var Order = params.Orders;
    crud.model.findOne({
        _id: Order._id
    }).exec()
        .then((doc) => {
            if (doc) {
                if (doc.subOrders && doc.fulfilledBy == "MPS0" && (doc.stockAllocation == undefined || doc.stockAllocation != "Allocated")) {
                    var count = [];
                    count.requestedproductcount = 0;
                    count.holdproductcount = 0;
                    doc.subOrders.map((el) => {
                        if (el.status == "Confirmed" || el.status == "Processing") {
                            var reqPrdCount = 0;
                            var blockedPrdCount = 0;
                            if (el.requestedProducts && el.requestedProducts.length) {
                                el.requestedProducts.map(r => {
                                    count.requestedproductcount = parseInt(count.requestedproductcount) + parseInt(r.quantity);
                                    reqPrdCount = parseInt(reqPrdCount) + parseInt(r.quantity);
                                });
                            }
                            if (el.blockedProducts && el.blockedProducts.length) {
                                el.blockedProducts.map(b => {
                                    count.holdproductcount = parseInt(count.holdproductcount) + parseInt(b.quantity);
                                    blockedPrdCount = parseInt(blockedPrdCount) + parseInt(b.quantity);
                                });
                            }
                            if (reqPrdCount == blockedPrdCount) {
                                el.readyForBatching = true;
                                el.gotRequestedProducts = false;
                            }
                        }
                    });

                    if (count.holdproductcount == 0) {
                        doc.stockAllocation = "NotAllocated";
                        doc.gotRequestedProducts = false;
                    } else if (count.holdproductcount != count.requestedproductcount) {
                        doc.stockAllocation = "PartialAllocated";
                        doc.gotRequestedProducts = false;
                    } else if (count.holdproductcount == count.requestedproductcount) {
                        doc.stockAllocation = "Allocated";
                        doc.gotRequestedProducts = true;
                    }

                    if (doc.paymentStatus == "Paid")
                        doc.batchEnabled = true;

                    doc.save((err) => {
                        if (err) {
                            callback(err, "");
                        } else {
                            callback(null, params);
                        }
                    });
                } else
                    callback(null, params);
            }
        });
}

function getAmazonMISOrder(req, res) {
    if (req.user.userType != "Franchise")
        return res.status(400).send("Only Franchise can use this api");
    var franchiseId = req.user.refId;
    //franchiseId = "F100001";
    cuti.request.getElement("franchise", franchiseId, "sk_franchise_details.code")
        .then(function (data) {
            return data;
        }).then(franchiseData => {
            var params = crud.swagMapper(req);

            if (req.query.search_key) {
                var form = {
                    search_key: req.query.search_key,
                    start: params.start,
                    limit: params.limit,
                    partner_id: "MPS1",
                    franchise_id: franchiseData.sk_franchise_details.code
                }
            } else {
                var form = {
                    order_from: params.orderfrom ? params.orderfrom : "",
                    order_till: params.orderto ? params.orderto : "",
                    order_type: params.orderType ? params.orderType : "",
                    commission_status: params.commissionStatus ? params.commissionStatus : "",
                    order_summary: params.order_summary ? params.order_summary : "",
                    // search_key: params.searchkey,
                    start: params.start,
                    limit: params.limit,
                    partner_id: "MPS1",
                    franchise_id: franchiseData.sk_franchise_details.code
                };
            }

            var requestParams = {
                url: int_layer_url + "/get_amazon_direct_order_list",
                headers: {
                    "authkey": "093d0431d5781850d014c8492e875dd0"
                },
                form: form
            };
            request.post(requestParams, function (err, httpResponse, body) {
                if (err) {
                    res.send(err); //ErrorResponse
                } else {
                    res.send(body); //Response is sucessfull
                }
            });
        });
}

function claimAmazonOrderCommission(req, res) {
    if (req.user.userType != "Franchise")
        return res.status(400).send("Only Franchise can use this api");
    var franchiseId = req.user.refId;
    //franchiseId = "F100001";
    cuti.request.getElement("franchise", franchiseId, "sk_franchise_details.code")
        .then(function (data) {
            return data;
        }).then(franchiseData => {
            var params = crud.swagMapper(req);
            var options = {};
            var requestParams = {
                url: int_layer_url + "/update_amazon_direct_order_claim_status",
                headers: {
                    "authkey": "093d0431d5781850d014c8492e875dd0"
                },
                form: {
                    order_id: params.orderid,
                    track_id: params.trackid,
                    franchise_id: franchiseData.sk_franchise_details.code
                }
            };
            request.post(requestParams, function (err, httpResponse, body) {
                if (err) {
                    res.send(err); //ErrorResponse
                } else {
                    res.send(body); //Response is sucessfull
                }
            });
        });
}


function getAmazonMISOrder_old(req, res) {
    if (req.user.userType != "Franchise")
        return res.status(400).send("Only Franchise can use this api");
    var franchiseId = req.user.refId;
    //franchiseId = "F100001";
    cuti.request.getElement("franchise", franchiseId, "sk_franchise_details.code")
        .then(function (data) {
            return data;
        }).then(franchiseData => {
            var params = crud.swagMapper(req);
            var options = {};
            var requestParams = {
                url: int_layer_url + "/get_amazon_direct_order_list",
                headers: {
                    "authkey": "093d0431d5781850d014c8492e875dd0"
                },
                form: {

                    order_type: params.orderType ? params.orderType : "",
                    commission_status: params.commissionStatus ? parseInt(params.commissionStatus) : "",
                    order_summary: params.order_summary ? params.order_summary : "",
                    order_from: params.orderfrom,
                    order_till: params.orderto,
                    // search_key: params.searchkey,
                    start: params.start,
                    limit: params.limit,
                    partner_id: "MPS1",
                    franchise_id: franchiseData.sk_franchise_details.code
                }
            };
            request.post(requestParams, function (err, httpResponse, body) {
                if (err) {
                    res.send(err); //ErrorResponse
                } else {
                    res.send(body); //Response is sucessfull
                }
            });
        });
}

function claimAmazonOrderCommission_old(req, res) {
    if (req.user.userType != "Franchise")
        return res.status(400).send("Only Franchise can use this api");
    var franchiseId = req.user.refId;
    //franchiseId = "F100001";
    cuti.request.getElement("franchise", franchiseId, "sk_franchise_details.code")
        .then(function (data) {
            return data;
        }).then(franchiseData => {
            var params = crud.swagMapper(req);
            var options = {};
            var requestParams = {
                url: int_layer_url + "/update_amazon_direct_order_claim_status",
                headers: {
                    "authkey": "093d0431d5781850d014c8492e875dd0"
                },
                form: {
                    order_id: params.orderid,
                    track_id: params.trackid,
                    franchise_id: franchiseData.sk_franchise_details.code
                }
            };
            request.post(requestParams, function (err, httpResponse, body) {
                if (err) {
                    res.send(err); //ErrorResponse
                } else {
                    res.send(body); //Response is sucessfull
                }
            });
        });
}


/**
 * Function to auto confirm SK Orders if not paid within 10 minutes - 6th JUNE 2018
 * @param {*} req 
 * @param {*} res 
 */
function autoConfirmSkOrders(req, res) {
    var date = new Date();
    crud.model.find({
        "paymentStatus": "Unpaid",
        "status": "Created",
        //"typeOfOrder": {$in:["SK","WMFORDERS","RESERVEORDERS"]},
        "mpsOrderType": "SKOrder",
        "createdAt": {
            $lte: new Date(date.setMinutes(date.getMinutes() - 10))
        }
    }, {
            "franchise": 1,
            "_id": 1
        }).sort({
            "createdAt": 1
        }).exec().then(d => {

            if (d.length > 0) {
                var index = 0;
                async.whilst(function () {
                    return d[index];
                }, function (callback) {
                    var el = d[index];
                    var reqPayload = {
                        "billingAddress": {
                            "id": el.franchise.id,
                            "name": el.franchise.name,
                            "state": el.franchise.state,
                            "city": el.franchise.city,
                            "district": el.franchise.district,
                            "pincode": el.franchise.pincode,
                            "address": el.franchise.address
                        },
                        "paymentMode": "Cash",
                        "transactionId": el._id
                    };
                    _requestHttp("oms", "order/" + el._id + "/initiatePayment?useWallet=true&transType=orderId", "POST", reqPayload, function (err, response) {
                        if (response) {
                            index++;
                            callback();
                        } else {
                            index++;
                            callback();
                        }
                    });
                },
                    function (err) {
                        res.status(200).json({
                            "message": "Order are updated"
                        });
                    });
            } else {
                res.status(400).json({
                    "message": "No orders found for initiating payment."
                });
            }
        });
}


/*
    - This function is invoked from scheduler - cron job;
    - This makes reservation to confirmed orders and is related to old reservation flow;
    - Since old reservation flow is deprecated , this function is been commented out
    - This function is meddling with reservation and is making false unaccounted reservations;
 */
function updateConfirmedOrder(req, res) {
    res.sendStatus(200);
    /*   var condition = {
          "fulfilledBy": "MPS0",
          "subOrders.status": "Confirmed",
          "subOrders.readyForBatching": false
      };
      var projectedData = {
          "_id": 1
      };
      var sortingData = {
          "createdAt": 1
      };
      var idsOfUpdatedData = [];
      crud.model.find(condition, projectedData).sort(sortingData).exec().then(d => {
          if (d.length > 0) {
              var index = 0;
              async.whilst(function () {
                      return d[index];
                  }, function (callback) {
                      var el = d[index];
                      idsOfUpdatedData.push(el._id);
                      _requestHttp("oms", "order/HoldQuantitiesforBatch/" + el._id, "PUT", {}, function (err, response) {
                          if (response) {
                              index++;
                              callback();
                          } else {
                               index++;
                               callback(new Error());
                          }
                      });
                  },
                  function (err) {
                      res.status(200).json({
                          "message": "Order are updated",
                          "ids": idsOfUpdatedData
                      });
                  });
          } else {
              res.status(400).json({
                  "message": "No orders found for initiating payment."
              });
          }
      }); */
}

function _execeuteCanResOrderQuery(query) {
    return crud.model.aggregate(query)
        .then((docs) => {
            if (docs.length) {
                var groupedOrders = [];
                docs.map(el => groupedOrders.push(el._id));
                return crud.model.find({ "_id": { $in: groupedOrders } })
                    .then(finalDocs => {
                        if (finalDocs.length)
                            return finalDocs;
                        else
                            return [];
                    });
            }
            else
                return [];
        }).catch(err => { return err; });
}

/**
 * This function will create Order for Given Franchise 
 * @param {*} req 
 * @param {*} res 
 */
function bulkOrderCreationExplicitly(req, res) {
    /**
     * STEP : 1  Clear the Cart for the Given Franchise.
     * STEP : 2  Add Deals to the Cart 
     * STEP : 3  Checkout Cart
     * STEP : 4  Call Initiate Payment
     */
    //franchiseId,dealList;
    var data = req.swagger.params.data.value;
    var franchiseId = data.franchiseId;
    var orderCancelTime = data.cancelationTat;
    var dealList = data.deals;
    dealList = validateDealsPayload(dealList);
    async.waterfall([
        clearCart(franchiseId, dealList, orderCancelTime),
        addDealsToCart,
        getCartDetails,
        checkOutCart,
        findOrderDetails,
        IntiatePayment
    ], function (err, result) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(result);
        }

    });
}

function validateDealsPayload(dealList) {
    let indexes = [];
    dealList.map((deal, index) => {
        if (!deal.quantity) {
            indexes.push(index);
        }
    });
    _.pullAt(dealList, indexes);
    return dealList;
}

function clearCart(franchiseId, dealList, orderCancelTime) {
    return function (callback) {
        var path = `?filter=${encodeURIComponent(JSON.stringify({ "franchise": franchiseId, "userType": "Franchise" }))}`; //?filter={"franchise" : ${franchiseId},"userType" : "Franchise"}`
        _fireHttpRequest("user", path, "GET", null).then((userInfo) => {
            if (_.isEmpty(userInfo)) {
                callback(new Error("User Not Found"));
            } else {
                userInfo = userInfo[0];
                var req = {
                    "swagger": {
                        "params": {
                            "id": { "value": franchiseId },
                            "type": {
                                "value": "B2B"//for Time Bieng i will make this as B2B
                            },
                            "user": userInfo
                        }
                    },
                    "user": userInfo,
                    "query": {
                        "id": franchiseId,
                        "type": "B2B"//for Time Bieng i will make this as B2B
                    }
                };
                var res = {
                    "status": function (statusCode) {
                        return {
                            "statusCode": statusCode,
                            "send": function (msg) {
                                if (statusCode >= 200 && statusCode < 299) {
                                    logger.info("Cart Deleted", msg);
                                    callback(null, userInfo, franchiseId, dealList, orderCancelTime);
                                } else {
                                    callback(null, userInfo, franchiseId, dealList, orderCancelTime);
                                }

                            },
                            "json": function (msg) {
                                if (statusCode >= 200 && statusCode < 299) {
                                    logger.info("Cart Deleted", msg);
                                    callback(null, userInfo, franchiseId, dealList, orderCancelTime);
                                } else {
                                    callback(null, userInfo, franchiseId, dealList, orderCancelTime);
                                }
                            }
                        };
                    }
                };
                cartController.deleteCart(req, res);
            }

        }).catch(err => {
            callback(new Error(err));
        });

    };
}

function addDealsToCart(userInfo, franchiseId, dealList, orderCancelTime, callback) {
    /*{
        "_id": "D10021",
            "quantity": 2,
                "fulfilledBy": "MPS0"
    }*/
    var queue = async.queue(function (deal, cb) {
        var req = {
            "swagger": {
                "params": {
                    "id": { "value": franchiseId },
                    "type": {
                        "value": "B2B"//for Time Bieng i will make this as B2B
                    },
                    "user": userInfo,
                    "data": {
                        "value": {
                            "_id": deal._id,
                            "quantity": deal.quantity,
                            "fulfilledBy": "MPS0",
                            "isBulkOrder": true
                        }
                    }
                }
            },
            "user": userInfo,
            "query": {
                "id": franchiseId,
                "type": "B2B"//for Time Bieng i will make this as B2B
            },
            "body": {
                "_id": deal._id,
                "quantity": deal.quantity,
                "fulfilledBy": "MPS0",
                "isBulkOrder": true
            }
        };
        var res = {
            "status": function (statusCode) {
                return {
                    "statusCode": statusCode,
                    "send": function (msg) {
                        if (statusCode >= 200 && statusCode < 299) {
                            cb(null, msg);
                        } else {
                            cb(msg, null);
                        }
                    },
                    "json": function (msg) {
                        if (statusCode >= 200 && statusCode < 299) {
                            cb(null, msg);
                        } else {
                            cb(msg, null);
                        }
                    }
                };
            }
        };
        cartController.addDealToCart(req, res);
    }, 1);
    var cartData = [];
    queue.push(dealList, function (err, result) {
        if (err) {
            callback(err, null);
            logger.error("Order CONTROLLER:Bulk order processing : Error Occured while importing the Record", err);
        } else {
            cartData.push(result);
        }
    });
    queue.drain = function () {
        if (cartData[0])
            callback(null, userInfo, franchiseId, dealList, cartData[0], orderCancelTime);
        else
            callback(cartData[0], null);
    };
}

/**
 * This is Step is Import because in get cart method they will calculate all the amount again and finalise if u miss out this step 
 * then we will face orderamount calculation mismatch ,in APK order Placement method usually when clicks on the deal they call create 
 * cart API,when the moment user clicks on addTocart Button they call createCart Api gain but now as cart already been created they 
 * the logic flow changes ,but in bulk order creation when i call createCart Api this will be new Cart and so if u call this getCartDetails
 * it will update calculted order amount so i left out with no option ,i cannot change the flow so this is solution i have got,
 * In future Please change the addDealToCart method whatevr whether its an new cart or old cart always recalculate.
 * for time Bieng i am doing like this (i dont want to change addDealToCart so i am changing my implementation)
 * @param {*} userInfo 
 * @param {*} franchiseId 
 * @param {*} dealList 
 * @param {*} cartData 
 * @param {*} orderCancelTime 
 * @param {*} callback 
 */
function getCartDetails(userInfo, franchiseId, dealList, cartData, orderCancelTime, callback) {
    var req = {
        "swagger": {
            "params": {
                "id": { "value": franchiseId },
                "type": {
                    "value": "B2B"//for Time Bieng i will make this as B2B
                },
                "user": userInfo
            }
        },
        "user": userInfo,
        "query": {
            "id": franchiseId,
            "type": "B2B"//for Time Bieng i will make this as B2B
        }
    };
    var res = {
        "status": function (statusCode) {
            return {
                "statusCode": statusCode,
                "send": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        callback(null, userInfo, franchiseId, dealList, cartData, orderCancelTime);
                    } else {
                        callback(msg);
                    }
                },
                "json": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        callback(null, userInfo, franchiseId, dealList, cartData, orderCancelTime);
                    } else {
                        callback(msg);
                    }
                }
            };
        }
    };
    cartController.getCart(req, res);
}

function checkOutCart(userInfo, franchiseId, dealList, cartData, orderCancelTime, callback) {
    /*{
        "cartid": "5b920e66b614743048a7af31",
            "remarks": "Checkout for cart scope.cartId",
                "customer": "F100001"
    }*/

    var req = {
        "swagger": {
            "params": {
                "id": { "value": franchiseId },
                "type": {
                    "value": "B2B"//for Time Bieng i will make this as B2B
                },
                "user": userInfo,
                "data": {
                    "value": {
                        "cartid": cartData._id ? cartData._id : "",
                        "remarks": "Checkout for cart scope.cartId",
                        "customer": franchiseId,
                        "cancelationTat": orderCancelTime,
                        "isBulkOrder": true
                    }
                }
            }
        },
        "user": userInfo,
        "query": {
            "id": franchiseId,
            "type": "B2B"//for Time Bieng i will make this as B2B
        },
        "body": {
            "cartid": cartData._id,
            "remarks": "Checkout for cart scope.cartId",
            "customer": franchiseId,
            "cancelationTat": orderCancelTime,
            "isBulkOrder": true
        }
    };
    var orderDetails;
    var res = {
        "status": function (statusCode) {
            return {
                "statusCode": statusCode,
                "send": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        orderDetails = msg;
                        orderDetails = orderDetails.orders[0];
                        callback(null, orderDetails._id);
                    } else {
                        callback(msg);
                    }
                },
                "json": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        orderDetails = msg;
                        orderDetails = orderDetails.orders[0];
                        callback(null, orderDetails._id);
                    } else {
                        callback(msg);
                    }
                }
            };
        }
    };
    cartController.checkoutCart(req, res);
}

function findOrderDetails(orderId, callback) {
    crud.model.findOne({ "_id": orderId }, function (err, document) {
        if (err) {
            callback(err);
        } else if (_.isEmpty(document)) {
            callback(new Error("Order Not Found"));
        } else {
            callback(null, document);
        }
    });
}

function IntiatePayment(orderDetails, callback) {
    /*{
        "paymentMode": "Cash",
            "billingAddress": {
            "landmark": "doddahaladamara",
                "city": "Kengeri",
                    "district": "Bangalore",
                        "state": "Karnataka",
                            "pincode": "560074"
        },
        "transType": "transId"
    }*/
    var req = {
        "swagger": {
            "params": {
                "id": { "value": orderDetails._id },//Transaction Id
                "paymentMode": "Cash",
                "useWallet": { "value": true },
                "transType": { "value": "orderId" },
                "data": {
                    "value": {
                        "billingAddress": orderDetails.billingAddress,
                        "paymentMode": "Cash",
                        "transactionId": orderDetails._id
                    }
                }
            }
        },
        "query": {
            "id": orderDetails.paymentTransactionId,
            "type": "B2B",//for Time Bieng i will make this as B2B
            "useWallet": true
        },
        "body": {
            "billingAddress": orderDetails.billingAddress,
            "paymentMode": "Cash",
            "transactionId": orderDetails._id
        }
    };
    var res = {
        "status": function (statusCode) {
            return {
                "statusCode": statusCode,
                "send": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        msg._id = orderDetails._id;
                        return callback(null, msg);
                    } else {
                        msg._id = orderDetails._id;
                        return callback(msg);
                    }
                },
                "json": function (msg) {
                    if (statusCode >= 200 && statusCode < 299) {
                        msg._id = orderDetails._id;
                        return callback(null, msg);
                    } else {
                        msg._id = orderDetails._id;
                        return callback(msg);
                    }
                }
            };
        }
    };
    orderManagementCtrl.initiatePayment(req, res);
}



/**
 * @description Common Http request making function block;
 * @param {*String} _magickey //Redis-Key;
 * @param {*String} _path //API Path;
 * @param {*String} _method // Http method - POST , PUT , GET;
 * @param {*Object} _payload //Requset body;
 */
function _fireHttpRequest(_magickey, _path, _method, _payload, _headers) {
    return new Promise((resolve, reject) => {
        if (!_magickey) {
            reject(new Error("Magic Key cannot be empty for HTTP request."));
            return;
        }
        if (!_path) {
            reject(new Error("Path cannot be empty for HTTP request."));
            return;
        }
        if (!_method) {
            reject("Http Method cannot be empty for HTTP request.");
            return;
        }
        cuti.request.getUrlandMagicKey(_magickey)
            .then(options => {
                if (_path !== " ") {
                    options.path += _path;
                }
                options.method = _method;

                if (_headers) {
                    options.headers = Object.assign(options.headers, _headers);
                }

                var request = http.request(options, response => {
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    response.on("end", () => {
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
                if ((_method === "POST" || _method === "PUT") && !_.isEmpty(_payload))
                    request.end(JSON.stringify(_payload));
                else
                    request.end();

            }).catch(e => reject(e));
    });
}

function sendSMS(body) {
    cuti.request.getUrlandMagicKey("notification")
        .then(options => {
            options.method = "POST",
                options.path += "/message";
            http.request(options, response => {
                if (response.statusCode == 200) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => {

                    });
                }
            }).end(JSON.stringify(body));
        }).catch(e => logger.error(e));
}

/**
 * This function will get all the SoldQuantity and RequiredQty for the Given Product Ids
 */
function getBulkProductSalesQty(req, res) {
    var productIds = crud.swagMapper(req)["productIds"] || [];
    async.waterfall([
        getSoldQtyDetailsForProducts(productIds),
        getRequiredQuantitiesForProducts
    ], function (err, document) {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(200).send(document);
        }
    });
}

/**
 * This function Gives SoldQty[30Days],SoldQty[60Days],AvailableQty for the Given Products
 */
function getSoldQtyDetailsForProducts(productIds) {
    let query = queryHelper.getSoldQty(productIds);
    return function (callback) {
        crud.model.aggregate(query, function (err, documents) {
            if (err) {
                callback(err);
            } else if (_.isEmpty(documents)) {
                /*{
	                "productId" : "PR16702",
	                "SOLDQTY30DAYS" : 40,
	                "SOLDQTY60DAYS" : 40,
	                "AVAILABLEQTY" : 0
                }*/
                documents = [];
                productIds.map(productId => {
                    documents.push({
                        "productId": productId,
                        "SOLDQTY30DAYS": 0,
                        "SOLDQTY60DAYS": 0,
                        "AVAILABLEQTY": 0
                    });
                });
                callback(null, productIds, documents);
            } else {
                let docList = [];
                productIds.map(productId => {
                    let doc = _.find(documents, function (o) {
                        return productId == o.productId;
                    });
                    docList.push({
                        "productId": productId,
                        "SOLDQTY30DAYS": doc && doc.SOLDQTY30DAYS ? doc.SOLDQTY30DAYS : 0,
                        "SOLDQTY60DAYS": doc && doc.SOLDQTY60DAYS ? doc.SOLDQTY60DAYS : 0,
                        "AVAILABLEQTY": doc && doc.AVAILABLEQTY ? doc.AVAILABLEQTY : 0
                    });
                });
                callback(null, productIds, documents);
            }
        });
    };

}

/**
 * This function Gives Required Qty for the Given Products
 */
function getRequiredQuantitiesForProducts(productIds, documents, callback) {
    let query = queryHelper.getRequiredQty(productIds);
    crud.model.aggregate(query, function (err, documentList) {
        if (err) {
            callback(err);
        } else if (_.isEmpty(documentList)) {
            documents.map(list => {
                let doc = _.find(documentList, function (o) {
                    return o._id == list.productId;
                });
                list.REQUIREDQTY = doc && doc.REQUIREDQTY ? doc.REQUIREDQTY : 0;
            });
            callback(null, documents);
        } else {
            /*{
                "_id" : "PR13528",
                "REQUIREDQTY" : 0
            }*/
            documents.map(list => {
                let doc = _.find(documentList, function (o) {
                    return o._id == list.productId;
                });
                list.REQUIREDQTY = doc && doc.REQUIREDQTY ? doc.REQUIREDQTY : 0;
            });
            callback(null, documents);
        }
    });
}

//orderHelper.testFunction();
module.exports.orderShippedWithinTAT = orderShippedWithinTAT;
module.exports.requiredFunds = requiredFunds;
module.exports.retryPayment = retryPayment;
module.exports.poToOrder = poToOrder;
module.exports.getAmount = getAmount;
module.exports.updateState = updateState;
module.exports.init = init;
module.exports.createSKOrder = createSKOrder;
module.exports.index = index;
module.exports.show = crud.show;
module.exports.bulkGet = crud.bulkGet;
module.exports.count = countOrder;
module.exports.crud = crud;
module.exports.confirmOrder = confirmOrder;
module.exports.destroy = crud.markAsDeleted;
module.exports.pendingOrderProductQty = orderHelper.pendingOrderProductQty;
module.exports.initiatePayment = initiatePayment;
module.exports.getsellerOrderIndex = getsellerOrderIndex;
module.exports.duplicatedOrder = duplicatedOrder;
module.exports.getRecentOrders = getRecentOrders;
module.exports.updateStatus = updateStatus;
module.exports.updateOrderStatus = updateOrderStatus;
module.exports.serviceOrder = serviceOrder;
module.exports.revertOrder = revertOrder;
module.exports.updateHoldQuantities = updateHoldQuantities;
module.exports.allOrdersTotalAmount = allOrdersTotalAmount;
module.exports.skOrdersTotalAmount = skOrdersTotalAmount;
module.exports.orderValueByStatus = orderValueByStatus;
module.exports.skOrdersTotalAmountByStatus = skOrdersTotalAmountByStatus;
module.exports.sellerOrdersTotalAmount = sellerOrdersTotalAmount;
module.exports.sellerOrdersTotalAmountByStatus = sellerOrdersTotalAmountByStatus;
module.exports.allOrdersTotalCount = allOrdersTotalCount;
module.exports.changeOrderDestination = changeOrderDestination;
module.exports.cancelOrder = cancelOrder;
module.exports.cancelAllOrders = cancelAllOrders;
module.exports.addAWBSeller = addAWBSeller;
module.exports.invoiceSellerOrder = invoiceSellerOrder;
module.exports.put = crud.update;
module.exports.updateCommissionReleased = updateCommissionReleased;
module.exports.crudder = crud;
module.exports.pendingPayOrder = pendingPayOrderNotify;
module.exports.createSubordersForCheckout = createSubordersForCheckout;
module.exports.updateOrderBatchstatus = updateOrderBatchstatus;
module.exports.cancelSubOrder = cancelSubOrder;
module.exports.confirmOrderPayment = confirmOrderPayment;
module.exports.revertScannedPackage = revertScannedPackage;
module.exports.createTransaction = createTransaction;
module.exports.autoCancel = autoCancelOrders;
//module.exports.holdStockForConfirmedOrder = holdStockForConfirmedOrder;
module.exports.HoldQuantities = HoldQuantities;
module.exports._requestHttp = _requestHttp;
module.exports.HoldQuantitiesfromInvoice = HoldQuantitiesfromInvoice;
module.exports.updateRTO = updateRTO;
module.exports.updateSubOrders = updateSubOrders;
module.exports.returnCreditDebit = returnDebitCommission;
module.exports.getAmazonMISOrder = getAmazonMISOrder;
module.exports.claimAmazonOrderCommission = claimAmazonOrderCommission;
module.exports.autoConfirmSkOrders = autoConfirmSkOrders;
module.exports.releaseOrderStocks = releaseOrderStocks;
module.exports.cancelSuborders = cancelSuborders;
module.exports.releaseStocks = releaseStocks;
module.exports.updateConfirmedOrder = updateConfirmedOrder;
module.exports.autoCancelReserveOrders = autoCancelReserveOrders;
module.exports.bulkOrderCreationExplicitly = bulkOrderCreationExplicitly;
module.exports.getBulkProductSalesQty = getBulkProductSalesQty;
