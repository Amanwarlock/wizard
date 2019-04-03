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
puttu.connect();

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


function runScript() {
    console.log("Running stock migration script.....");
    async.waterfall([
        _fetchInventory(),
        _prepareRequest,
        _initRequest
    ], function (err, result) {
        if (err) {
            console.log("Error : ", err);
            process.exit();
        }
        else {
            console.log("Script for migration completed...");
            process.exit();
        }
    });
}

function _fetchInventory() {
    return function (callback) {

        db.collection("warehouses").aggregate(pipeline).toArray(function (err, inventories) {
            if (err)
                callback(err);
            else
                callback(null, inventories);
        });
    }
}

function _prepareRequest(inventories, callback) {
    var payload = [];
    Promise.all(inventories.map(inventory => {
        return new Promise((resolve, reject) => {
            var queue = async.queue(function (snapShotId, queueCB) {
                if (snapShotId) {
                    db.collection("warehouses").findOne({ "_id": snapShotId }, function (err, inv) {
                        if (inv) {
                            var entry = preparePayload(inv);
                            payload.push(entry);
                            queueCB();
                        } else {
                            // reject();
                            queueCB(new Error("Could not find inventory data"));
                        }
                    });
                }
            });

            queue.drain = function () {
                resolve();
            }

            queue.push(inventory.snapShotIds, function (err, result) {
                if (err)
                    reject(err);
            });

        });

    })).then(() => {
        callback(null, inventories, payload);
    }).catch(e => callback(e));
}

var stockTransferPath = "/stockTransfer";
var approvePath = "/stockTransfer/STFR10071?status=Approved";

function _initRequest(inventories, payloadLlist, callback) {
    console.log("Payload 1---", payloadLlist[0]);
    console.log("Payload 2----", payloadLlist[1]);
    //callback(null,payload);
    var queue = async.queue(function (payload, queueCB) {
        //make stock transfer request;
        var path_1 = "/stockTransfer";
        var _data = { "status": "Pending", "products": [payload] }
        _fireHttpRequest("wh", path_1, "POST", _data).then(data => {
            //approve request
            var path_2 = `/stockTransfer/${data[0]._id}?status=Approved`;
            _fireHttpRequest("wh", path_2, "PUT", { "statusRemarks": "FMCG Stock Migration" }).then(result => {
                queueCB(null);
            }).catch(e => queueCB(e));

        }).catch(e => queueCB(e));

    });

    queue.drain = function () {
        callback(null);
    }

    queue.push(payloadLlist, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
    });
}

function preparePayload(inv) {
    return {
        "productId": inv.productId,//"PR10017",
        "name": inv.productName,
        "quantity": inv.quantity,
        "mrp": inv.mrp,
        "whId": inv.whId,
        "towhId": "WMF1",
        "snapshot": inv._id,
        "location": inv.location,
        "area": inv.area,//"NormalAR-WMF0-1",
        "rackId": inv.rackId,//"Rack-1",
        "binId": inv.binId,//"Bin-1",
        "serialNo": [],
        "barcode": inv.barcode[0],//"BAR98734985",
        "newLocation": inv.location,//"Normal",
        "newArea": inv.area,//"NormalAR-WMF1-1",
        "newRack": inv.rackId,//"Rack-1",
        "newBin": inv.binId//"Bin-2"
    }
}


var token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA3LTEyVDA1OjQ5OjIzLjI3MFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wNi0yOFQwNTo0NToxMC45NDBaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiXSwiZGVmYXVsdFdoSWQiOiJXTUYwIn0sInJvbGVJZCI6IlJPTEUxIiwiaWF0IjoxNTMxNDY2OTA5LCJleHAiOjE1MzE1NTMzMDl9.5FPcASuBZskQqLNq8DY9-3WLFdvHOG0-UrUnTRxa3MI";

/* 
{ hostname: 'http://newerp.storeking.in',
 port: '80',
 path: '/api/wh/v1/stockTransfer',
 method: 'POST'
Now use
alrite


*/


function _fireHttpRequest(_magickey, _path, _method, _payload) {
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
                options.headers = {
                    "content-type": "application/json",
                    "authorization": token
                };
                options.path = "/api/wh/v1" + _path;
                options.method = _method;
                console.log("Options----", options);
                var request = http.request(options, response => {
                    var data = "";
                    response.on('data', _data => data += _data.toString());
                    response.on('end', () => {
                        if (response.statusCode == 200) {
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

var fmcg = ["C3554", "C3558", "C3637", "C3645", "C3694", "C3707", "C3732", "C3809", "C4307", "C5777", "C5853", "C6215", "C3688"];
var electronics = ["C3626", "C3695", "C3696", "C3703", "C6097", "C3633", "C5173", "C3636", "C4110"];

const pipeline = [{
    "$match": {
        "whId": "WMF0",
        "isGoodStock": true,
        "quantity": { "$gt": 0 }
    },
},
{
    "$lookup": {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
    }
}, {
    "$project": {
        "_id": 1,
        "warehouseId": "$whId",
        "productId": 1,
        "quantity": 1,
        "onHold": 1,
        "GrnId": "$ref.grn",
        "product": { "$arrayElemAt": ["$product", 0] }
    }
},
{
    "$project": {
        "_id": 1,
        "warehouseId": 1,
        "productId": 1,
        "productName": "$product.name",
        "quantity": 1,
        "onHold": 1,
        "GrnId": 1,
        "category": { "$arrayElemAt": ["$product.category", 0] }
    }
},
{
    "$lookup": {
        "from": "categories",
        localField: "category",
        foreignField: "_id",
        as: "categories"
    }
}, {
    "$project": {
        "_id": 1,
        "warehouseId": 1,
        "productId": 1,
        "productName": 1,
        "quantity": 1,
        "onHold": 1,
        "GrnId": 1,
        "category": 1,
        "categoryName": {
            "$reduce": {
                "input": "$categories",
                "initialValue": "",
                "in": { "$concat": ["$$value", "$$this.name"] }
            }
        },
        "categoryParent": {
            "$reduce": {
                "input": "$categories",
                "initialValue": "",
                "in": { "$concat": ["$$value", "$$this.parent"] }
            }
        }
    }
},
{
    "$project": {
        "_id": 1,
        "warehouseId": 1,
        "productId": 1,
        "productName": 1,
        "quantity": 1,
        "onHold": 1,
        "GrnId": 1,
        "category": 1,
        "categoryName": 1,
        "categoryParent": {
            "$cond": {
                "if": { "$ne": ["$categoryParent", null] },
                "then": "$categoryParent",
                "else": "$category"
            }
        }
    }
},
{
    "$graphLookup": {
        "from": "categories",
        "startWith": "$categoryParent",
        "connectFromField": "parent",
        "connectToField": "_id",
        "as": "hierarchy"
    }
}, {
    "$project": {
        "_id": 1,
        "warehouseId": 1,
        "productId": 1,
        "productName": 1,
        "quantity": 1,
        "onHold": 1,
        "GrnId": 1,
        "category": 1,
        "categoryName": 1,
        "categoryParent": 1,
        "topParent": { "$arrayElemAt": ["$hierarchy", 0] },
        "hierarchy": {
            "$map": {
                "input": "$hierarchy",
                "in": {
                    _id: "$$this._id",
                    "name": "$$this.name",
                    "status": "$$this.status",
                    "parent": "$$this.parent"
                }
            }
        }

    }
}, {
    "$project": {
        "_id": 1,
        "warehouseId": 1,
        "productId": 1,
        "productName": 1,
        "quantity": 1,
        "onHold": 1,
        "GrnId": 1,
        "category": 1,
        "categoryName": 1,
        "categoryParent": 1,
        "topParent": "$topParent._id",
        "topParentName": "$topParent.name",
        //"hierarchy" :1
    }
},
{
    "$addFields": {
        "FMCG": {
            "$cond": {
                "if": { "$gte": [{ "$indexOfArray": [fmcg, "$topParent"] }, 0] },
                "then": true,
                "else": false,
            }
        },
        "Electronics": {
            "$cond": {
                "if": { "$gte": [{ "$indexOfArray": [electronics, "$topParent"] }, 0] },
                "then": true,
                "else": false,
            }
        }
    }
},
{
    "$group": {
        "_id": "$productId",
        "whId": { "$first": "$warehouseId" },
        "ProductName": { "$first": "$productName" },
        "categoryId": { "$first": "$category" },
        "TopCategory": { "$first": "$topParent" },
        "Quantity": { "$sum": "$quantity" },
        "OnHold": { "$sum": "$onHold" },
        "FMCG": { "$first": "$FMCG" },
        "Electronics": { "$first": "$Electronics" },
        "snapShotIds": { "$addToSet": "$_id" }
    }
},
{
    "$match": {
        "FMCG": true
    }
}
];