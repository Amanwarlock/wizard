"use strict;"
const Mongoose = require("mongoose");
const http = require("http");
const readline = require('readline');
var chalk = require("chalk");
var chalker = new chalk.constructor({ enabled: true, level: 1 });
var async = require("async");
var _ = require("lodash");

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


function runScript() {
    console.log(chalker.red.bold(`#.SCRIPT STARTED : ------------------------------- `));
    async.waterfall([
        _getDocs(),
        _approve
        /*  _askOrderId(),
         _askUnReserveType,
         _takeAction */
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

function _askOrderId() {
    return function (callback) {
        rl.question(`Enter Order Id  :  `, (answer) => {
            answer = answer.toString();
            var params = { "id": answer };
            callback(null, params);
        });
    }
}
/* 
    {"status":"Pending","whId":{"$in":["WMF3"]},"createdAt":{"$lte":"2018-11-07T18:29:59.999Z","$gte":"2018-11-01T07:52:24.195Z"}}
*/
function _getDocs() {
    return function (callback) {
        db.collection("stocktransfers").aggregate([
            {
                $match : {
                    status : "Pending",
                    whId : {$in  : ["WMF3"]},
                    createdAt:{"$lte": new Date("2018-11-07T18:29:59.999Z"),"$gte": new Date("2018-11-01T07:52:24.195Z")},
                    createdBy : "9731466944"
                }
            }
        ]).toArray((err, docs) => {
            if (err) {
                callback(err);
            } else if (docs && docs.length) {
                callback(null, docs);
            }else{
                callback(new Error(`No docs found`))
            }
        });;
    }
}

function _approve(docs, callback) {

    var queue = async.queue((doc, cb) => {
        var url = `/api/wh/v1/stockTransfer/${doc._id}?status=Approved`;
        var payload = {
            "statusRemarks": "System Approved - Via script"
        }
        _fire(url, "PUT", payload).then(data => cb(null, data)).catch(e => cb(e));
    });

    queue.drain = function () {
        callback(null);
    }

    queue.push(docs, (err, result) => {
        if (err) {
            console.log("Error occured: ", err);
        }else{
            console.log("Approved : " , result._id);
        }
    });
}

/* 

{
  "list": [
    {
      "snapShotId": "WH25384",
      "warehouseId": "WMF0",
      "productId": "PR16417",
      "referenceType": "Stock Unreservation",
      "requestQty": 3,
      "reference": {
        "subOrderId": "OR201801024102219_1"
      }
    }
  ],
  "webhook": {
    "magicKey": "oms",
    "path": "/webhook/onReservationChange"
  }
}

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

        options.hostname = "newerp.storeking.in";
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

        request.on('error', (e) => {
            console.log("Request error : ", e);
        })
    });
}
