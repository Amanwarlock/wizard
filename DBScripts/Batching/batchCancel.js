"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// #. Mongo URL's
var dbURLs = [
    "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging", // LIVE - 0
    "mongodb://sakhi:mrE5ZZNAJbQfn95baj5J@13.232.164.185:27017/liveBackUp", // ETL LIVE BACK UP - 1
    "mongodb://10.0.1.102:27017/skstaging", // STAGING - 2
    "mongodb://localhost:27017/multiWh", // LOCAL -3
]

var db = null;
var options = { "useNewUrlParser": true };

var fileName = 'Duplicate_Invoices';
path = `/home/aman/Desktop/Hygiene_reports`;

(function init() {

    console.log(chalker.green.bold(`#. Script Started ................................................................................`));

    async.waterfall([
        _askConnectionOptions(),
        _runScript
    ], function (err, result) {
        if (err) {
            console.log(chalker.red.bold(`#.SCRIPT TERMINATED : ------------------------------- `, err.message));
            process.exit();
        } else {
            console.log(chalker.green.bold(`#.SCRIPT Completed : -------------------------------`, result));
            process.exit();
        }
    });

})();

function _askConnectionOptions() {
    return function (callback) {
        console.log(chalker.yellow.bold(`\n Choose Mongo connection : \n`));

        rl.question(chalker.green.bold(
            `
                [1] Live 
                [2] ETL 
                [3] Staging 
                [4] Local 
            `
        ), answer => {
            console.log("Option entered is : ", parseInt(answer));
            var url = dbURLs[parseInt(answer - 1)];

            if (url) {
                Mongoose.connect(url, options);
                db = Mongoose.connection;

                db.on('error', function () {
                    callback(new Error(`Connection error ........`));
                });

                db.once('open', function () {
                    console.log("Connection established to : ", url);
                    callback(null);
                });

            } else {
                callback(new Error(`Invalid option entered `, answer));
            }
        });

    }
}


function _runScript(callback) {

    console.log(chalker.green.bold(`#. Running Script ....`));

    var params = {};

    //ask option 
    rl.question(chalker.blue.bold(
        `
            [1] By API 
            [2] Manual Cancel (Without Hitting API)
        `
    ), answer => {
        answer = parseInt(answer);
        if (answer === 1) {
            cancelViaAPI(params).then(result => callback(null, result)).catch(e => callback(e));
        } else if (answer === 2) {
            manualCancelInDB(params).then(result => callback(null, result)).catch(e => callback(e));
        } else {
            callback(new Error(`Invalid option selected ..`));
        }
    });

}

/*
    - Under the hood uses Batch cancel API and cancel the entire batch;
 */
function cancelViaAPI(params) {
    return new Promise((resolve, reject) => {
        reject(new Error(`Not Yet implemented`));
    });
}


/**
    - Some senario batch may not get cancelled;
    - In that case manually reset all the order fields as if they are not batched
    - Mark the entire batch as cancelled;
 */
function manualCancelInDB(params) {
    console.log(chalker.green.bold(`Manually cancelling batch and resetting order .............`))
    return new Promise((resolve, reject) => {
        async.waterfall([
            _askBatchId(params),
            _findBatchAndOrders,
            _freeOrders,
            _cancelBatch
        ], function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });

        function _askBatchId(params) {
            return function (callback) {
                rl.question(chalker.yellow.bold(`Enter Batch Id : `), answer => {
                    params.batchId = answer;
                    callback(null, params);
                });
            }
        }

        function _findBatchAndOrders(params, callback) {

            var orderPromise = new Promise((resolve, reject) => {
                db.collection('omsmasters').aggregate([
                    {
                        $match: {
                            "subOrders.batchId": params.batchId
                        }
                    }
                ]).toArray(function (err, orders) {
                    if (err) {
                        reject(err);
                    } else if (orders && orders.length) {
                        resolve(orders);
                    } else {
                        reject(new Error(`Orders not found with Batch Id ${params.batchId}`));
                    }
                });
            });

            var batchPromise = new Promise((resolve, reject) => {
                db.collection('omsbatches').findOne({ _id: params.batchId }, function (err, batch) {
                    if (err) {
                        reject(err);
                    } else if (batch) {
                        resolve(batch);
                    } else {
                        reject(new Error(`Batch not found with batch Id ${params.batchId}`))
                    }
                })
            });

            Promise.all([orderPromise, batchPromise]).then(data => {
                var orders = data[0];
                var batch = data[1];

                if (!orders || !orders.length) {
                    callback(new Error(`Orders not found for the batch ${params.batchId}`));
                    return;
                }

                if (!batch ) {
                    callback(new Error(`Batch not found for the batch Id ${params.batchId}`));
                    return;
                }

                params.orders = orders;
                params.batch = batch;

                callback(null, params);

            }).catch(e => callback(e));

        }

        function _freeOrders(params, callback) {
            orders = params.orders;

            var queue = async.queue(function (order, queueCB) {
                var selectedSubOrders = order.subOrders.filter(sO => sO.batchId === params.batchId && sO.status === "Processing" ? true : false);
                if (selectedSubOrders && selectedSubOrders.length) {
                    selectedSubOrders.map(sO => {
                        sO.status = "Confirmed";
                        sO.processed = false;
                        sO.batchId = "";
                        sO.performaInvoiceNo = "";
                        sO.internalStatus = "Confirmed";
                    });
                    var processingCount = _.countBy(order.subOrders, { status: "Processing" });
                    var confirmedCount = _.countBy(order.subOrders, { status: "Confirmed" });
                    if (order.status === 'Processing') {
                        order.status = processingCount.true > 0 ? "Processing" : order.status;
                        order.status = confirmedCount.true === order.subOrders.length ? 'Confirmed' : order.status;
                    }

                    db.collection('omsmasters').save(order, function (err, doc) {
                        if (err) {
                            queueCB(err);
                        } else {
                            queueCB(null);
                        }
                    });

                } else {
                    console.log(`----------------No suborders found in Order ${order._id} with batch Id ${params.batchId} , skipping.............`);
                    queueCB(null);
                }
            });

            queue.push(orders, function (err, result) {
                if (err) {
                    queue.empty();
                    queue.kill();
                    callback(err);
                    return;
                }
            });

            queue.drain = function () {
                callback(null, params);
            }
        }


        function _cancelBatch(params, callback) {

            var batch = params.batch;

            batch.status = "Cancelled";

            if (batch.performa && batch.performa.length) {
                batch.performa.map(p => {
                    p.status = "Cancelled";
                });
            }

            db.collection('omsbatches').save(batch, function (err, doc) {
                if (err) {
                    callback(err);
                } else {
                    params.batch = doc;
                    callback(null, params);
                }
            });

        }


    });


}