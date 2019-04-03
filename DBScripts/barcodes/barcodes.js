"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var jsonexport = require('jsonexport');
var csvToJson = require('csvjson');
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
    "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging" // Local- live Tunnel -4
]

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
        _readFile(params),
        _updateBarcodes
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });

}

var fileName = `dataFile.csv`;

var mappingField = 'Pid';

function _readFile(params) {
    return function (callback) {
        var options = {
            delimiter: ',', // optional
            quote: '"' // optional
        };
        //product
        var data = fs.readFileSync(path.join(__dirname, fileName), { encoding: 'utf8' });
        var json = csvToJson.toObject(data, options);

        json.map(record => {
            record.productId = record[mappingField];
        });
        console.log("File successfully read , total records found are : ", json.length);
        params.data = json;

        callback(null, params);
    }
}


function _updateBarcodes(params, callback) {

    var bulk = db.collection('warehouses').initializeUnorderedBulkOp();

    var pIds = [];
    params.data.map(d => {
        pIds.push(d.productId);
    });

    console.log("Product Ids length -----------", pIds.length);

    db.collection('warehouses').aggregate([
        { $match: { productId: { $in: pIds } } },
        { $project: { _id: 1, productId: 1, whId: 1, barcode: 1 } }
    ]).toArray(function (err, result) {
        if (err) {
            callback(err);
        } else if (result && result.length) {
            console.log(`Total records found .............. ${result.length}`);
            var counter = result.length;
            result.map(inventory => {

                let _barcode = [`O${inventory.barcode[0]}`];
                counter -= 1;
                console.log("Updating barcode to ------------", _barcode, `Product Id ${inventory.productId} whId ${inventory.whId}`, `Count ${counter}`);

                bulk.find({ productId: inventory.productId, whId: inventory.whId }).update({ $set: { barcode: _barcode } });

            });


            bulk.execute(function (err, result) {
                if (err)
                    callback(err);
                else {
                    console.log("Successfully update ----------");
                    params.result = result;
                    callback(null, params);
                }
            });

        } else {
            callback(new Error(`No data found ...`));
        }
    });
}