"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
const http = require("http");
var jsonexport = require('jsonexport');
var csvToJson = require('csvjson');
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

// #. Mongo URL's
var dbURLs = [
    "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging", // LIVE - 0
    "mongodb://sakhi:mrE5ZZNAJbQfn95baj5J@13.232.164.185:27017/liveBackUp", // ETL LIVE BACK UP - 1
    "mongodb://10.0.1.102:27017/skstaging", // STAGING - 2
    "mongodb://localhost:27017/multiWh", // LOCAL -3
    "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging" // Local- live Tunnel -4
]

//process.env.REDIS_CON
var redisUrls = [
    '35.154.220.245:6379'
];


process.env.REDIS_CON = '35.154.220.245:6379';

var db = null;
var options = { "useNewUrlParser": true };


var mappingField = { 'productId': 'Pid' };

(function init() {

    console.log(chalker.green.bold(`#. Script Started ................................................................................`));

    async.waterfall([
        _askConnectionOptions(),
        _runScript
    ], function (err, result) {
        if (err) {
            console.log(chalker.red.bold(`#.SCRIPT TERMINATED : ------------------------------- `, err.message));
            process.exit();
        } else {
            console.log(chalker.green.bold(`#.SCRIPT Completed : -------------------------------`, JSON.stringify(result.result)));
            process.exit();
        }
    });

})();

function _askConnectionOptions() {
    return function (callback) {
        console.log(chalker.yellow.bold(`\n Choose Mongo connection : \n`));

        rl.question(chalker.green.bold(
            `
                [1] Live 
                [2] ETL 
                [3] Staging 
                [4] Local 
                [5] Local-Live Tunnel
            `
        ), answer => {
            console.log("Option entered is : ", parseInt(answer));
            var url = dbURLs[parseInt(answer - 1)];

            if (url) {
                Mongoose.connect(url, options);
                db = Mongoose.connection;

                db.on('error', function () {
                    callback(new Error(`Connection error ........`));
                });

                db.once('open', function () {
                    console.log("Connection established to : ", url);
                    callback(null);
                });

                // puttu.getMagicKey('wh').then(k => console.log("Puttu result ", k)).catch(e => console.log('Puttut err', e));

                //cuti.request.getUrlandMagicKey('wh').then(k => console.log("cuti result ", k)).catch(e => console.log('cuti err', e));

            } else {
                callback(new Error(`Invalid option entered `, answer));
            }
        });

    }
}


function _runScript(callback) {

    console.log(chalker.green.bold(`#. Running Script ....`));
    var params = {};
    async.waterfall([
        _askOptions(params),
        _askJWTToken,
        _findOrders,
        _process
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });

}

var fileName = `dataFile.csv`;

var mappingField = 'order Id';

function _readFile(params, callback) {

    var options = {
        delimiter: ',', // optional
        quote: '"' // optional
    };
    //product
    var data = fs.readFileSync(path.join(__dirname, fileName), { encoding: 'utf8' });
    var json = csvToJson.toObject(data, options);

    json.map(record => {
        record.orderId = record[mappingField];
    });
    console.log("File successfully read , total records found are : ", json.length);
    params.data = json;

    callback(null, params);
}


function _askOptions(params) {
    return function (callback) {
        rl.question(chalker.green.bold(
            ` Choose options : 
                [1] Read from file
                [2] By Batch Id
            `
        ), answer => {
            answer = parseInt(answer);
            if (answer === 1) {
                callback(new Error(`Not Yet Implemented`))
                //_readFile
            } else if (answer === 2) {
                rl.question(chalker.green.bold(` Enter batch Id : `), batchId => {
                    params.batchId = batchId;
                    callback(null, params);
                });
            } else {
                callback(new Error(`Invalid selection`));
            }
        });
    }
}

function _askJWTToken(params, callback) {
    rl.question(chalker.yellow.bold(`Enter JWT Token : `), answer => {
        params.token = answer;
        params.token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE5LTAzLTEyVDA2OjE4OjU1LjczMFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOS0wMy0wNFQwNzowNDowOS42NzZaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMyIsIldNRjQiLCJXTUYyIiwiV01GMSIsIldNRjAiLCJXTUY1IiwiV01GNiIsIldNRjciXSwiZGVmYXVsdFdoSWQiOiJXTUYwIn0sInJvbGVJZCI6IlJPTEUxIiwiaWF0IjoxNTUyNDU4OTE3LCJleHAiOjE1NTI1NDUzMTd9.OK8SpwXmZTawDa9X7oFsG7Sd5dZDu03gN7n4-9kJwMw"
        callback(null, params);
    });
}



function _findOrders(params, callback) {
    db.collection('omsmasters').aggregate([
        {
            $match: {
                "subOrders.batchId": params.batchId
            }
        },
        {
            $project: {
                _id: 1,
                source: 1,
                status: 1,
                "subOrders._id": 1,
                "subOrders.performaInvoiceNo": 1,
                "subOrders.batchId": 1,
                "subOrders.status": 1,
            }
        },
        { $unwind: "$subOrders" },
        {
            $match: {
                "subOrders.batchId": params.batchId,
                status: 'Processing'
            }
        },
        {
            $group: {
                _id: { performaInvoiceNo: "$subOrders.performaInvoiceNo", "batchId": "$subOrders.batchId" },
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                performaInvoiceNo: "$_id.performaInvoiceNo",
                batchId: "$_id.batchId",
                data: 1,
            }
        }
    ]).toArray(function (err, orders) {
        if (err) {
            callback(err);
        } else if (orders && orders.length) {
            console.log("Total orders : ", orders.length);
            params.orders = orders;
            callback(null, params);
        } else {
            callback(new Error(`No orders found.`));
        }
    });
}


function _process(params, callback) {
    var queue = async.queue(function (performa, queueCB) {

        var queue2 = async.queue(function (order, cb) {
            console.log(`--------Process ------------ Performa: ${performa.performaInvoiceNo}  order ${order._id}`);
            _getOrderAndPrepareData(order._id, performa.batchId, performa.performaInvoiceNo, function (err, payload) {
                if (err) {
                    cb(err);
                } else {
                    _getPackages(performa.performaInvoiceNo, payload, params, function (err, payLd) {
                        if (err) {
                            cb(err);
                        } else {
                            // Generate invoice;
                            console.log("Payload ------------------------------", JSON.stringify(payLd));
                           /*  generateInvoice(payLd, params).then(invoice => {
                                console.log("Invoice Id --------------", invoice._id);
                                //cb(null);
                            }).catch(e => callback(e)); */
                        }
                    });
                }
            });
        });

        queue2.push(performa.data, function (err, r) {
            if (err) {
                queue2.kill();
                queueCB(err);
            }
        });

        queue2.drain = function () {
            queueCB(null);
        }
    });

    queue.push(params.orders, function (err, result) {
        if (err) {
            queue.tasks = [];
            queue.kill();
            callback(err);
        }
    });

    queue.drain = function () {
        callback(null, params);
    }
}


function _getOrderAndPrepareData(orderId, batchId, performaId, callback) {
    console.log(chalker.green.bold(`Entered Data : Order Id : ${orderId} / BatchId: ${batchId} / PerformaId: ${performaId} `));
    db.collection('omsmasters').findOne({ _id: orderId }, (err, order) => {
        if (err) {
            console.log("Error on payload generation : ", err);
        }
        if (order) {
            var subOrderList = order.subOrders.filter(sO => sO.batchId === batchId && sO.performaInvoiceNo === performaId ? true : false);
            var payload = {
                "asCancelled": true,
                "isBatchRetained": true,
                "performaInvoice": performaId,
                "orderId": orderId,
                "subOrderList": []
            }
            subOrderList.map(subOrder => {
                var entry = {
                    "_id": subOrder._id,
                    "dealId": subOrder.id,
                    "scan": []
                };
                var snapShotList = subOrder.snapshots.filter(snapShot => snapShot.quantity > 0 ? true : false);
                snapShotList.map(snapShot => {
                    entry.scan.push({
                        "inventoryids": [snapShot.snapShotId],
                        "quantity": snapShot.quantity,
                        "productId": snapShot.productId,
                        "mrp": snapShot.mrp,
                        "serialNo": []
                    });
                })
                payload.subOrderList.push(entry);
            });
            callback(null, payload)
            // callback(null, payload);
        } else {
            console.log(chalker.red.bold('Order not found', order));
            process.exit();
        }
    });

}

function _getPackages(performaId, payload, params, callback) {
    //Get package docs by performa;
    db.collection('packages').find({ performaNo: performaId }).toArray(function (err, packages) {
        if (err) {
            callback(err);
        } else if (packages && packages.length) {
            payload = extractPackages(payload, packages);
        } else {
            var newPackages = [];
            payload.subOrderList.map(sO => {
                sO.scan.map(p => {
                    var existing = _.find(newPackages, { id: p.productId });
                    if (!existing) {
                        newPackages.push({
                            id: p.productId,
                            barcode: ["8901030732409"],
                            quantity: p.quantity,
                            serialNo: []
                        });
                    } else {
                        existing.quantity += p.quantity;
                    }
                });
            });

            payload.insertNewPackages = true;
            var packageData = {
                products: newPackages
            }
            console.log(chalker.red.bold(`No packages found ,generating packages.......`), JSON.stringify(packageData));
            // `/api/oms/createPackage/performaId`
            var path = `/api/oms/v1/createPackage/${performaId}`;
            _fire(path, 'POST', packageData, params.token).then(packages => {
                if (packages && packages.length) {
                    payload = extractPackages(payload, packages);
                    callback(null, payload);
                } else {
                    callback(new Error(`Packages not created and not found...`));
                }
            }).catch(e => callback(e));
        }
    });
}



function extractPackages(payload, packageList) {

    payload.totalPackages = 0;
    payload.subOrderList.map(sO => {

        var productIdList = sO.scan.map(s => s.productId);
        sO.packages = [];
        try {
            sO.packages = extract(packageList, productIdList);
        } catch (e) {
            console.log(chalker.red(`Error occured while extracting packages  : `, e));
        }

        payload.totalPackages += sO.packages.length;
    });

    function extract(packageList, productIds) {
        var extractedPackages = [];
        productIds = _.uniq(productIds);
        try {
            packageList.map(p => {
                p.products.map(pr => {
                    if (productIds.indexOf(pr.id) > -1) {
                        var exists = _.find(extractedPackages, pk => {
                            return pk.packageNo === p._id && pk._id === pr.id
                        });
                        if (!exists) {
                            extractedPackages.push({
                                "packageNo": p._id,
                                "quantity": pr.quantity,
                                "_id": pr.id
                            });
                        } else {
                            exists.quantity += pr.quantity;
                        }

                    }
                });
            })
        } catch (e) {
            console.log(chalker.red(`Error occured while extracting packages  : `, e));
        }

        return extractedPackages;
    }

    return payload;
}


function generateInvoice(payload, params) {
    return new Promise((resolve, reject) => {
        //console.log("Payload"); and generated invoice Id;
        var path = `/api/oms/v1/invoice/generateInvoice`;
        _fire(path, 'POST', payload, params.token).then(invoice => {
            resolve(invoice);
        }).catch(e => reject(e));
    });
}




function _fire(_path, _method, _payload, _token) {
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
            "authorization": _token
        };
        options.path = _path//"/api/wh/v1" + _path;
        options.method = _method;

        console.log("Options", options);

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
