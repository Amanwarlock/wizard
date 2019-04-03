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

/* ######################################## */
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();
/* -------------------------------------------------------------------------------------------- */

/* Mongo URL */
//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const url ="mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging"; // SSH TUNNEL TO LIVE
//const url = "mongodb://localhost:27017/multiWh";

/* --------MONGO CONNECT------ */
var options = { "useNewUrlParser": true };
Mongoose.connect(url, options);
var db = Mongoose.connection;

/* -----LISTENERS------ */
db.on('error', function () {
    console.log("Connection Error....");
    process.exit();
});

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});
/********************************************************************************************************************************************/


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function _askQuestion() {
    return function (callback) {
        rl.question('Enter Inventory Id to get scanned Imeis ?', (answer) => {
            // TODO: Log the answer in a database
            console.log(`Thank you ....: ${answer}`);
            callback(null, answer.toString());
            rl.close();
        });
    }
}

function runScript() {
    console.log(chalker.blue.bold("Generating Invoice payload........Enter Order Id , Batch and Performa Id when asked"));
    async.waterfall([
        _askOrderId(),
        _askBatchId,
        _askPerformaNo,
        _getOrderAndPrepareData,
        _getPackages
    ], function (err, result) {
        if (err) {
            console.log(chalker.error.bold(err));
            process.exit();
        } else {
            console.log(chalker.green.bold("Invoice scan payload : \n"), JSON.stringify(result));
            process.exit();
        }
    });
}

function _askOrderId() {
    return function (callback) {
        rl.question(chalker.yellow.bold('Enter Order Id ?\n'), (answer) => {
            callback(null, answer.toString());
            // rl.close();
        });
    }
}

function _askBatchId(orderId, callback) {
    rl.question(chalker.yellow.bold('Enter Batch Id ?\n'), (answer) => {
        callback(null, orderId, answer.toString());
        // rl.close();
    });
}

function _askPerformaNo(orderId, batchId, callback) {
    rl.question(chalker.yellow.bold('Enter Performa Id ?\n'), (answer) => {
        callback(null, orderId, batchId, answer.toString());
        rl.close();
    });
}

function _getOrderAndPrepareData(orderId, batchId, performaId, callback) {
    console.log(chalker.green.bold(`Entered Data : Order Id : ${orderId} / BatchId: ${batchId} / PerformaId: ${performaId} `));
    db.collection('omsmasters').findOne({ _id: orderId }, (err, order) => {
        if (order) {
            var subOrderList = order.subOrders.filter(sO => sO.batchId === batchId && sO.performaInvoiceNo === performaId ? true : false);
            var payload = {
                "asCancelled": true,
                "isBatchRetained": true,
                "performaInvoice": performaId,
                "orderId": orderId,
                "subOrderList": []
            }
            subOrderList.map(subOrder => {
                var entry = {
                    "_id": subOrder._id,
                    "dealId": subOrder.id,
                    "scan": []
                };
                var snapShotList = subOrder.snapshots.filter(snapShot => snapShot.quantity > 0 ? true : false);
                snapShotList.map(snapShot => {
                    entry.scan.push({
                        "inventoryids": [snapShot.snapShotId],
                        "quantity": snapShot.quantity,
                        "productId": snapShot.productId,
                        "mrp": snapShot.mrp,
                        "serialNo": []
                    });
                })
                payload.subOrderList.push(entry);
            });
            callback(null, orderId, batchId, performaId, payload)
            // callback(null, payload);
        } else {
            console.log(chalker.red.bold('Order not found'));
            process.exit();
        }
    });

}

function _getPackages(orderId, batchId, performaId, payload, callback) {
    //Get package docs by performa;
    db.collection('packages').find({ performaNo: performaId }).toArray(function (err, packages) {
        if (err) {
            callback(err);
        } else if (packages && packages.length) {
            payload.totalPackages = 0;
            payload.subOrderList.map(sO => {

                var productIdList = sO.scan.map(s => s.productId);
                sO.packages = [];
                try {
                    sO.packages = extractPackages(packages, productIdList);
                } catch (e) {
                    console.log(chalker.red(`Error occured while extracting packages  : `, e));
                }

                payload.totalPackages += sO.packages.length;
            });
            callback(null, payload);
        } else {
            console.log(chalker.red.bold(`No packages found .......`));
            callback(null, payload);
        }
    });
}

function extractPackages(packageList, productIds) {
    var extractedPackages = [];
    productIds = _.uniq(productIds);
    try {
        packageList.map(p => {
            p.products.map(pr => {
                if (productIds.indexOf(pr.id) > -1) {
                    var exists = _.find(extractedPackages, pk => {
                        return pk.packageNo === p._id && pk._id === pr.id
                    });
                    if (!exists) {
                        extractedPackages.push({
                            "packageNo": p._id,
                            "quantity": pr.quantity,
                            "_id": pr.id
                        });
                    } else {
                        exists.quantity += pr.quantity;
                    }

                }
            });
        })
    } catch (e) {
        console.log(chalker.red(`Error occured while extracting packages  : `, e));
    }
    return extractedPackages
}

/*

  "asCancelled": true,
  "isBatchRetained": true,
  "performaInvoice": "PR51498",
  "orderId": "OR2018090967590",
  "subOrderList": [
    {
      "_id": "OR2018090967590_1",
      "dealId": "D1944849166",
      "scan": [
        {
          "inventoryids": [
            "WH25331"
          ],
          "quantity": 125,
          "productId": "PR10451",
          "mrp": 29,
          "serialNo": []
        },
        {
          "inventoryids": [
            "WH24764"
          ],
          "quantity": 1,
          "productId": "PR10451",
          "mrp": 29,
          "serialNo": []
        }
      ]
    }
  ]
}


*/