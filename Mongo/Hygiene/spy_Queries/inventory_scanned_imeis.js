"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");

/*#########################################################[--PRE-REQUISITES-]################################################################################### */
/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
//const url ="mongodb://10.0.1.102:27017/skstaging";
var path = "/home/aman/Desktop/Hygiene_reports";//__dirname + "/csv_reports";

const folder = "output";

/*########################################################################################################################################################## */

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

function runScript() {
    console.log("#############################-----SCRIPT STARTED------###########################################################################");
    async.waterfall([
        _askQuestion(),
        _findInvoicedOrders,
        _getGrnImeis,
        _extractScannedImeis,
    ], function (err, result) {
        if (err) {
            console.log("Error  :", err);
        }
        console.log("#############################-----SCRIPT ENDED------###########################################################################");
        process.exit();
    });
}


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

function _findInvoicedOrders(snapShotId, callback) {
    var snapShotIdList = [snapShotId];
    var invoiced = true;

    db.collection("omsmasters").aggregate([
        {
            "$match": {
                "subOrders": {
                    "$elemMatch": {
                        "invoiced": invoiced,
                        // "status": { "$in": ["Processing", "Confirmed"] },
                        "snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIdList }, "quantity": { "$gt": 0 } } }
                    }
                }
            }
        },
        { "$unwind": "$subOrders" },
        {
            "$match": {
                "subOrders.invoiced": invoiced,
                //"subOrders.status": { "$in": ["Processing", "Confirmed"] },
                "subOrders.snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIdList }, "quantity": { "$gt": 0 } } }
            }
        },
        { "$unwind": "$subOrders.snapshots" },
        {
            "$match": {
                "subOrders.snapshots.snapShotId": { "$in": snapShotIdList },
                "subOrders.snapshots.quantity": { "$gt": 0 }
            }
        },
        {
            "$project": {
                "_id": 1,
                "subOrders._id": 1,
                "subOrders.invoiced": 1,
                "subOrders.performaInvoiceNo": 1,
                "subOrders.batchId": 1,
                "subOrders.snapshots.snapShotId": 1,
                "subOrders.snapshots.productId": 1,
                "subOrders.snapshots.quantity": 1
            }
        },
        {
            "$group": {
                "_id": "$subOrders.snapshots.snapShotId",
                "totalQty": { "$sum": "$subOrders.snapshots.quantity" },
                "productIds": { "$addToSet": "$subOrders.snapshots.productId" },
                "suborderids": { "$addToSet": "$subOrders._id" },
            }
        }
    ]).toArray(function (err, result) { // result = orders - invoiced by the entered snapshot;
        if (err)
            callback(err)
        else {
            var report = {
                inventory: result[0]._id,
                Ivoiced_qty: result[0].totalQty,
                productId: result[0].productIds[0],
                total_orders: result[0].suborderids.length
            }
            callback(null, snapShotId, result[0], report);
        }
    });


}


function _getGrnImeis(snapShotId, orders, report, callback) {
    db.collection('stockledgers').find({ snapShotId: snapShotId, "referenceType": "GRN" }).toArray(function (err, result) {
        if (err)
            callback(err);
        else {
            report['Grn_qty'] = result[0].requestQty;
            report['Grn_Imeis'] = result[0].serialNo;
            callback(null, snapShotId, orders, report);
        }

    });
}

function _extractScannedImeis(snapShotId, orders, report, callback) {
    var subOrderids = orders.suborderids; //["OR2018081338412_1"];


    db.collection('omsinvoices').aggregate([
        {
            $match: {
                status: { $nin: ["Cancelled"] },
                "deals": {
                    $elemMatch: {
                        _id: { $in: subOrderids }
                    }
                }
            }
        },
        { $unwind: "$deals" },
        {
            $match: {
                "deals._id": { $in: subOrderids }
            }
        },
        { $unwind: "$deals.invoicedsnapshotReference" },
        {
            $match: {
                "deals.invoicedsnapshotReference.snapShotId": { $in: [snapShotId] }
            }
        },
        {
            $project: {
                _id: 1,
                whId: 1,
                orderId: 1,
                batchId: 1,
                performaInvoiceNo: 1,
                deals: 1
            }
        }
    ]).toArray(function (err, invoices) {
        if (err)
            callback(err);
        else if (invoices) {
            var scannedImeis = [];
            invoices.map(inv => {
                scannedImeis = scannedImeis.concat(inv.deals.invoicedsnapshotReference.serialNo);
            });
            report['scanned_Imeis'] = scannedImeis;
            report['total_Imei_scanned'] = scannedImeis.length;
           
            var difference_imei = [];

            report['Grn_Imeis'].map(imei => {
                if (scannedImeis.indexOf(imei) < 0) {
                    difference_imei.push(imei);
                }
            });

            report['difference_imei'] = difference_imei;

            console.log("iNvoics--", JSON.stringify(report['scanned_Imeis']));

            console.log("--------IMEI Difference---------" , difference_imei);

            var fileName = `Scanned_Imei_report_${snapShotId}_${new Date().toISOString()}.csv`;
            generateFile(fileName, report);
            callback(null, snapShotId, orders, report);

        } else {
            callback(new Error(`INvoices not found`))
        }
    })
}

function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}`;
            console.log("CSV created successfully...", _path);
            fs.writeFileSync(_path, csv);
        }
    });
}

function checkFolder(path) {
    //var path = `${__dirname}/${folder}`;
    var isExist = fs.existsSync(path)
    if (!isExist) {
        console.log("Creating folder");
        fs.mkdirSync(path);
    } else {
        //console.log("Folder already there ..skipping..");
    }
}