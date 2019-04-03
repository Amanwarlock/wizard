"use strict;"
var Mongoose = require("mongoose");
var http = require("http");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
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

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */

var hostname = null;

function init() {

    const local = "mongodb://localhost:27017/multiWh";
    const qa = "mongodb://skQAUser:g6PELBMenXazvyWP@13.126.75.175:27017/skDev";
    const preProd = "";
    const live = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";

    const options = { "useNewUrlParser": true };

    rl.question(chalker.blue.bold(
        `
            Choose Environment : \n
                [1] Local
                [2] QA
                [3] Pre-Prod
                [4] Live
    
            Note: Provide auth token
        `
    ), (answer) => {

        var answer = parseInt(answer);
        var db = null;

        if (answer === 1) {

            console.log(chalker.green.bold("Established connection with Local Environment.............."));
            hostname = "localhost";
            Mongoose.connect(local, options);
            db = Mongoose.connection;

        } else if (answer === 2) {

            console.log(chalker.green.bold("Established connection with QA Environment.............."));
           hostname = "qa.storeking.in";
          // hostname = "13.126.75.175";
            Mongoose.connect(qa, options);
            db = Mongoose.connection;

        } else if (answer === 3) {

        } else if (answer === 4) {

        } else {
            console.log(chalker.red.bold(`Invalid Selection ...`));
            process.exit();
        }

        if (db) {
            db.on('error', function () {
                console.log("Connection Error....");
                process.exit();
            });

            db.once('open', function callback() {
                console.log("Connection established to : ");
                runScript();
            });
        } else {
            console.log(chalker.red.bold(`DB instance not found....`));
            process.exit();
        }

    });
}

init();

//const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjU5YTZhNjUxYjZjMDZjZmVjODljNzUiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTExLTA5VDE4OjAwOjQ2LjcwNFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDcyOCIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0xMS0wMVQxODo0Mzo0NS40MzhaIiwicmVmSWQiOiJFTVA3MjgiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjEiLCJXTUYwIiwiV01GMyJdLCJkZWZhdWx0V2hJZCI6IldNRjAifSwicm9sZUlkIjoiUk9MRTEiLCJpYXQiOjE1NDE4NzU1MDQsImV4cCI6MTU0MTk2MTkwNH0.2TwWPcxKYy_oqWGwPXiWemvSTcg3vLH9fGkv0jJ0qyo";
const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjU5YTZhNjUxYjZjMDZjZmVjODljNzUiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTExLTEwVDE4OjQ1OjA0LjYxNFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDcyOCIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0xMS0wMVQxODo0Mzo0NS40MzhaIiwicmVmSWQiOiJFTVA3MjgiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjEiLCJXTUYwIiwiV01GMyJdLCJkZWZhdWx0V2hJZCI6IldNRjAifSwicm9sZUlkIjoiUk9MRTEiLCJpYXQiOjE1NDIwMTU3OTcsImV4cCI6MTU0MjEwMjE5N30.4bIidTNKRXuYFJQPhSa-x4jXoy7guRXYywyXXnLEXic";

function runScript() {
    console.log(chalker.blue.bold("#. WMF UPDATE script started ........................................................................."));
    const db = Mongoose.connection;

    async.waterfall([
        _getWmfs(db),
        _update
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

function _getWmfs(db) {
    return function (callback) {
        db.collection("franchises").aggregate([
            {
                $match: {
                    "sk_franchise_details.franchise_type": "WMF"
                }
            }
        ]).toArray((err, franchises) => {
            if (err)
                callback(err);
            else if (franchises && franchises.length)
                callback(null, db, franchises);
            else
                callback(new Error(`Franchises not found....`));
        });
    }
}

function _update(db, franchises, callback) {

    var queue = async.queue((franchise, cb) => {
        console.log(chalker.blue.bold(`Franchise WMF : ${franchise._id}`));
        var url = `/api/franchise/v1/${franchise._id}`;

        _fire(url, "PUT", franchise).then(updated => cb(null, updated)).catch(e => cb(e));

    });


    queue.push(franchises, (err, result) => {
        if (err) {
            console.log(chalker.red.bold("Error on update : ", err.message));
            callback(err);
            return;
        }
    });

    queue.drain = function () {
        callback(null)
    }
}



/* 
    Path format - /api/wh/v1
    Token  - required;

*/

function _fire(_path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_path) {
            reject(`Path cannot be empty for HTTP request.`);
            return;
        }
        if (!_method) {
            reject(`Http Method cannot be empty for HTTP request.`);
            return;
        }
        var options = {};

        options.hostname = hostname;
        options.port = '8080';
        options.headers = {
            "content-type": "application/json",
            "authorization": token
        };
        options.path = _path//"/api/wh/v1" + _path;
        options.method = _method;


        var request = http.request(options, response => {
            var data = "";
            response.on('data', _data => data += _data.toString());
            response.on('end', () => {
                if (response.statusCode == 200) {
                    try {
                        if (data) {
                            resolve(data);
                        } else {
                            resolve();
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(data));
                }

            });
        });
        if ((_method === 'POST' || _method === 'PUT') && !_.isEmpty(_payload))
            request.end(JSON.stringify(_payload));
        else
            request.end();
    });
}