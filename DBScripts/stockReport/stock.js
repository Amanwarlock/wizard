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

var queryFile = require("./query");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/* Mongo URL */
//const liveurl = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const localUrl = "mongodb://localhost:27017/report";

var options = { "useNewUrlParser": true };

var db = null;

Mongoose.connect(localUrl, options);
db = Mongoose.connection;

db.on('error', function () {
    console.log("Connection Error....");
    process.exit();
});

db.once('open', function callback() {
    console.log("Connection established to : ");
    runScript();
});

function runScript(){
    queryFile.run(db).then(()=>{
        console.log(chalker.blue.bold("Stock summary data generated successfully.................."));
        process.exit();
    }).catch(e => {
        console.log(chalker.red("Error occured while generating stock closing report summary ................" , e));
        process.exit();
    });
}