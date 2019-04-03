
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

var path = __dirname + "/order_stock_release_cleanup.csv";
var payload = [];

/* Find orders which are not batched / invoiced 
 - order not in notAllocated state;
 - orders with payment state not reverted;
*/
var query = [{
    "$match": {
        "stockAllocation": { "$nin": ["NotAllocated"] },
        "paymentStatus": { "$nin": ["Reverted"] },
        "fulfilledBy": "MPS0",
        "status": { "$in": ["Processing", "Confirmed"] },
        "subOrders": {
            "$elemMatch": {
                "status": { "$eq": "Confirmed" },
                "snapshots": { "$ne": [] },
                "invoiced": false,
                "processed": false,
                "blockedProducts": { "$ne": [] }
            }
        },

    }
},
{ "$unwind": "$subOrders" },
{
    "$match": {
        "subOrders.status": { "$eq": "Confirmed" },
        "subOrders.invoiced": false,
        "subOrders.processed": false,
        "subOrders.snapshots": { "$ne": [] },
        "subOrders.blockedProducts": { "$ne": [] }
    }
},
{
    "$project": {
        "_id": 1,
        "stockAllocation": 1,
        "paymentStatus": 1,
        "status": 1,
        "fulfilledBy": 1,
        "subOrders._id": 1,
        "subOrders.id": 1,
        "subOrders.status": 1,
        "subOrders.snapshots.ledgerId": 1,
        "subOrders.snapshots.snapShotId": 1,
        "subOrders.snapshots.productId": 1,
        "subOrders.snapshots.quantity": 1,
        "subOrders.snapshots.mrp": 1,
        "subOrders.requestedProducts": 1,
        "subOrders.blockedProducts": 1

    }
}
];

var api_endpoint = "/transferOrderStocks";

var cursor = db.collection('omsmasters').aggregate(query);

//Comment code which does reservation;
var queue = async.queue(function (order, CB) {
    if (order) {
        order.remarks = "Pending";
        var body = {
            "transferType": "ToInventory",
            "fromOptions": {
                "orderId": order._id
            }
        }
        _fireHttpRequest("oms", api_endpoint, "PUT", body).then(result => {
            console.log("Order released successfully......");
            order.remarks = "Success";
            payload.push(order);
            CB(null, order);
        }).catch(e => {
            console.log("ERROR : ", e.message);
            order.remarks = "Failed";
            order.log = e.message;
            payload.push(order);
            CB(null, order)
        });
    } else {
        console.log("No order Found...");
    }
});

queue.drain = function () {
    console.log("Generating CSV...");
    generateFile(payload);
};

cursor.forEach(function (err, order) {
    if (order) {
        queue.push(order, function (err, doc) {
            if (err)
                console.log("Error:", err.message);
        });
    } else {
        console.log("CURSOR: Order not found...skipping");
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