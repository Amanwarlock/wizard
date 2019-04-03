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

const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE5LTAyLTEzVDEyOjIyOjQ5LjU2NVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOS0wMS0yMlQwNToyMjozNi4zMDlaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMyIsIldNRjQiLCJXTUYyIiwiV01GMSIsIldNRjAiXSwiZGVmYXVsdFdoSWQiOiJXTUYwIn0sInJvbGVJZCI6IlJPTEUxIiwiaWF0IjoxNTUwNjM5Mjg0LCJleHAiOjE1NTA3MjU2ODR9.TUnRX_sTEfTBFW4shTzVGKYjM0FDNtTtW_LYk2WwaBA";

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function runScript() {

    async.waterfall([
        _askOrderId(),
        _askUnReserveType,
        _takeAction
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

function _askUnReserveType(params, callback) {
    rl.question(`Enter Action type  , OPTIONS : [1 = Cancel / 2 = UnReserve] `, (answer) => {
        answer = answer.toString();
        answer = parseInt(answer);
        if (answer === 1) {
            params.referenceType = "Order Cancellation";
            callback(null, params);
        } else if (answer === 2) {
            params.referenceType = "Stock Unreservation";
            callback(null, params);
        } else {
            callback(new Error(`Invalid reference type / action type`));
        }
    });
}

function _takeAction(params, callback) {
    console.log("Params : ", params);
    db.collection("omsmasters").findOne({ _id: params.id }, (err, order) => {
        if (err) {
            callback(err);
        } else {
            console.log("Found order  :  ", order._id);
            var snapShots = [];
            var ledgers = [];
            order.subOrders.map(subOrder => {
                var _snapShots = subOrder.snapshots.filter(el => el.quantity > 0 ? true : false);
                if (_snapShots && _snapShots.length) {
                    _snapShots.map(el => {
                        el.subOrderId = subOrder._id;
                    });
                }
                snapShots = snapShots.concat(_snapShots);
            });

            if (snapShots && snapShots.length) {
                snapShots.map(snap => {
                    ledgers.push({
                        "snapShotId": snap.snapShotId,
                        "warehouseId": snap.whId,
                        "productId": snap.productId,
                        "referenceType": params.referenceType,
                        "requestQty": snap.quantity,
                        "reference": {
                            "subOrderId": snap.subOrderId
                        }
                    });
                });
            } else {
                callback(new Error(`No snapshots found to take action`));
            }

            if (ledgers && ledgers.length) {
                var payload = {
                    "list": ledgers,
                    "webhook": {
                        "magicKey": "oms",
                        "path": "/webhook/onReservationChange"
                    }
                };

                _fire("/api/wh/v1/stockledger/bulkStockVariation", "PUT", payload).then((result) => {
                    callback(null, result);
                }).catch(e => callback(e));
            }else{
                callback(new Error(`No ledgers found.......`));
            }

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
