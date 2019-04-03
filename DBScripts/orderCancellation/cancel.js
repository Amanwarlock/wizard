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

const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA5LTI4VDA3OjU5OjI0LjI3OVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wOC0xM1QwNzozOTo0My4wNDRaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiLCJXTUYyIl0sImRlZmF1bHRXaElkIjoiV01GMCJ9LCJyb2xlSWQiOiJST0xFMSIsImlhdCI6MTUzODIwMjU0NywiZXhwIjoxNTM4Mjg4OTQ3fQ.W4ILl1JXoJ80TDONcgFct_pIaQwLZWU-_lvwEJKLpqQ";

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});


function runScript() {
    async.waterfall([
        _fetchOrders(),
        _cancelOrders
    ], function (err, result) {
        if (err) {
            console.log("Error : ", err);
            process.exit();
        } else {
            console.log("Success : " , result);
            process.exit();
        }

    });
}


function _fetchOrders() {
    return function (callback) {
        var orderIds = [];
        db.collection("omsmasters").aggregate([
            {
                $match: {
                    "subOrders.price": { "$exists": false },
                    "paymentStatus": "Reverted",
                    "createdAt": { "$gte": new Date("2018-09-27T11:57:22.295+05:30") }
                }
            },
            {
                $lookup:
                    {
                        from: "fundtransfers",
                        localField: "_id",
                        foreignField: "entityId",
                        as: "accounts"
                    }
            },
            {
                $project: {
                    _id: 1,
                    "accounts": 1,
                    "status": 1,
                    "paymentStatus": 1,
                    /*"subOrders._id":1,
                    "subOrders.status" :1,*/
                    acccountsLenght: { $size: "$accounts" }
                }
            },

            {
                $match: {
                    acccountsLenght: { $lt: 2 }
                }
            }

        ]).toArray((err, orders) => {
            if (orders && orders.length) {
                var queue = async.queue((order, cb) => {
                    console.log("Order Id :  ", order._id);
                    db.collection("omsmasters").findOne({ _id: order._id }, (err, order) => {
                        if (order) {
                            order.status = "Confirmed";
                            order.paymentStatus = "Paid";
                            order.subOrders.map(subOrder => {
                                subOrder.price = subOrder.b2bPrice;
                                subOrder.status = "Confirmed";
                            });
                            orderIds.push(order._id);
                            db.collection("omsmasters").save(order);
                            cb(null);
                        }
                    });
                });

                queue.push(orders, (err, result) => {

                })

                queue.drain = function () {
                    callback(null, orderIds);
                }

            }
        });

    }

}


function _cancelOrders(orderIds, callback) {
    console.log("Order ids ", orderIds.length, orderIds);
    var queue = async.queue((order, cb) => {
        console.log("Order id in iterator : ", order);
        db.collection("omsmasters").findOne({ _id: order }, (err, _order) => {
            if (_order) {
                var subOrderIds = _order.subOrders.map(s => s._id);

                _fire(`/api/oms/v1/order/${_order._id}/cancelSubOrders`, "PUT", { "subOrders": subOrderIds }).then(result => {
                    console.log("Cancelled Result : ", result);
                    cb(null);
                }).catch(e => cb(e));
            }
        });
    });

    queue.push(orderIds, () => {

    });

    queue.drain = function () {
        callback(null, orderIds)
    }
}


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
