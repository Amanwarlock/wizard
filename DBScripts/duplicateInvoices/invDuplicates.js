
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

    var params = {
        payload: [],
        duplicates: []
    };

    async.waterfall([
        _askOption(params),
        _findInvoices,
        _checkForDuplicates
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            generateFile(fileName, result.payload);
            // console.log("Payload ----", JSON.stringify(result.payload));
            callback(null, result);
        }
    });

}


function _askOption(params) {
    return function (callback) {
        rl.question(
            `
            Check dupicates :

                [1] By Invoice
                [2] All

            `
            , answer => {
                console.log("Option entered is : ", parseInt(answer));
                answer = parseInt(answer);
                if (answer === 1) {
                    rl.question(`Enter invoice No : `, answer => {
                        params.invoiceId = answer;
                        callback(null, params);
                    });
                } else {
                    callback(null, params);
                }
            });
    }
}

function _findInvoices(params, callback) {

    var startDate = new Date(2018, 1, 1, 00, 00, 00, 000);

    console.log("Finding invoive start date -------------", startDate);

    var _match = { status: { $nin: ['Cancelled'] } };

    if (params.invoiceId) {
        _match[`_id`] = params.invoiceId;
    }

    params.select = {
        _id: 1,
        whId: 1,
        status: 1,
        orderId: 1,
        batchId: 1,
        performaInvoiceNo: 1,
        invoiceValue: 1,
        "deals._id": 1,
    }

    db.collection('omsinvoices').aggregate([
        {
            $match: _match
        },
        {
            $project: params.select
        }
    ]).toArray(function (err, invoiceList) {
        if (err) {
            callback(err);
        } else if (invoiceList && invoiceList.length) {
            console.log("Invoices length ", invoiceList.length);
            params.invoiceList = invoiceList;
            callback(null, params);
        } else {
            callback(new Error(`Invoices not found ..........`));
        }
    });
}

function _checkForDuplicates(params, callback) {
    var counter = params.invoiceList.length;
    var queue = async.queue(function (inv, queueCB) {
        if (params.duplicates.indexOf(inv._id) < 0) {
            var dealIds = inv.deals.map(d => d._id);
            db.collection('omsinvoices').find({
                _id: { $nin: [inv._id] }, deals: {
                    $elemMatch: {
                        _id: { $in: dealIds }
                    }
                }
            }).project(params.select).toArray(function (err, duplicateInvList) {
                if (err) {
                    queueCB(err)
                } else if (duplicateInvList && duplicateInvList.length) {

                    // console.log("Dup  ", JSON.stringify(duplicateInvList));

                    var dupIds = duplicateInvList.map(d => d._id);
                    dupIds.push(inv._id);

                    console.log(`Inv id / dup id : ${inv._id} | ${dupIds}`,  counter -=1);

                    dupIds = _.uniq(dupIds);


                    params.duplicates = params.duplicates.concat(dupIds);
                    // params.duplicates.push(inv._id);
                    var entry = {
                        orderId: inv.orderId,
                        whId: inv.whId,
                        duplicates: dupIds.join(" | "),
                        cancelled: []
                    };
                    params.payload.push(entry);

                    filterCancelled([inv._id].concat(dupIds)).then(cancelled => {
                        entry.cancelled = cancelled;
                        queueCB();
                    }).catch(e => queueCB(null));

                } else {
                    console.log("------No Duplicate ,SKIP------",  counter -=1);
                    queueCB(null);
                }
            })

        } else {
            console.log("------No Duplicate ,SKIP------", counter -=1);
            queueCB(null);
        }
    })

    queue.push(params.invoiceList, function (err, result) {

    })

    queue.drain = function () {
        callback(null, params)
    }
}



function filterCancelled(invoiceIds) {
    return new Promise((resolve, reject) => {
        cancelled = [];

        //ledger
        var ledgerPromise = new Promise((resolve, reject) => {
            db.collection('stockledgers').find({ "reference.invoiceNo": { $in: invoiceIds }, "referenceType": "Invoice Cancellation", status: "Committed" }).project({ _id: 1, status: 1, reference: 1, referenceType: 1 }).toArray(function (err, ledgers) {
                ledgers = ledgers && ledgers.length ? ledgers : [];
                resolve(ledgers);
            });
        });

        //logistics
        var logisticPromise = new Promise((resolve, reject) => {
            db.collection('logistics').find({ $or: [{ actualInvoiceNo: { $in: invoiceIds } }, { invoiceNo: { $in: invoiceIds } }] }).project({ _id: 1, invoiceNo: 1, actualInvoiceNo: 1 }).toArray(function (err, result) {
                result = result && result.length ? result : [];
                resolve(result);
            })
        });

        Promise.all([ledgerPromise, logisticPromise]).then(data => {
            var ledgers = data[0];
            var logistics = data[1];

            invoiceIds.map(i => {
                var ledger = _.find(ledgers, l => {
                    return l.reference.invoiceNo === i
                });

                var log = _.find(logistics, l => {
                    return l.actualInvoiceNo === i || l.invoiceNo === i;
                });

                if (ledger && !log) {
                    cancelled.push(i);
                }
            })

            resolve(cancelled);

        }).catch(e => reject(e));
    });
}



function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}.csv`;
            console.log(chalker.yellow("CSV created successfully...", _path));
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
