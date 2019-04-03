"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
var fs = require("fs");
var path = require("path");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });
puttu.connect();

var csvToJson = require('csvjson');
var path = "/home/aman/Desktop/DB_Scripts";//__dirname + "/csv_reports";
const folder = "output";

/* ---------SET UP - PREREQUISITES--------------- */
/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging"; //live

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
    console.log("#SCRIPT STARTED: --------------------------------------------------------------------------------------");
    var payload = [];
    db.collection('warehouses').find({  }).toArray((err, invList) => {
        if (invList && invList.length) {
            var queue = async.queue((inv, cb) => {
                db.collection('stockledgers').find({ snapShotId: inv._id }).count((err, count) => {
                    if (!count) {
                        console.log("COunt", inv._id, count);
                        payload.push({
                            InventoryId: inv._id,
                            productId: inv.productId,
                            createdAt: inv.createdAt,
                            createdBy: inv.createdBy,
                            quantity : inv.quantity,
                            onHold:  inv.onHold,
                            mrp: inv.mrp,
                            ref: inv.ref
                        });
                        cb(null);
                    }else{
                        cb(null);
                    }
                });
            });

            queue.drain = () => {
                generateFile("LedgerLessSnapshots.csv", payload);
                process.exit();
            };

            queue.push(invList, (err, result) => {

            });
        }
    });
}


function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}`;
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
