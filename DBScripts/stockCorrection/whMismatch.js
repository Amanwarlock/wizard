"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
const http = require("http");
var jsonexport = require('jsonexport');
var csvToJson = require('csvjson');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();


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
    "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging" // Local- live Tunnel -4
]

//process.env.REDIS_CON
var redisUrls = [
    '35.154.220.245:6379'
];


process.env.REDIS_CON = '35.154.220.245:6379';

var db = null;
var options = { "useNewUrlParser": true };


var mappingField = { 'productId': 'Pid' };

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
            console.log(chalker.green.bold(`#.SCRIPT Completed : -------------------------------`, JSON.stringify(result.result)));
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
                [5] Local-Live Tunnel
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

                // puttu.getMagicKey('wh').then(k => console.log("Puttu result ", k)).catch(e => console.log('Puttut err', e));

                //cuti.request.getUrlandMagicKey('wh').then(k => console.log("cuti result ", k)).catch(e => console.log('cuti err', e));

            } else {
                callback(new Error(`Invalid option entered `, answer));
            }
        });

    }
}


function _runScript(callback) {

    console.log(chalker.green.bold(`#. Running Script ....`));
    var params = {};
    async.waterfall([
        processAndUpdate(params)
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });

}

function processAndUpdate(params) {
    return function (callback) {
        db.collection('stockadjustments').aggregate([
            {
                $match: {
                    status: "Approved",
                    snapshot: { $exists: true }
                }
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    whId: 1,
                    snapshot: 1,
                    createdAt: 1,
                    actionRemarks: 1
                }
            },
            {
                $lookup: {
                    from: "warehouses",
                    localField: "snapshot",
                    foreignField: "_id",
                    as: "snapshotData"
                }

            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    whId: 1,
                    snapshot: 1,
                    createdAt: 1,
                    actionRemarks: 1,
                    inventoryId: { $arrayElemAt: ["$snapshotData._id", 0] },
                    invWhId: { $arrayElemAt: ["$snapshotData.whId", 0] },
                    invProductId: { $arrayElemAt: ["$snapshotData.productId", 0] },
                }
            },
            {
                $redact: {
                    $cond: {
                        if: { $ne: ["$whId", "$invWhId"] },
                        then: "$$KEEP",
                        else: "$$PRUNE"
                    }
                }
            }
        ]).toArray(function (err, docs) {
            if (err) {
                callback(err);
            } else if (docs && docs.length) {
                console.log("Total Documents Found  : ", docs.length);
                var bulk = db.collection('stockadjustments').initializeUnorderedBulkOp();
                var shouldRun = false;
                docs.map(d => {
                    if (d && d.productId === d.invProductId && d.snapshot === d.inventoryId && d.whId !== d.invWhId) {
                        shouldRun = true;
                        bulk.find({ _id: d._id }).update({ $set: { whId: d.invWhId } });
                    }
                });

                if (shouldRun) {
                    bulk.execute(function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, result);
                        }
                    });
                }
            } else {
                callback(new Error(`No documents found..`));
            }
        });
    }
}