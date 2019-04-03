
/*
STEP 1: Check scanned qty vs order-suborder-product qty;

*/

/*
STEP2: Validate qty wrt to inventory;

*/

/*
STEP2: Validate Serial No's
    - validate scanned Nos against qty;
    - Then make sure unique and again matching to scanned QTy;
    - They should exist in SerialNo array of snapshot and shouold not exist in used temp variable

*/


function _inputsQuantityCheck(payload) {
    return function (callback) {
        var errHandling = [];
        var ordersQueue = async.queue(function (subOrder, callbacksubOrder) {
            async.each(subOrder.scan, function (scanList, callbackscanList) {
                var invs = [];
                //Hey Dont Get Confuse .... As per Discussion we won't get multiple inventoryIds
                scanList.inventoryids.forEach(i => invs.push(JSON.stringify(i)));
                var input = "filter={\"_id\":{\"$in\":[" + invs + "]}}&select=_id,quantity,onHold,serialNo";
                orderController._requestHttp("wh", "snapshot", "GET", input, function (err, whData) {
                    if (err) {
                        errHandling.push({
                            "Error": err
                        });
                        callbackscanList(errHandling, scanList);
                    } else {
                        var whqty = 0; // Qty + onHold of a snapshot;
                        var AvailbleSerialNosInventory = [];// All available serialNo's from that snapshot
                        whData.forEach(w => {
                            whqty = whqty + (w.quantity + w.onHold);
                            w.serialNo.forEach(s => AvailbleSerialNosInventory.push(s));
                        });
                        if (whqty < scanList.quantity) {
                            errHandling.push({
                                "Error": "Stock not Available to process order - " + subOrder._id
                            });
                            callbackscanList(null, scanList);
                        } else {
                            if (scanList.serialNo != undefined && scanList.serialNo.length > 0) {
                                if (scanList.serialNo.length != scanList.quantity) {
                                    errHandling.push({
                                        "Error": "serialNumber/Quantity Mismatch - " + subOrder._id
                                    });
                                    callbackscanList(null, scanList);
                                } else {
                                    if (scanList.serialNo && scanList.serialNo.length > 0) {
                                        scanList.serialNo.forEach(sno => {
                                            if (!_.includes(AvailbleSerialNosInventory, sno))
                                                errHandling.push({
                                                    "Error": " Invalid serialNumber - " + sno
                                                });
                                        });

                                        callbackscanList(null, scanList);
                                    } else
                                        callbackscanList(null, scanList);
                                }

                            } else
                                callbackscanList(null, scanList);
                        }

                    }
                });
            }, function (err, success) {
                callbacksubOrder(null, subOrder);
            });
        }, 1);

        ordersQueue.drain = function () {
            if (errHandling.length > 0) {
                callback(errHandling, payload);
            } else {
                callback(null, payload);
            }
        };

        _.each(payload.subOrderList, function (suborder) {
            ordersQueue.push(suborder, function (err, resp) {
                if (err) console.log(err.message);
            });
        });
    };
};

function _orderProductInputQuantityCheck(params, payload, callback) {
    var errHandling = [];
    var ordersQueue = async.queue(function (subOrder, callbacksubOrder) {
        orderController.crud.model.findOne({
            "subOrders._id": subOrder._id
        }).exec()
            .then((ordDoc) => {
                payload.subOrderList.forEach(o => {
                    ordDoc.subOrders.forEach(so => {
                        if (so._id == o._id) {
                            so.products.forEach(bprd => {
                                var scannedPrdCount = 0;
                                o.scan.forEach(oprd => {
                                    // bprd = from subOrders
                                    // oprd = from scanned payload
                                    if (bprd.id == oprd.productId) {
                                        scannedPrdCount = scannedPrdCount + oprd.quantity;
                                        if (bprd.collectSerialNumber == true) {
                                            if (oprd.serialNo == undefined)
                                                errHandling.push({
                                                    "ERROR": subOrder._id + " Serial Number Manadatory"
                                                });
                                        }
                                    }
                                });

                                if (bprd.quantity != scannedPrdCount)
                                    errHandling.push({
                                        "ERROR": subOrder._id + " Not enough quantities of product have been scanned"
                                    });

                            });
                        }
                    });
                });

                callbacksubOrder(null, subOrder);
            });
    }, 1);

    ordersQueue.drain = function () {
        if (errHandling.length > 0) {
            callback(errHandling, payload);
        } else {
            callback(null, payload);
        }
    };

    _.each(payload.subOrderList, function (suborder) {
        ordersQueue.push(suborder, function (err) {
            if (err) console.log(err);
        });
    });
}


    