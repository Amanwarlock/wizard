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

/* Mongo URL */
//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const url = "mongodb://localhost:27017/report";


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


function runScript() {
    return new Promise((resolve, reject) => {

        var params = {};

        async.waterfall([
            _askProductId(params),
            _askGrnId,
            _askInventoryId,
            _insertLedger
        ], function (err, result) {
            if (err) {
                console.log("Error occured while inserting stock ledger ...........", err);
                reject(err);
                process.exit();
            }
            else {
                console.log("Stock ledger inserted successfully ........", result);
                resolve(result);
                process.exit();
            }

        });

    });
}


function _askProductId(params) {
    return function (callback) {
        rl.question(` Enter Product Id : `, (answer) => {
            if (answer) {
                params.productId = answer;
                callback(null, params);
            } else {
                callback(new Error(`Product Id is required....`));
            }
        });
    }
}

function _askGrnId(params, callback) {
    rl.question(`Enter GRN ID : `, (answer) => {
        if (answer) {
            params.grnId = answer;
            callback(null, params);
        } else {
            callback(new Error(`GRN Id is required ......`));
        }
    });
}

function _askInventoryId(params, callback) {
    rl.question(`Enter Inventory Id : `, (answer) => {
        if (answer) {
            params.inventoryId = answer;
            callback(null, params);
        } else {
            callback(new Error(`Inventory is required.......`));
        }
    });
}

function _insertLedger(params, callback) {
    db.collection('stockintakes').aggregate([
        { $match: { _id: params.grnId, status: "Closed" } },
        { $unwind: "$productDetails" },
        {
            $match: {
                "productDetails.productId": params.productId
            }
        },
        {
            $project: {
                whId: 1,
                createdAt: 1,
                createdBy: 1,
                status: 1,
                productDetails: 1
            }
        }
    ]).toArray(function (err, grn) {
        if (err) {
            callback(err);
        } else if (grn && grn.length) {

            grn  = grn[0];

            db.collection('warehouses').findOne({ _id: params.inventoryId, productId: params.productId }, function (err, inventory) {
                if (err) {
                    callback(err);
                } else if (inventory) {

                    let randomId = "" + Math.floor(100000 + Math.random() * 900000)
                    randomId += inventory._id + params.grnId;

                    let ledger = {
                        "_id": randomId,
                        "snapShotId": inventory._id,
                        "mrp": inventory.mrp,
                        "warehouseId": inventory.whId,
                        "productId": inventory.productId,
                        "reference": {
                            "grn": params.grnId
                        },
                        "referenceType": "GRN",
                        "status": "Committed",
                        "position": {
                            "location": inventory.location,
                            "area": inventory.area,
                            "whId": inventory.whId,
                            "rackId": inventory.rackId,
                            "binId": inventory.binId
                        },
                        "requestQty": grn.productDetails.receivedQuantity,
                        "serialNo": inventory.serialNo && inventory.serialNo.length ? inventory.serialNo : [],
                        "barcode": inventory.barcode && inventory.barcode.length ? inventory.barcode : [],
                        "stockTransaction": [
                            {
                                "_id": inventory._id,
                                "quantity": 0,
                                "onHold": 0,
                                "state": "before"
                            },
                            {
                                "_id": inventory._id,
                                "quantity": grn.productDetails.receivedQuantity,
                                "onHold": 0,
                                "state": "after"
                            }
                        ],
                        "log": "Stock clean up",
                        "createdBy": "StoreKing",
                        "createdAt": inventory.createdAt,
                        "deleted": false,
                        "manualInsertion": true
                    }

                    db.collection('stockledgers').insert(ledger, function (err, ledgerRecord) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, ledgerRecord);
                        }
                    });

                } else {
                    callback(new Error(`Could not find snapshot .....`));
                }
            });


        } else {
            callback(new Error("GRN is not found...."));
        }
    });

}