/**
 * @author AmanKareem <aman.kareem@storeking.in>
 * @since March 20 2018;
 */
"use strict;"
var Mongoose = require("mongoose");
Mongoose.Promise = global.Promise;
var http = require("http");
var cuti = require("cuti");
var log4js = cuti.logger.getLogger;
var logger = log4js.getLogger("oms");
var async = require("async");
var _ = require("lodash");

const onOrderReservationChange_endPoint = "/webhook/onReservationChange";

/* Parent constructor pattern; */
function Order(skOrder, subOrders) {
    this._skOrder = skOrder;
    this._subOrders = subOrders;//For cancellation;
}

/* Helper constructor for abstraction; */
function Helper() {

}

Order.prototype = {
    hasStock: function () {
        return new Promise((resolve, reject) => {
            if (!this._skOrder) {
                reject(new Errro(`Order cannot be empty.`));
                return;
            }
            var helper = new Helper();
            var whId = this._skOrder.source;
            var orderMatrix = helper._prepareOrderMatrix(this._skOrder);//Prepare order matrix;
            var productIds = orderMatrix.products.map(el => el.productId);//Get product ids from matrix;
            var warehousePromise = helper._getWarehouse(whId, productIds);//Get Inventory Buckets
            var outOfStockProducts = [];
            /*var dealIds = this._skOrder.subOrders.map(subOrder => subOrder.id);
             var path = `?filter=${encodeURIComponent(JSON.stringify({ "_id": { "$in": dealIds } }))}`;
             //Get Deals
             helper._fireHTTP('deal', path, 'GET', null).then(dealList => {
                 if (dealList && dealList.length) {
                     var acceptanceCount = _.countBy(dealList, { "acceptOrder": true });
                     var whIdCount = _.countBy(dealList, { "whId": whId });
                     if (acceptanceCount.true === this._skOrder.subOrders.length && whIdCount.true === this._skOrder.subOrders.length) {
                         //check mrp wise stock distribution
                         resolve(true);
                     } else {
                         resolve(false);
                     }
                 } else {
                     reject(new Error(`Cannot verify stock availability , deals not found.`));
                 }
             }).catch(e => reject(e)); */
            warehousePromise.then(warehouse => {
                warehouse = warehouse[whId];
                if (!warehouse) {
                    reject(new Error(`Stock not found`));
                    return;
                }
                //Prepare inventory matrix;
                var inventoryMatrix = helper._prepareInventoryMatrix(warehouse);

                orderMatrix.products.map(productMatrix => {
                    // Get product inventory group;
                    var whProductMatrix = _.find(inventoryMatrix, { _id: productMatrix.productId });
                    //var whData = helper._pluckInventories(productMatrix.productId, );
                    if (whProductMatrix && whProductMatrix.masterKeeper.remainingQty > 0 && productMatrix.remainingQty > 0) {
                        top:
                        for (var i = 0; i < productMatrix.trace.length; i++) {
                            var trace = productMatrix.trace[i];
                            if (!trace || trace.keeper.remainingQty <= 0) {
                                continue top;
                            }
                            var snapShotList = helper._pluckInventories(productMatrix.productId, trace.mrp, trace.keeper.remainingQty, whProductMatrix);
                            if (!snapShotList || !snapShotList.length) {
                                continue top;
                            }
                            inner:
                            for (var j = 0; j < snapShotList.length; j++) {
                                var snapShot = snapShotList[j];
                                if (snapShot.keeper.remainingQty <= 0) {
                                    continue inner;
                                }
                                var count = helper._getCount(trace.keeper.remainingQty, snapShot.keeper.remainingQty);
                                helper._updateOrderKeepers(count, orderMatrix, productMatrix, trace, snapShot);
                                helper._updateInventoryKeepers(count, whProductMatrix, snapShot, trace, productMatrix);

                                if (trace.keeper.remainingQty <= 0 || productMatrix.remainingQty <= 0) {
                                    break inner;
                                }
                            }

                            if (whProductMatrix.masterKeeper.remainingQty <= 0 || productMatrix.remainingQty <= 0) {
                                break top;
                            }
                        }
                    } else if (!whProductMatrix && productMatrix.remainingQty > 0) {
                        // Indicates that this product is sourceable but out of stock;
                        outOfStockProducts.push(productMatrix);
                    }
                });//product matrix loop ends here;
                if (orderMatrix.totalRemainingQty === 0 && orderMatrix.totalRequiredQty === orderMatrix.totalUsedQty) {
                    resolve(true);
                } else {
                    resolve(false);
                }

            }).catch(e => reject(e));
        });
    },
    reserve: function () {
        return new Promise((resolve, reject) => {
            if (!this._skOrder) {
                reject(new Errro(`Order cannot be empty.`));
                return;
            }
            var helper = new Helper();
            var whId = this._skOrder.source;
            var orderMatrix = helper._prepareOrderMatrix(this._skOrder);//Prepare order matrix;
            var productIds = orderMatrix.products.map(el => el.productId);//Get product ids from matrix;
            var warehousePromise = helper._getWarehouse(whId, productIds);
            var outOfStockProducts = [];//out of stock products but are sourceable;
            warehousePromise.then(warehouse => {
                warehouse = warehouse[whId];
                if (!warehouse) {
                    reject(new Error(`Stock not found`));
                    return;
                }
                //Prepare inventory matrix;
                var inventoryMatrix = helper._prepareInventoryMatrix(warehouse);

                orderMatrix.products.map(productMatrix => {
                    // Get product inventory group;
                    var whProductMatrix = _.find(inventoryMatrix, { _id: productMatrix.productId });
                    //var whData = helper._pluckInventories(productMatrix.productId, );
                    if (whProductMatrix && whProductMatrix.masterKeeper.remainingQty > 0 && productMatrix.remainingQty > 0) {
                        top:
                        for (var i = 0; i < productMatrix.trace.length; i++) {
                            var trace = productMatrix.trace[i];
                            if (!trace || trace.keeper.remainingQty <= 0) {
                                continue top;
                            }
                            var snapShotList = helper._pluckInventories(productMatrix.productId, trace.mrp, trace.keeper.remainingQty, whProductMatrix);
                            if (!snapShotList || !snapShotList.length) {
                                continue top;
                            }
                            inner:
                            for (var j = 0; j < snapShotList.length; j++) {
                                var snapShot = snapShotList[j];
                                if (snapShot.keeper.remainingQty <= 0) {
                                    continue inner;
                                }
                                var count = helper._getCount(trace.keeper.remainingQty, snapShot.keeper.remainingQty);
                                helper._updateOrderKeepers(count, orderMatrix, productMatrix, trace, snapShot);
                                helper._updateInventoryKeepers(count, whProductMatrix, snapShot, trace, productMatrix);

                                if (trace.keeper.remainingQty <= 0 || productMatrix.remainingQty <= 0) {
                                    break inner;
                                }
                            }

                            if (whProductMatrix.masterKeeper.remainingQty <= 0 || productMatrix.remainingQty <= 0) {
                                break top;
                            }
                        }
                    } else if (!whProductMatrix && productMatrix.remainingQty > 0) {
                        // Indicates that this product is sourceable but out of stock;
                        outOfStockProducts.push(productMatrix);
                    }
                });//product matrix loop ends here;
                var pile = orderMatrix.stockMap;
                if (pile && pile.length) {
                    helper._reserve(pile).then(result => resolve(result)).catch(e => reject(e));
                } else {
                    resolve({ "outOfStockProducts": outOfStockProducts });
                }
            }).catch(e => reject(e));
        });
    },
    cancel: function (whId, query) {
        return new Promise((resolve, reject) => {
            if (!this._subOrders || !_.isArray(this._subOrders) || !this._subOrders.length) {
                reject(new Error(`Cannot cancel, suborder list is empty or not an array`));
            }
            var helper = new Helper();
            var stockPile = [];
            this._subOrders.map(subOrder => {
                if (subOrder.snapshots && subOrder.snapshots.length) {
                    _.each(subOrder.snapshots, snapShot => {
                        var pile = {
                            "snapShotId": snapShot.snapShotId,
                            "warehouseId": snapShot.whId ? snapShot.whId : whId,
                            "productId": snapShot.productId,
                            "reference": { "subOrderId": subOrder._id },
                            "requestQty": snapShot.quantity,
                            "referenceType": "Order Cancellation",
                        };
                        stockPile.push(pile);
                    })
                }
            });

            stockPile = stockPile.filter(el => el.requestQty > 0 ? true : false);

            if (!stockPile || !stockPile.length) {
                return reject(new Error(`Cancellation Error, cannot un-reserve snapshots`));
            }

            helper._cancel(stockPile, query).then(result => resolve(result)).catch(e => reject(e));
        });
    },
    /* 
        Type = Enums ["Inventory" , "Order"] ;
        THis function transfers a particular orders reserved stocks to one of the following:
            - Inventory - Give type(transfer type) = "Inventory";
            - Another order wrt to order id / or to mentioned subOrder ids = type = "Order";
        Parameters:
            1. fromOptions :- [Object] = {orderId : "" ,"order": "", subOrderIds : "" , subOrderList : []}
            2. toOptions :- [Object] {orderId : "" , subOrderIds : ""} ; If order/suborder is not given , then transfer to the oldest order;
            3. type :- ["Inventory" , "Order"] 
     */
    transfer: function (whId, fromOptions, toOptions, transferType) {
        return new Promise((resolve, reject) => {
            if (!fromOptions || _.isEmpty(fromOptions)) {
                reject(new Error("Cannot transfer stocks as source order details are emtpy."));
                return;
            }

            if (!fromOptions.orderId && !fromOptions.subOrderIds) {
                reject(new Error("Cannot transfer stocks , for source order atleast orderId / suborder ids are required"));
                return;
            }

            if (!transferType || _.isEmpty(transferType)) {
                reject(new Error("Cannot transfer stocks as transfer type is empty."));
                return;
            }

            var helper = new Helper();

            if (transferType === 'ToInventory') {
                /* 
                     - Here for the given order unresere the stocks and surrender it to the inventory;
                     - Upon surrendering to the inventory , inventory removes stock from hold and adds to the qty;
                     - Order flags - stockAllocation = NotAllocated , gotRequestedProducts = false , subOrder.readyForBatching = false , subOrder.snapShots = [] , subOrder.blockedProducts = []
                     - If order id is given , then unreserve the entire order, or if subOrder id's are given , in this case unreserve only the selected subOrders; 
                */
                //find source order;
                helper._findSourceOrder(fromOptions.orderId, fromOptions.subOrderIds)
                    .then(sourceOrders => {
                        var unreservingList = [];
                        _.each(sourceOrders, order => _.each(order.subOrders.snapshots, snapShot => {
                            unreservingList.push({
                                "snapShotId": snapShot.snapShotId,
                                "warehouseId": snapShot.whId,
                                "productId": snapShot.productId,
                                "requestQty": snapShot.quantity,
                                "reference": { "subOrderId": order.subOrders._id },
                                "referenceType": "Stock Unreservation"
                            });
                        }));

                        unreservingList = unreservingList.filter(el => el.requestQty > 0 ? true : false);

                        if (!unreservingList || !unreservingList.length) {
                            reject(new Error(`Error ! Cannot surrender order stocks to inventory.`));
                            return;
                        }
                        var productIds = unreservingList.map(el => el.productId);
                        productIds = _.uniq(productIds);
                        var onInventory_Transfer_webhook = `/webhook/onInventoryTransferWebhook?whId=${whId}&productIds=${productIds}`;
                        //fire stock variation;
                        helper._stockVariant(unreservingList, "oms", onInventory_Transfer_webhook).then(result => resolve(result)).catch(e => reject(e));
                    })
                    .catch(e => reject(e));
            } else if (transferType === 'ToOrder') {
                /* 
                    - If orderId is given then transfer all the reserved stocks to a selected order of interest;
                    - If subOrderIds are given then transfer only selected subOrders stocks to the selected order of interest;
                */
                if (!toOptions || _.isEmpty(toOptions)) {
                    reject(new Error("Cannot transfer stocks as recipient order details are empty."));
                    return;
                }
                if (!toOptions.orderId && !toOptions.subOrderIds) {
                    reject(new Error("Cannot transfer stocks , for target order atleast orderId / suborder ids are required"));
                    return;
                }
                //find source order;
                var sourceOrderPromise = helper._findSourceOrder(fromOptions.orderId, fromOptions.subOrderIds);
                //find recipient order;
                var recipientOrderPromise = helper._findRecipientOrder(whId, toOptions.orderId, toOptions.subOrderIds);

                Promise.all([sourceOrderPromise, recipientOrderPromise]).then(orders => {
                    var sourceOrders = orders[0];//This will be list , as subOrders are unwinded;
                    var recipientOrders = orders[1];//This will be a list as subOrders are unwinded;

                    if (!sourceOrders || !recipientOrders) {
                        reject(new Error("Source or recipient order is not found."));
                        return;
                    }

                    if (sourceOrders[0]._id === recipientOrders[0]._id) {
                        reject(new Error("Source and target order both cannot be the same"));
                        return;
                    }

                    var reservationList = [];//ToOrder should get all unreserved stocks from the from order;
                    var unReservingList = [];//FromOrder selected subOrder must unreserve its stocks;
                    var sourceOrderMatrix = helper._prepareTransferOrderMatrix(sourceOrders, 'unreserveQty', 'unreserve');//pass order , key , type;
                    var recipientOrderMatrix = helper._prepareTransferOrderMatrix(recipientOrders, 'reserveQty', 'reserve');

                    for (var i = 0; i < sourceOrderMatrix.length; i++) {
                        var sourceMatrix = sourceOrderMatrix[i];
                        if (sourceMatrix.keeper.unreserveQty > 0) {
                            //iterate recipientMatrix;
                            for (var j = 0; j < recipientOrderMatrix.length; j++) {
                                var recipientMatrix = recipientOrderMatrix[j];
                                if (recipientMatrix.productId === sourceMatrix.productId && recipientMatrix.keeper.reserveQty > 0) {
                                    //count is always <= blocked qty of the source order suborder;
                                    var count = helper._getCount(recipientMatrix.keeper.reserveQty, sourceMatrix.keeper.unreserveQty);
                                    //update sourceOrder;
                                    sourceMatrix.keeper.unreserveQty -= count;
                                    sourceMatrix.keeper.usedQty += count;
                                    //update recipientOrder;
                                    recipientMatrix.keeper.reserveQty -= count;
                                    recipientMatrix.keeper.usedQty += count;
                                    //get reserving and unreserving list;
                                    var exchangeList = helper._getTransferList(sourceOrders, sourceMatrix, recipientMatrix, count); //count = always <= blocked qty of source order
                                    if (!exchangeList) {
                                        reject(new Error("Error occured while order stock transfer"));
                                        return;
                                    }
                                    //add to unreserving list;Always against source order;
                                    unReservingList = unReservingList.concat(exchangeList.unreservingList);
                                    //add to reserving list - Always against recipient order;
                                    reservationList = reservationList.concat(exchangeList.reservingList);
                                }

                                if (sourceMatrix.keeper.unreserveQty === 0) {
                                    break;
                                }
                            }//Recipient loop ends here;
                        }
                    }
                    //filter out zero qty;
                    reservationList = reservationList.filter(el => el.requestQty > 0 ? true : false);
                    unReservingList = unReservingList.filter(el => el.requestQty > 0 ? true : false);

                    if (!reservationList || !reservationList.length) {
                        reject(new Error("Invalid , Cannot transfer stocks."));
                        return;
                    }

                    if (!unReservingList || !unReservingList.length) {
                        reject(new Error("Invalid , Cannot transfer stocks."));
                        return;
                    }

                    var errorList = [];
                    var ledgerResultList = [];
                    var queue = async.queue(function (ledgerList, queueCB) {
                        //fire here;
                        helper._stockVariant(ledgerList, "oms", onOrderReservationChange_endPoint).then(result => {
                            queueCB(null, result);
                        }).catch(e => reject(e));
                    });

                    queue.drain = function () {
                        resolve(ledgerResultList);
                    }
                    //First push unreserving list , then reserving list;
                    queue.push([unReservingList, reservationList], function (err, result) {
                        if (err) {
                            errorList.push(err);
                            reject(err);
                            return;
                        } else {
                            ledgerResultList.push(result)
                        }
                    });
                }).catch(e => reject(e));
            }
        });
    },
    /**
     * - This function unreserves stocks if any is allocated to the given order;
     * - If order doc is there then pass the order, else pass order Id and the function will query and find the order ;
     * - If subOrderIds are not passed , then it will unreserve all the suborders , else only selected subOrders will be unreserved;
     * - In options you can mention referenceType for ledger; if not passed by default Stock Unreservation is considered;
     */
    unReserve: function (order = null, orderId = null, subOrderIds = [], options) {
        return new Promise((resolve, reject) => {

            var helper = new Helper();

            var orderPromise = new Promise((resolve, reject) => {
                if (order) {
                    resolve(order);
                } else {
                    helper._findOrderById(orderId).then(ord => resolve(ord)).catch(e => reject(e));
                }
            });

            var stockPile = [];

            subOrderIds = _.uniq(subOrderIds);

            var referenceType = options && options.referenceType ? options.referenceType : 'Stock Unreservation';

            orderPromise.then(_order => {

                // check if suborders preference is given;
                if (subOrderIds && subOrderIds.length) {
                    _order.subOrders.map(sO => {
                        if (subOrderIds.indexOf(sO._id) > -1 && sO.snapshots && sO.snapshots.length) {
                            _.each(sO.snapshots, snapShot => {
                                var pile = {
                                    "snapShotId": snapShot.snapShotId,
                                    "warehouseId": snapShot.whId ? snapShot.whId : _order.whId,
                                    "productId": snapShot.productId,
                                    "reference": { "subOrderId": sO._id },
                                    "requestQty": snapShot.quantity,
                                    "referenceType": referenceType
                                };
                                stockPile.push(pile);
                            });
                        }
                    });
                } else {
                    // else unreserve all suborders if any stock is allocated;
                    _order.subOrders.map(sO => {
                        if (sO.snapshots && sO.snapshots.length) {
                            _.each(sO.snapshots, snapShot => {
                                var pile = {
                                    "snapShotId": snapShot.snapShotId,
                                    "warehouseId": snapShot.whId ? snapShot.whId : _order.whId,
                                    "productId": snapShot.productId,
                                    "reference": { "subOrderId": sO._id },
                                    "requestQty": snapShot.quantity,
                                    "referenceType": referenceType
                                };
                                stockPile.push(pile);
                            });
                        }
                    });
                }

                stockPile = stockPile.filter(el => el.requestQty > 0 ? true : false);

                if (stockPile && stockPile.length) {
                    helper._unReserve(stockPile).then().catch(e => reject(e));
                } else {
                    resolve({ 'message': `Skipping un-reserving stocks , as no snapshots with allocations were found for order ${_order._id}` });
                }

            }).catch(e => reject(e));

        });
    }
}

Helper.prototype = {
    /**
   * @description Common Http request making function block;
   * @param {*String} _magickey //Redis-Key;
   * @param {*String} _path //API Path;
   * @param {*String} _method // Http method - POST , PUT , GET;
   * @param {*Object} _payload //Requset body;
  */
    _fireHTTP: function (_magickey, _path, _method, _payload) {
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
    },
    _getCount: function (required, available) {
        return required <= available ? required : required > available ? available : 0;
    },
    _updateOrderKeepers: function (count, orderMatrix, productMatrix, trace, snapShot) {
        //update orderMatrix records;
        orderMatrix.totalRemainingQty -= count;
        orderMatrix.totalUsedQty += count;
        orderMatrix.stockMap.push({
            "snapShotId": snapShot._id,
            "warehouseId": snapShot.whId,
            "productId": productMatrix.productId,
            "reference": { "objectId": trace.productHash, "subOrderId": trace.sOId },
            "requestQty": count,
            "referenceType": "Order Reservation",
        });
        //update productMatrix record;
        productMatrix.remainingQty -= count;
        productMatrix.usedQty += count;
        //update trace keeper record;
        trace.keeper.remainingQty -= count;
        trace.keeper.usedQty += count;
        trace.stockPile.push({
            "snapShotId": snapShot._id,
            "productId": productMatrix.productId,
            "qty": count
        });
    },
    _updateInventoryKeepers: function (count, whData, snapShot, trace, productMatrix) {
        //update master keeper;
        whData.masterKeeper.remainingQty -= count;
        whData.masterKeeper.usedQty += count;
        //update snapshot keeper;
        snapShot.keeper.remainingQty -= count;
        snapShot.keeper.usedQty += count;
        snapShot.keeper.trace.push({ "productHash": trace.productHash, "productId": productMatrix.productId, "sOid": trace.sOId, "requestedQty": count });
    },
    _getProducts: function (productIdList) {
        return new Promise((resolve, reject) => {
            productIdList = _.uniq(productIdList);
            var path = "?filter=" + encodeURIComponent(JSON.stringify({ _id: { "$in": productIdList } }));
            path += `&count=${productIdList.length}`;
            path += "&select=" + ["_id", "is_sourcable", "allowReserveOrder"];
            this._fireHTTP('product', path, "GET", null)
                .then(products => resolve(products))
                .catch(e => reject(e));
        });
    },
    _getInventories: function (productIdList) {
        return new Promise((resolve, reject) => {
            productIdList = _.uniq(productIdList);
            var path = "/bulkGetProductSnapshots?productIds=" + productIdList;
            this._fireHTTP('wh', path, 'GET', null)
                .then(inventories => resolve(inventories))
                .catch(e => reject(e));
        });
    },
    _getWarehouse: function (whId, productIdList) {
        return new Promise((resolve, reject) => {
            if (!whId) {
                reject(new Error("Cannot get warehouse as WhId cannot be empty"));
                return;
            }
            if (!productIdList || !productIdList.length) {
                reject(new Error("Could not get warehouse as product Ids list is empty"));
                return;
            }
            var _payload = {};
            _payload.products = productIdList.map(productId => {
                return {
                    "whId": whId,
                    "productId": productId
                }
            });
            var _path = `/inventoryBuckets?bucketsOnly=false`;
            this._fireHTTP("wh", _path, "POST", _payload).then(warehouse => resolve(warehouse)).catch(e => reject(e));
        });
    },
    _pluckInventories: function (productId, mrp, quantity, whProductMatrix) {
        /*
            - whProductMatrix has all snapshots of a particular productId grouped;
            - All snapshots are policy wise sorted;
            - additionally it has buckets which are grouped by Mrp and offer text field;
         */
        /*
            - First get all buckets matching with the given MRP;
            - From each bucket obtained , grab the snapshot ids in that bucket and get those snapshots in the same sorted order;
            - concat such snapshots in the obtained order and serve back;
            - make sure each snapshot has qty atleast > 0;
         */
        mrp = parseInt(mrp);
        var snapShotList = [];
        var _buckets = whProductMatrix.buckets;
        var hasSnapshotFilled = false;
        // check with against Qty and loop it
        Object.keys(_buckets).map(key => {
            var _mrp = (key.split("_")[0]);
            _mrp = _.trim(_mrp)
            _mrp = parseInt(_mrp);
            var matchedBucket = _buckets[key];
            if (mrp === _mrp && matchedBucket.stock >= quantity) {
                hasSnapshotFilled = true;
                var snapShotIds = matchedBucket.snapShotIds;
                var list = whProductMatrix.snapShots.filter(snapShot => snapShotIds.indexOf(snapShot._id) > -1 ? true : false);
                snapShotList = snapShotList.concat(list);
            }
        });

        if (!hasSnapshotFilled) {
            // Loop it with available snapshots
            Object.keys(_buckets).map(key => {
                var _mrp = (key.split("_")[0]);
                _mrp = _.trim(_mrp)
                _mrp = parseInt(_mrp);
                var matchedBucket = _buckets[key];
                if (mrp === _mrp) {
                    var snapShotIds = matchedBucket.snapShotIds;
                    var list = whProductMatrix.snapShots.filter(snapShot => snapShotIds.indexOf(snapShot._id) > -1 ? true : false);
                    snapShotList = snapShotList.concat(list);
                }
            });
        }

        return snapShotList;
    },
    _prepareInventoryMatrix: function (groupedSnapshots) {
        //Set master keeper group wise;
        groupedSnapshots.map(group => {
            group.masterKeeper = {
                totalQty: group.totalQty,
                remainingQty: group.totalQty,
                usedQty: 0
            }
            //Set keepers for each snapshot in a group
            group.snapShots.map(snapShot => {
                snapShot.keeper = {
                    totalQty: snapShot.quantity,
                    remainingQty: snapShot.quantity,
                    usedQty: 0,
                    trace: []
                }
            });
        });
        return groupedSnapshots;
    },
    _prepareOrderMatrix: function (_skOrder) {
        //If mongo model type then convert to js object;
        if (_skOrder.constructor.name === 'model') {
            _skOrder = _skOrder.toObject();
        }

        var matrix = {
            "totalRequiredQty": 0,
            "totalRemainingQty": 0,
            "totalUsedQty": 0,
            "products": [],
            "stockMap": []
        }
        _.each(_skOrder.subOrders, subOrder => _.each(subOrder.products, product => {
            var _product = _.find(matrix.products, { productId: product.id });
            if (!_product) {
                var keeper = { "requiredQty": product.quantity, "remainingQty": product.quantity, "mrp": product.mrp, "usedQty": 0 };
                //If not there then create new and add to list;
                var entity = {//Product matrix single record schema;
                    "productId": product.id,
                    //"mrp": product.mrp, //cannot be here as for different suborders with same product mrp can be from a different snapshot bucket;
                    "requiredQty": product.quantity,
                    "remainingQty": product.quantity,
                    "usedQty": 0,
                    "trace": [{ "sOId": subOrder._id, "productHash": product._id, "quantity": product.quantity, "mrp": product.mrp, "keeper": keeper, "stockPile": [] }]
                };
                matrix.totalRequiredQty += product.quantity;
                matrix.totalRemainingQty = matrix.totalRequiredQty;
                matrix.products.push(entity);
            } else {
                //If already exists , then it may be from different suborder , then update it;
                var keeper = { "requiredQty": product.quantity, "remainingQty": product.quantity, "mrp": product.mrp, "usedQty": 0 };
                _product.requiredQty += product.quantity;
                _product.remainingQty = _product.requiredQty;
                _product.trace.push({ "sOId": subOrder._id, "productHash": product._id, "quantity": product.quantity, "mrp": product.mrp, "keeper": keeper, "stockPile": [] });
                matrix.totalRequiredQty += product.quantity;
                matrix.totalRemainingQty = matrix.totalRequiredQty;
            }
        }));
        return matrix;
    },
    _prepareTransferOrderMatrix: function (unwindedOrders, key, type) {
        var matrixList = [];//Unique by productId and subOrder id;
        _.each(unwindedOrders, order => _.each(order.subOrders.products, product => {
            var matrix = _.find(matrixList, { "productId": product.id, "subOrderId": order.subOrders._id });
            if (!matrix) {
                //insert new record;
                var blockedProduct = _.find(order.subOrders.blockedProducts, { "productId": product.id });
                var blockedQty = blockedProduct ? blockedProduct.quantity : 0;
                /*
                    - For source Order the blocked qty for that product becomes allot qty 
                    - For recipient order difference of required and blocked is the remaining qty;
                 */
                var newEntry = {
                    "_id": order._id,
                    "productId": product.id,
                    "subOrderId": order.subOrders._id,
                    "productHash": product._id,
                    "quantity": product.quantity,
                    "remainingQty": product.quantity - blockedQty,
                    "type": type,
                    "keeper": {
                        [key]: type === 'unreserve' ? blockedQty : product.quantity - blockedQty,
                        "usedQty": 0
                    }
                };
                matrixList.push(newEntry);
            } else {
                //update the existing record;
                matrix.quantity += product.quantity;
                matrix.remainingQty += product.quantity - blockedQty;
                matrix.keeper[key] += type === 'unreserve' ? blockedQty : product.quantity - blockedQty;
            }
        }));
        return matrixList;
    },
    _getTransferList: function (sourceOrders, sourceMatrix, recipientMatrix, requiredCount) {
        //"Stock Reservation", "Stock Unreservation"
        var reservingList = [];
        var unreservingList = [];
        var order = _.find(sourceOrders, order => order.subOrders._id === sourceMatrix.subOrderId);
        if (order) {
            for (var i = 0; i < order.subOrders.snapshots.length; i++) {
                var snapShot = order.subOrders.snapshots[i];
                if (snapShot.productId === sourceMatrix.productId && snapShot.quantity > 0) {
                    var count = this._getCount(requiredCount, snapShot.quantity);
                    snapShot.quantity -= count;
                    requiredCount -= count;
                    //add to unreserving list - from source order;
                    unreservingList.push({
                        "snapShotId": snapShot.snapShotId,
                        "warehouseId": snapShot.whId,
                        "productId": sourceMatrix.productId,
                        "requestQty": count,
                        "reference": { "subOrderId": sourceMatrix.subOrderId },
                        "referenceType": "Stock Unreservation"
                    });
                    //add to reserving list - To the target.recipient order;
                    reservingList.push({
                        "snapShotId": snapShot.snapShotId,
                        "warehouseId": snapShot.whId,
                        "productId": recipientMatrix.productId,
                        "requestQty": count,
                        "reference": { "subOrderId": recipientMatrix.subOrderId },
                        "referenceType": "Stock Reservation"
                    });
                }

                if (requiredCount === 0) {
                    break;
                }
            }
        } else {
            return;
        }
        return {
            "reservingList": reservingList,
            "unreservingList": unreservingList
        };
    },
    _findSourceOrder: function (orderId, subOrderIdList) {
        /*
            - Choose Source order such that:
                        1. order status = Processing/Confirmed , stockAllocation != NotAllocated , paymentStatus != Reverted;
                        2. Suborders such that : status = Confirmed , invoiced = false , process = false , snapshots !=[] 
            - Choose suborders such that which is not batched , not invoiced and has some snapshots;
        */
        return new Promise((resolve, reject) => {
            var _pipeLine = [];
            if (orderId) {
                _pipeLine = [
                    {
                        "$match": {
                            "_id": orderId,
                            "paymentStatus": { "$nin": ["Reverted"] },
                            "stockAllocation": { "$nin": ["NotAllocated"] },
                            "status": { "$in": ["Confirmed", "Processing", "Partially Shipped", "Partially Delivered"] },
                            "subOrders": {
                                "$elemMatch": {
                                    "invoiced": false,
                                    "processed": false,
                                    "status": "Confirmed",
                                    "snapshots": { "$ne": [] }
                                }
                            }
                        }
                    },
                    { "$unwind": "$subOrders" },
                    {
                        "$match": {
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.snapshots": { "$ne": [] }
                        }
                    },
                    {
                        "$addFields": {
                            "snapshots": {
                                "$filter": {
                                    "input": "$subOrders.snapshots",
                                    cond: {
                                        "$gt": ["$$this.quantity", 0]
                                    }
                                }
                            }
                        }
                    },
                    {
                        "$match": {
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.snapshots": { "$ne": [] },
                            "snapshots": { "$ne": [] }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "stockAllocation": 1,
                            "gotRequestedProducts": 1,
                            "status": 1,
                            "subOrders": 1,
                            "source": 1
                        }
                    }
                ]
            } else if (subOrderIdList && subOrderIdList.length) {
                _pipeLine = [
                    {
                        "$match": {
                            "paymentStatus": { "$nin": ["Reverted"] },
                            "stockAllocation": { "$nin": ["NotAllocated"] },
                            "status": { "$in": ["Confirmed", "Processing", "Partially Shipped", "Partially Delivered"] },
                            "subOrders": {
                                "$elemMatch": {
                                    "_id": { "$in": subOrderIdList },
                                    "invoiced": false,
                                    "processed": false,
                                    "status": "Confirmed",
                                    "snapshots": { "$ne": [] }
                                }
                            }
                        }
                    },
                    { "$unwind": "$subOrders" },
                    {
                        "$match": {
                            "subOrders._id": { "$in": subOrderIdList },
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.snapshots": { "$ne": [] }
                        }
                    },
                    {
                        "$addFields": {
                            "snapshots": {
                                "$filter": {
                                    "input": "$subOrders.snapshots",
                                    cond: {
                                        "$gt": ["$$this.quantity", 0]
                                    }
                                }
                            }
                        }
                    },
                    {
                        "$match": {
                            "subOrders._id": { "$in": subOrderIdList },
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.snapshots": { "$ne": [] },
                            "snapshots": { "$ne": [] }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "stockAllocation": 1,
                            "gotRequestedProducts": 1,
                            "status": 1,
                            "subOrders": 1,
                            "source": 1
                        }
                    }
                ];
            }
            //Find here;
            Mongoose.models['omsMaster'].aggregate(_pipeLine).exec().then(orders => {
                if (orders && orders.length)
                    resolve(orders);
                else
                    reject(new Error("Invalid source order, cannot transfer stocks"));
            }).catch(e => reject(e));
        });
    },
    _findRecipientOrder: function (whId, orderId, subOrderIdList) {
        /* 
            - Choose recipient order such that:
                    1. order status = Processing/Confirmed , stockAllocation != Allocated , paymentStatus != Reverted
                    2. Suborders such that; status = Confirmed , invoiced = false, processed = false , readyForBatching  = false
            - Choose subOrder such that its not batched , not invoiced and ready for batching is false i,e has not got required stocks;
         */
        return new Promise((resolve, reject) => {
            var _pipeline = [];
            if (orderId) {
                _pipeline = [
                    {
                        "$match": {
                            "_id": { "$in": [orderId] },
                            "paymentStatus": { "$nin": ["Reverted"] },
                            "stockAllocation": { "$nin": ["Allocated"] },
                            "status": { "$in": ["Confirmed", "Processing", "Partially Shipped", "Partially Delivered"] },
                            "source": whId,
                            "subOrders": {
                                "$elemMatch": {
                                    "invoiced": false,
                                    "processed": false,
                                    "status": "Confirmed",
                                    "readyForBatching": false
                                }
                            }
                        }
                    },
                    { "$unwind": "$subOrders" },
                    {
                        "$match": {
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.readyForBatching": false
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "stockAllocation": 1,
                            "gotRequestedProducts": 1,
                            "status": 1,
                            "subOrders": 1
                        }
                    }
                ]
            } else {
                _pipeline = [
                    {
                        "$match": {
                            "paymentStatus": { "$nin": ["Reverted"] },
                            "stockAllocation": { "$nin": ["Allocated"] },
                            "status": { "$in": ["Confirmed", "Processing", "Partially Shipped", "Partially Delivered"] },
                            "source": whId,
                            "subOrders": {
                                "$elemMatch": {
                                    "_id": { "$in": subOrderIdList },
                                    "invoiced": false,
                                    "processed": false,
                                    "status": "Confirmed",
                                    "readyForBatching": false
                                }
                            }
                        }
                    },
                    { "$unwind": "$subOrders" },
                    {
                        "$match": {
                            "subOrders._id": { "$in": subOrderIdList },
                            "subOrders.invoiced": false,
                            "subOrders.processed": false,
                            "subOrders.status": "Confirmed",
                            "subOrders.readyForBatching": false
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "stockAllocation": 1,
                            "gotRequestedProducts": 1,
                            "status": 1,
                            "subOrders": 1
                        }
                    }
                ]
            }
            //Find here;
            Mongoose.models['omsMaster'].aggregate(_pipeline).exec().then(orders => {
                if (orders && orders.length)
                    resolve(orders);
                else
                    reject(new Error("Recipient order Invalid / Not found, cannot transfer stocks"));
            }).catch(e => reject(e));
        });
    },
    _findOrderById: function (orderId) {
        return new Promise((resolve, reject) => {

            if (!orderId || _.isEmpty(orderId)) {
                reject(new Error(`Order Id cannot be empty to find the order...`));
                return;
            }

            Mongoose.models['omsMaster'].findOne({ _id: orderId }).lean().exec().then(order => {
                if (order)
                    resolve(order);
                else
                    reject(new Error(`No Order Found with order Id ${orderId}`));
            }).catch(e => reject(e));

        });
    },
    _stockVariant: function (ledgerList, magicKey, webHook) {
        return new Promise((resolve, reject) => {
            if (!ledgerList || !ledgerList.length) {
                reject(new Error(`Cannot request stock variation, ledger list is empty`));
                return;
            }
            var payload = {
                "list": ledgerList,
                "webhook": {
                    "magicKey": magicKey ? magicKey : "",
                    "path": webHook ? webHook : ""
                }
            };
            this._fireHTTP("wh", '/stockledger/bulkStockVariation', 'PUT', payload).then(result => resolve(result)).catch(e => reject(e));
        });
    },
    _reserve: function (ledgerList) {
        return new Promise((resolve, reject) => {
            if (!ledgerList || !ledgerList.length) {
                reject(new Error(`Cannot reserve as ledger list cannot be empty`));
                return;
            }
            var payload = {
                "list": ledgerList,
                "webhook": {
                    "magicKey": "oms",
                    "path": "/webhook/updateOrders"
                }
            };
            var path = "/stockledger/bulkStockVariation";//stock ledger api endpoint;
            this._fireHTTP("wh", path, "PUT", payload)
                .then(result => {
                    resolve(result);
                }).catch(e => reject(e));
        });
    },
    _unReserve: function (ledgerList) {
        return new Promise((resolve, reject) => {

            if (!ledgerList || !ledgerList.length) {
                reject(new Error(`Cannot un-reserve, as ledger list cannot be empty`));
                return;
            }

            var payload = {
                "list": ledgerList,
                "webhook": {
                    "magicKey": "oms",
                    "path": "/webhook/onReservationChange"
                }
            };
            this._fireHTTP("wh", "/stockledger/bulkStockVariation", "PUT", payload).then((result) => resolve(result)).catch(e => reject(e));

        });
    },
    _cancel: function (ledgerList, query) {
        return new Promise((resolve, reject) => {
            if (!ledgerList || !_.isArray(ledgerList) || !ledgerList.length) {
                reject(new Error(`Cannot cancel, ledger list is empty or not an array.`));
                return;
            }
            var payload = {
                "list": ledgerList,
                "webhook": {
                    "magicKey": "oms",
                    "path": `/webhook/onCancellationWebhook?params=${encodeURIComponent(JSON.stringify(query))}`
                }
            };
            var endPoint = "/stockledger/bulkStockVariation";//stock ledger api endpoint;
            this._fireHTTP("wh", endPoint, "PUT", payload)
                .then(result => {
                    resolve(result);
                }).catch(e => reject(e));
        });
    }
}

module.exports = Order



var orderUtil = new Order();
orderUtil.unReserve(docs[0]).then(result => res.status(200).send(result)).catch(e => res.status(400).send({ message: e.message }));
/*  docs.reduce((prev, curr) =>
     prev.then(() => {
         cancelUnPaidOrders(curr,req);
     }), new Promise(resolve => resolve()))
     .then(() => res.status(200).json({
         message: "Orders Cancelled Successfully"
     })); */