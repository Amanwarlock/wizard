/*
    - Script to cancel all open batches;
    - command - node scripts/batch.cancel.js
 */

var async = require("async");
var _ = require("lodash");
var url = "mongodb://localhost/QA_Bug";
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();

var db = mongoShell(url);

var path = __dirname + "/order_performa_cancel_cleanup";
var payload = [];

var query = [{
    "$match": {
        "status": { "$in": ["Pending"] },
        "performa": {
            "$elemMatch": {
                "status": "Pending"
            }
        }
    }
},
{ "$unwind": "$performa" },
{
    "$match": {
        "performa.status": "Pending"
    }
},
{
    "$project": {
        "_id": 1,
        "status": 1,
        "performa.performaId": 1,
        "performa.orderId": 1,
        "performa.status": 1
    }
}
];

var api_endpoint = "/cancelPerformaInvoice"; //{performaInvoiceNo}

function getEndPoint(performaInvoiceNo) {
    return `/cancelPerformaInvoice/${performaInvoiceNo}`;
}

var cursor = db.collection('omsbatches').aggregate(query);

var queue = async.queue(function (batch, CB) {
    if (batch) {
        batch.remarks = "Pending";
        var end_point = getEndPoint(batch.performa.performaId);
        _fireHttpRequest("oms", end_point, "PUT", null).then(result => {
            batch.remarks = "Success";
            payload.push(batch);
            CB(null);
        }).catch(e => {
            batch.remarks = "Failed";
            batch.log = e.message;
            payload.push(batch);
            CB(null);
        });
    } else {
        console.log("EMPTY: No batch found ...skipping");
    }
});

queue.drain = function () {
    console.log("Generating CSV...");
    generateFile(payload);
};

cursor.forEach(function (err, batch) {
    if (batch) {
        console.log("Batch Id: ", batch._id);
        queue.push(batch, function (err, doc) {
            if (err)
                console.log("Error:", err.message);
        });
    } else {
        console.log("No batch found...skipping");
    }
});

function generateFile(payload) {
    jsonexport(payload, function (err, csv) {
        if (csv) {
            console.log("CSV created successfully...");
            fs.writeFileSync(path, csv);
            process.exit();
        }
    });
}

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
                options.path += _path;
                options.method = _method;
                var request = http.request(options, response => {
                    var data = "";
                    response.on('data', _data => data += _data.toString());
                    response.on('end', () => {
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