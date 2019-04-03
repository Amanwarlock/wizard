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
const etlUrl = "mongodb://sakhi:mrE5ZZNAJbQfn95baj5J@13.232.164.185:27017/liveBackUp"


/* --------MONGO CONNECT------ */
var options = { "useNewUrlParser": true };


let _Mongoose = require("mongoose").Mongoose;

const localInstance = new _Mongoose();
localInstance.connect(url, options);
var localDB = localInstance.connection;


const etlInstance = new _Mongoose();
etlInstance.connect(etlUrl, options);
var etlDB = etlInstance.connection;

var localPromise = new Promise((resolve, reject) => {
    localDB.on('error', function () {
        console.log("Connection Error....");
        reject();
    });

    localDB.once('open', function callback() {
        console.log("Connection established to : ", url);
        resolve();
    });
});

var etlPromise = new Promise((resolve, reject) => {
    /* -----LISTENERS------ */
    etlDB.on('error', function () {
        console.log("Connection Error....");
        reject();
    });

    etlDB.once('open', function callback() {
        console.log("Connection established to : ", url);
        resolve();
    });

});


/* -----LISTENERS------ */

Promise.all([localPromise, etlPromise]).then(() => {
    runScript();
}).catch(e => {
    console.log("Error on connection .........", e);
    process.exit();
})


function runScript() {
    async.waterfall([
        _getLedgers(),
        _insertInDB
    ], function (err, result) {
        if (err) {
            console.log(`Error occured .................`, err);
            process.exit();
        } else {
            console.log(`Script completed .................`, result);
            process.exit();
        }
    });
}

function _getLedgers() {
    return function (callback) {
        localDB.collection('stockledgers').aggregate([
            {
                $match: {
                    manualInsertion: true
                }
            }
        ]).toArray(function (err, ledgers) {
            if (err) {
                callback(err);
            } else if (ledgers && ledgers.length) {
                console.log("Fetched from stockledger ...........", ledgers.length);
                callback(null, ledgers)
            } else {
                callback(new Error(`No entries found.....`));
            }
        });
    }
}

function _insertInDB(ledgers, callback) {
    console.log("Proceeding with insert ..............");

    var bulk = etlDB.collection('stockledgers').initializeUnorderedBulkOp();

    ledgers.map(l => {
        bulk.find({ _id: l._id }).upsert().update({ $set: l });
    });

    bulk.execute(function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}