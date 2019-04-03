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

/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
//const url ="mongodb://10.0.1.102:27017/skstaging";
var path = "/home/aman/Desktop/Hygiene_reports";//__dirname + "/csv_reports";
const folder = "output";


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


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});



function runScript() {
    var params = {};
    async.waterfall([
        _askGRNId(params),
        _askproductId,
        _askQty,
        _findGrnAndUpdate,
    ], function (err, result) {
        if (err) {
            console.log(chalker.red.bold(`#.SCRIPT TERMINATED : ------------------------------- `, err.message));
            process.exit();
        } else {
            console.log(chalker.green.bold(`#.SCRIPT Completed : -------------------------------`, result));
            process.exit();
        }
    });
}

function _askGRNId(params) {
    return function (callback) {
        rl.question(` Enter GRN ID : `, answer => {
            params.grnId = answer;
            callback(null, params);
        });
    }
}

function _askproductId(params, callback) {
    rl.question(` Enter Product ID : `, answer => {
        answer.productId = answer;
        callback(null, params);
    });
}

function _askQty(params, callback) {
    rl.question(` Enter Recieved quantity to be updated : `, answer => {
        answer.recievedQty = parseInt(answer);
        callback(null, params);
    });
}

function _findGrnAndUpdate(params, callback) {
    db.collection('stockintakes').findOneAndUpdate({
        _id: params.grnId, "productDetails.productId": params.productId
    }, { $set: { [`productDetails.$.receivedQuantity`]: params.recievedQty } }, { new: true }, function (err, doc) {
        if (err)
            callback(err);
        else
            callback(null, doc);
    });
}