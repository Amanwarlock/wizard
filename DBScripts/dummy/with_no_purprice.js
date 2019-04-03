"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var fs = require("fs");
var path = require("path");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

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
    db.collection('warehouses').find({ $or: [{ purchasePrice: { $exists: false } }, { purchasePrice: 0 }] }).project({ productId: 1, createdAt: 1, purchasePrice: 1, productName: 1 })
        .toArray(function (err, invList) {
            generateFile("snapshots_withNo_price.csv", invList);
            process.exit();
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
