/*  
    @author Aman Kareem;
    - Pre-Prod Corrupt data clean up script;
    - This also generates CSV ;
    - Requires npm packages;
 */
var async = require("async");
var _ = require("lodash");
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();

/* -------------------------DB CONNECTION------------------------------- */
var url = "mongodb://localhost/QA_Bug";
var folder = "output";
var db = mongoShell(url);
/*---------------------------------------------------------------------- */

/* 
    - Order status sync with subOrder status;
    - Use API to cancel all open batches i,e (Pending Performa's);
    - Update performa and batch status with orders when orders are already invoiced/shipped; Here pending performa should be set to Completed when suborders are invoiced or cancelled when no link orders are found;
    - Unreserve all open orders , i,e subOrders which are invoiced false - consider processed true but invoiced false;
    - Reset warehouses to qty = 0 and onHold = 0 and CSV collect serial No's;
*/

function run() {
    console.log("Running script.......");
    async.waterfall([
        _orderStatusSync(),
        _orderWithInvalidState,
        _batchSync,
        _batchCancel,
    ], function (err, result) {
        if (err) {
            console.log("ERROR OCCURED: ", err.message);
            process.exit();
        }
        else {
            console.log("SUCCESS: Script ran successfully");
            console.log("PRINTING SUMMARY : **********************************************************************************************");
            process.exit();
        }
    });
}

//Invoke script;
run();

/*------------ NECESSARY FUNCTIONS------------- */

/*
    - This will sync all order's status with subOrders ; 
    - If order.status = "Confirmed" , but suborders.processed = true ; then set order.status = "Processing";
    - If stockAllocation = "Pending" , then stockAllocation = "NotAllocated";
 */
function _orderStatusSync() {
    console.log("Syncing all order status.........");
    return function (callback) {
        var payload = [];
        var inculsion = ["Createdd", "New", "Created"];//order status

        const fileName = "order_status_cleanup.csv";
        //Find orders with status = confirmed and atleast one suborder with process true;
        var cursor = db.collection('omsmasters').find({ "subOrders.processed": true, status: { "$in": ["Confirmed", "Createdd", "New", "Created"] } });

        //QUEUE:
        var queue = async.queue(function (order, queueCB) {
            if (order) {
                console.log("ORDER : ", order._id);
                var _status = order.status;
                var _allocation = order.stockAllocation;
                //Order status;
                if (inculsion.indexOf(order.status) > -1) { //Takes care of order status with createdd , New
                    _status = order.paymentStatus === "Paid" ? "Confirmed" : "Created";
                } else {
                    _status = "Processing";
                }

                //Stock Allocation;
                if (order.stockAllocation === "Pending") {
                    _allocation = "NotAllocated";
                }
                //Update;
                db.collection('omsmasters').update({ _id: order._id }, { "$set": { "status": _status, "stockAllocation": _allocation } }, { new: true }, function (err, doc) {
                    if (doc) {
                        var data = {
                            "orderId": order._id,
                            "previous_status": order.status,
                            "changed_status": doc.status,
                            "previous_stockAllocation_status": order.stockAllocation,
                            "changed_stockAllocation_status": doc.stockAllocation,
                            "remarks": "Success"
                        };
                        payload.push(data);
                        queueCB(null);
                    } else {
                        var data = {
                            "orderId": order._id,
                            "previous_status": order.status,
                            "previous_stockAllocation_status": order.stockAllocation,
                            "remarks": "Failed",
                            "log": err.message
                        };
                        payload.push(data);
                        queueCB(null);
                    }
                });
            }
        });

        queue.drain = function () {
            console.log("Generation CSV with filename : ", fileName);
            generateFile(payload, fileName);
            callback(null);
        }

        //ITERATOR;
        cursor.forEach(function (err, order) {
            if (order) {
                queue.push(order, function (err, result) {
                    if (err)
                        console.log("ERROR OCCURED: ", err.message);
                });
            } else {
                console.log("SKIP: No orders found , skipping......");
                callback(null);
            }
        });
    }
}

/*
    - This sets order status with createdd , New status 
 */
function _orderWithInvalidState(callback) {
    var payload = [];

    const fileName = "order_with_invalidStatus_cleanup.csv";
    //Find orders with status = confirmed and atleast one suborder with process true;
    var cursor = db.collection('omsmasters').find({ status: { "$in": ["Createdd", "New"] } });

    var queue = async.queue(function (order, queueCB) {
        if (order) {
            var _status = order.status;
            _status = order.paymentStatus === "Paid" ? "Confirmed" : "Created";
            db.collection('omsmasters').update({ _id: order._id }, { "$set": { "status": _status } }, { new: true }, function (err, doc) {
                if (doc) {
                    var data = {
                        "orderId": order._id,
                        "previous_status": order.status,
                        "changed_status": doc.status,
                        "remarks": "Success"
                    };
                    payload.push(data);
                    queueCB(null);
                } else {
                    var data = {
                        "orderId": order._id,
                        "previous_status": order.status,
                        "remarks": "Failed",
                        "log": err.message
                    };
                    payload.push(data);
                    queueCB(null);
                }
            });
        }
    });

    queue.drain = function () {
        console.log("Generation CSV with filename : ", fileName);
        generateFile(payload, fileName);
        callback(null);
    }

    //ITERATOR;
    cursor.forEach(function (err, order) {
        if (order) {
            queue.push(order, function (err, result) {
                if (err)
                    console.log("ERROR OCCURED: ", err.message);
            });
        } else {
            console.log("SKIP: No orders found , skipping......");
            callback(null);
        }
    });
}

function _batchSync(callback) {
    console.log("Syncing Batches with orders.......");
    var payload = [];
    const fileName = "batch_sync_cleanup.csv";

    var query = [{
        "$match": {
            "performa": {
                "$elemMatch": {
                    "status": "Pending"
                }
            }
        }
    },
    { "$unwind": "$performa" },
    {
        "$match": {
            "performa.status": "Pending"
        }
    },
    {
        "$project": {
            "_id": 1,
            "status": 1,
            "invoiced": 1,
            "performa.performaId": 1,
            "performa.orderId": 1,
            "performa.status": 1,
            "performa.subOrderId": 1
        }
    }
    ];

    var cursor = db.collection('omsbatches').aggregate(query);

    var queue = async.queue(function (batch, queueCB) {
        if (batch) {
            db.collection('omsmasters').findOne({ "subOrders._id": { "$in": batch.performa.subOrderId } }, function (err, order) {
                if (order) {
                    Promise.all(order.subOrders.map(subOrder => {
                        return new Promise((resolve, reject) => {
                            if (batch.performa.subOrderId.indexOf(subOrder._id) > -1 && subOrder.batchId === batch._id && subOrder.invoiced) {
                                // completed;
                                console.log("Batch Id: ", batch._id);
                                batch.invoiced += 1;
                                updateBatch(batch.performa.performaId, "Completed", batch.invoiced).then(() => {
                                    batch.remarks = "Success";
                                    batch.log = "Performa status changed to completed";
                                    payload.push(batch);
                                    resolve();
                                }).catch(e => {
                                    batch.remarks = "Failed";
                                    batch.log = e.message;
                                    payload.push(batch);
                                    resolve(e);
                                });
                            } else if (batch.performa.subOrderId.indexOf(subOrder._id) > -1 && subOrder.batchId === batch._id && !subOrder.processed) {
                                // cancelled;
                                console.log("Batch Id: ", batch._id);
                                batch.invoiced -= 1;
                                updateBatch(batch.performa.performaId, "Cancelled", batch.invoiced).then(() => {
                                    batch.remarks = "Success";
                                    batch.log = "Performa status changed to Cancelled";
                                    payload.push(batch);
                                    resolve();
                                }).catch(e => {
                                    batch.remarks = "Failed";
                                    batch.log = e.message;
                                    payload.push(batch);
                                    resolve(e);
                                });
                            } else {
                                resolve();
                            }
                        });
                    })).then(() => {
                        queueCB(null);
                    }).catch(e => {
                        queueCB(null);
                    });
                } else {
                    //cancel performa;
                    console.log("Batch Id: ", batch._id);
                    batch.invoiced -= 1;
                    updateBatch(batch.performa.performaId, "Cancelled", batch.invoiced).then(() => {
                        batch.remarks = "Success";
                        batch.log = "Performa status changed to Cancelled";
                        payload.push(batch);
                        queueCB(null);
                    }).catch(e => {
                        batch.remarks = "Failed";
                        batch.log = e.message;
                        payload.push(batch);
                        queueCB(null);
                    });
                }
            });
        }
    });

    queue.drain = function () {
        console.log("Generation CSV with filename : ", fileName);
        generateFile(payload, fileName);
        callback(null);
    };

    cursor.forEach(function (err, batch) {
        if (batch) {
            queue.push(batch, function (err, doc) {
                if (err)
                    console.log("Error:", err.message);
            });
        } else {
            console.log("No batch found...skipping");
            callback(null);
        }
    });
}

function _batchCancel(callback) {
    console.log("Cancelling all open batches.....");
    var payload = [];
    const fileName = "batch_cancel_cleanup.csv";
    var api_endpoint = "/cancelPerformaInvoice";

    var query = [{
        "$match": {
            "status": { "$in": ["Pending"] },
            "performa": {
                "$elemMatch": {
                    "status": "Pending"
                }
            }
        }
    },
    { "$unwind": "$performa" },
    {
        "$match": {
            "performa.status": "Pending"
        }
    },
    {
        "$project": {
            "_id": 1,
            "status": 1,
            "performa.performaId": 1,
            "performa.orderId": 1,
            "performa.status": 1
        }
    }
    ];

    var cursor = db.collection('omsbatches').aggregate(query);

    var queue = async.queue(function (batch, CB) {
        if (batch) {
            batch.remarks = "Pending";
            var end_point = getBatchEndPoint(batch.performa.performaId);
            _fireHttpRequest("oms", end_point, "PUT", null).then(result => {
                batch.remarks = "Success";
                payload.push(batch);
                CB(null);
            }).catch(e => {
                batch.remarks = "Failed";
                batch.log = e.message;
                payload.push(batch);
                CB(null);
            });
        } else {
            console.log("EMPTY: No batch found ...skipping");
            CB(null);
        }
    });

    queue.drain = function () {
        console.log("Generation CSV with filename : ", fileName);
        generateFile(payload, fileName);
        callback(null);
    };

    cursor.forEach(function (err, batch) {
        if (batch) {
            queue.push(batch, function (err, doc) {
                if (err)
                    console.log("Error:", err.message);
            });
        } else {
            console.log("No batch found...skipping");
            callback(null);
        }
    });
}

function getBatchEndPoint(performaInvoiceNo) {
    return `/cancelPerformaInvoice/${performaInvoiceNo}`;
}

function updateBatch(performaId, performaStatus, invoicedCount) {
    return new Promise((resolve, reject) => {
        db.collection('omsbatches').update({ "performa.performaId": performaId }, { "$set": { "performa.$.status": performaStatus, "invoiced": invoicedCount } }, { new: true }, function (err, doc) {
            if (doc) {
                db.collection('omsbatches').findOne({ "performa.performaId": performaId }, function (err, batch) {
                    if (batch) {
                        var status = getBatchStatus(batch.performa, batch.status);
                        //var completedCount = _.countBy(batch.performa, { status: "Completed" });
                        // invoicedCount = completedCount.true ? completedCount.true : 0;
                        db.collection('omsbatches').update({ _id: batch._id }, { "$set": { "status": status } }, { new: true }, function (err, doc) {
                            resolve(doc);
                        });
                    } else {
                        reject(new Error("Batch not found"));
                    }
                });
            } else {
                reject(new Error("Performa not found"));
            }
        });
    });
}


function getBatchStatus(performa, batchStatus) {
    var status = null;
    var pendingCount = _.countBy(performa, { status: "Pending" });
    var cancelledCount = _.countBy(performa, { status: "Cancelled" });
    var completedCount = _.countBy(performa, { status: "Completed" })

    status = pendingCount.true > 0 ? "Pending" : batchStatus;
    status = cancelledCount.true === performa.length ? "Cancelled" : batchStatus;
    status = completedCount.true > 0 && !pendingCount.true ? "Completed" : batchStatus;

    return status;
}

function generateFile(payload, fileName) {
    jsonexport(payload, function (err, csv) {
        if (csv) {
            var path = `${__dirname}/${folder}/${fileName}`;
            console.log("CSV created successfully...", path);
            fs.writeFileSync(path, csv);
        }
        else {
            console.log("ERROR: Could not generate CSV....", err.message);
        }
    });
}

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
                        if (response.statusCode == 200) {
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