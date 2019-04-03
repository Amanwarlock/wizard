"use strict;"
const Mongoose = require("mongoose");
const http = require("http");
const readline = require('readline');
var chalk = require("chalk");
var chalker = new chalk.constructor({ enabled: true, level: 1 });
var async = require("async");
var _ = require("lodash");
var jsonexport = require('jsonexport');
var csvToJson = require('csvjson');
var fs = require("fs");
var path = require("path");

var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();

const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";

var option = { "useNewUrlParser": true };
Mongoose.connect(url, option);
const db = Mongoose.connection;

const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTExLTA3VDA4OjEwOjE4LjgzMVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0xMS0wN1QwODoxMToyNS4wMzFaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiLCJXTUYyIiwiV01GMyJdLCJkZWZhdWx0V2hJZCI6IldNRjAifSwicm9sZUlkIjoiUk9MRTEiLCJpYXQiOjE1NDE1NzgzMDksImV4cCI6MTU0MTY2NDcwOX0.Xzuzu8E3XiGLlndIfbXKk-SUpSjI9nXkOcfxu70uMxY";

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


var path = __dirname;
const folder = "output";


function runScript() {
    console.log(chalker.red.bold(`#.SCRIPT STARTED : ------------------------------- `));
    async.waterfall([
        _readFile(),
        _inventory,
        _createFile
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


function _readFile() {
    return function (callback) {
        var options = {
            delimiter: ',', // optional
            quote: '"' // optional
        };
        //product
        var path = require("path");
        var data = fs.readFileSync(path.join(__dirname, "movement.csv"), { encoding: 'utf8' });
        var json = csvToJson.toObject(data, options);
        callback(null, json);
    }
}

function _inventory(json, callback) {

    var queue = async.queue((data, cb) => {
        data.serialNo = [];
        data._autoApprove = true;
        data._newArea="NormalAR-WMF3-1";
        db.collection("warehouses").findOne({ _id: data._snapshot }, (err, inv) => {
            console.log("Inventory : " , inv._id);
            for (var i = 0; i < inv.serialNo.length; i++) {
                data.serialNo.push(inv.serialNo[i]);
            }
           // cb(null);
            db.collection("warehouses").findOneAndUpdate({ _id: inv._id }, { $set: { quantity: parseInt(data._quantity) } }, (err, result) => {
                if (err) {
                    cb(err)
                } else {
                    cb(null);
                }
            });
        });
    });

    queue.drain = function () {
        callback(null, json);
    }

    queue.push(json, (err, result) => {
        if (err) {
            console.log("Error occure::--------------", err);
        }
    });
}

function _createFile(json, callback) {
    generateFile("csv_movement.csv", json);
    callback(null);
}


function generateFile(fileName, payload) {
    //  checkFolder(path);
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