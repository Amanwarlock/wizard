"use strict;"
const Mongoose = require("mongoose");
const http = require("http");
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

const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTExLTA1VDA2OjIxOjA0LjA3NVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wOC0xM1QwNzozOTo0My4wNDRaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjAiLCJXTUYxIiwiV01GMiJdLCJkZWZhdWx0V2hJZCI6IldNRjAifSwicm9sZUlkIjoiUk9MRTEiLCJpYXQiOjE1NDE0OTA0NjAsImV4cCI6MTU0MTU3Njg2MH0.WzXgYSDlAEKWg7dii7SU1sCBJ3v74hOeNxjxcFltWI4";

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});


function runScript() {
    async.waterfall([
        _queryDeals(),
        _warehouseSync
    ], function (err, result) {
        if (err) {
            console.log("Error ", err);
            process.exit();
        } else {
            process.exit();
        }
    });
}

function _queryDeals() {
    return function (callback) {
        //Publish
        db.collection('deals').aggregate([
            {
                $match: {
                    "status": "Publish"
                }
            },
            {
                $project: {
                    _id: 1,
                    display: 1,
                    active: 1,
                    status: 1,
                    "product.id": 1,
                    "product.quantity": 1
                }
            }
        ]).toArray(function (err, deals) {
            if (err) {
                callback(err);
            } else {
                callback(null, deals);
            }
        });
    }
}

function _warehouseSync(deals, callback) {
    var productIds = [];
    var counter = 0;
    deals.map(el => el.product.map(p => {
        productIds.push(p.id);
    }));
    console.log("Deals ----- : ", productIds.length);

    var queue = async.queue(function (productId, queueCB) {
        var path = `/api/wh/v1/dealSync?productId=${productId}`;
        //var path = `/dealSync?productId=${productId}`;
        _fire(path, "PUT", null).then(result => {
            counter += 1;
            console.log("Counter ---- : ", counter);
            queueCB(null, result)
        }).catch(e => queueCB(e));
    });

    queue.drain = function () {
        callback(null);
    }

    queue.push(productIds, function (err) {
        if (err) {
            console.log("Errro ", err);
        }
    });
}


/* function _fire(_magickey, _path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_magickey) {
            reject(new Error(`Magic Key cannot be empty for HTTP request.`));
            return;
        }
        if (!_path) {
            reject(`Path cannot be empty for HTTP request.`);
            return;
        }
        if (!_method) {
            reject(`Http Method cannot be empty for HTTP request.`);
            return;
        }
        cuti.request.getUrlandMagicKey(_magickey)
            .then(options => {
                options.hostname = "newerp.storeking.in";
                options.port = '8080';
                options.path += _path;
                options.method = _method;
                var request = http.request(options, response => {
                    var data = "";
                    response.on('data', _data => data += _data.toString());
                    response.on('end', () => {
                        console.log("data----" , data)
                        if (response.statusCode === 200) {
                            try {
                                data = JSON.parse(data);
                                resolve(data);
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

            }).catch(e => reject(e));
    });
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
    });
}
