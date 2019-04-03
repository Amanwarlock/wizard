/*
    - Script to reset all warehouses;
    - Make quantity  = 0;
    - Make onHold = 0;
    - Collect all serial numbers;
    - add to stock ledger;
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

var path = __dirname + "/warehouse_reset_cleanup.csv";
var payload = [];

var query = {};

var cursor = db.collection('warehouses').find({}, { "_id": 1, "whId": 1, "productId": 1, "quantity": 1, "onHold": 1, "mrp": 1, "location": 1, "area": 1, "rackId": 1, "binId": 1, "isGoodStock": 1, "serialNo": 1, "barcode": 1 });

var queue = async.queue(function (snapShot, CB) {
    if (snapShot) {
        getLedgerFormat(snapShot).then(ledger => {
            db.collection('warehouses').update({ _id: snapShot._id }, { "$set": { "quantity": 0, "onHold": 0, "serialNo": [] } }, { new: true }, function (err, doc) {
                if (doc) {
                    db.collection('stockledgers').insert(ledger, function (err, doc) {
                        if (doc) {
                            console.log("Success....");
                            snapShot.remarks = "Success";
                            payload.push(snapShot);
                            CB(null);
                        } else {
                            console.log("Error while resetting snapshots ,", err.message);
                            snapShot.remarks = "Failed";
                            snapShot.log = err.message;
                            payload.push(snapShot);
                            CB(null);
                        }
                    });
                } else {
                    console.log("Error while resetting snapshots ,", err.message);
                    snapShot.remarks = "Failed";
                    snapShot.log = err.message;
                    payload.push(snapShot);
                    CB(null);
                }
            });
        }).catch(e => {
            snapShot.remarks = "Failed";
            snapShot.log = e.message;
            payload.push(snapShot);
            CB(null);
        });
    } else {
        console.log("EMPTY: Snapshot not found, skipping....");
    }
});

queue.drain = function () {
    console.log("Generating CSV...");
    generateFile(payload);
};

cursor.forEach(function (err, snapShot) {
    if (snapShot) {
        queue.push(snapShot, function (err, result) {
            if (err)
                console.log("Error: ", err.message);
        });
    } else {
        console.log("MONGO: Snapshot not found , skipping.....");
    }
});

function getLedgerFormat(snapShot) {
    return new Promise((resolve, reject) => {
        var count = Math.floor(100000 + Math.random() * 900000);
        //1000000;
        var date = new Date();
        var id = count.toString() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() + date.getFullYear();
        var ledger = {
            "_id": id,
            "snapShotId": snapShot._id,
            "mrp": snapShot.mrp,
            "warehouseId": snapShot.whId,
            "productId": snapShot.productId,
            "reference": {
                "objectId": "",
            },
            "referenceType": "Stock Correction",
            "status": "Committed",
            "position": {
                "location": snapShot.location,
                "area": snapShot.area,
                "whId": snapShot.whId,
                "rackId": snapShot.rackId,
                "binId": snapShot.binId
            },
            "requestQty": Math.abs(snapShot.quantity + snapShot.onHold),
            "serialNo": snapShot.serialNo,
            "barcode": snapShot.barcode,
            "stockTransaction": [
                {
                    "_id": snapShot._id,
                    "quantity": snapShot.quantity,
                    "onHold": snapShot.onHold,
                    "state": "before"
                },
                {
                    "_id": snapShot._id,
                    "quantity": 0,
                    "onHold": 0,
                    "state": "after"
                }
            ],
            "log": "Stock clean up",
            "createdBy": "StoreKing",
            "createdAt": new Date(),
            "deleted": false
        }
        resolve(ledger);
    });
}

function generateFile(payload) {
    jsonexport(payload, function (err, csv) {
        if (csv) {
            console.log("CSV created successfully...");
            fs.writeFileSync(path, csv);
        }
    });
}