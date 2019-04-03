
/*
    - This script is to check all pending performa against order and check to update status either to Completed / cancelled;
    - Makes batches in sync with the orders;
 */
var async = require("async");
var _ = require("lodash");
var url = "mongodb://localhost/QA_Bug";
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();

var db = mongoShell(url);

var path = __dirname + "/batch_reset_cleanup.csv";
var payload = [];

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

var queue = async.queue(function (batch, CB) {
    if (batch) {
        /*
            - Find order by using subOrderIds in performa
            - CASE 1: If in suborder status is other than processing / Processing, invoice = true then set performa status = Completed;  
            - CASE 2: If in suborder status = confirmed , processed = false ,batchId = "" and performaInvoiceNo = "" then set InternalStatus = Confirmed  performa status = cancelled and reduce invoicedCount -1;
         */
        db.collection('omsmasters').findOne({ "subOrders._id": { "$in": batch.performa.subOrderId } }, function (err, order) {
            if (order) {
                Promise.all(order.subOrders.map(subOrder => {
                    return new Promise((resolve, reject) => {
                        if (batch.performa.subOrderId.indexOf(subOrder._id) > -1 && subOrder.batchId === batch._id  && subOrder.invoiced) {
                            //batch.performa.status = "Completed"; 
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
                                reject(e);
                            });
                        } else if (batch.performa.subOrderId.indexOf(subOrder._id) > -1 && !subOrder.processed) {
                            //batch.performa.status = "Cancelled"
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
                                reject(e);
                            });
                        } else {
                            resolve();
                        }
                    });
                })).then(result => {
                    CB(null);
                }).catch(e => {
                    batch.remarks = "Failed";
                    batch.log = e.message;
                    payload.push(batch);
                    CB(null);
                });
            } else {
                 //batch.performa.status = "Cancelled"
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
                     reject(e);
                 });
            }
        })
    } else {
        console.log("No batch found , skipping....");
    }
});

queue.drain = function () {
    console.log("Generating CSV...");
    generateFile(payload);
};

cursor.forEach(function (err, batch) {
    if (batch) {
        queue.push(batch, function (err, doc) {
            if (err)
                console.log("Error:", err.message);
        });
    } else {
        console.log("No batch found...skipping");
    }
});

function updateBatch(performaId, performaStatus, invoicedCount) {
    return new Promise((resolve, reject) => {
        db.collection('omsbatches').update({ "performa.performaId": performaId }, { "$set": { "performa.$.status": performaStatus, "invoiced": invoicedCount } }, { new: true }, function (err, doc) {
            if (doc) {
                db.collection('omsbatches').findOne({ "performa.performaId": performaId }, function (err, batch) {
                    if (batch) {
                        var status = getStatus(batch.performa, batch.status);
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

function getStatus(performa, batchStatus) {
    var status = null;
    var pendingCount = _.countBy(performa, { status: "Pending" });
    var cancelledCount = _.countBy(performa, { status: "Cancelled" });
    var completedCount = _.countBy(performa, { status: "Completed" })

    status = pendingCount.true > 0 ? "Pending" : batchStatus;
    status = cancelledCount.true === performa.length ? "Cancelled" : batchStatus;
    status = completedCount.true > 0 && !pendingCount.true ? "Completed" : batchStatus;

    return status;
}

function generateFile(payload) {
    jsonexport(payload, function (err, csv) {
        if (csv) {
            console.log("CSV created successfully...");
            fs.writeFileSync(path, csv);
            process.exit();
        }
    });
}