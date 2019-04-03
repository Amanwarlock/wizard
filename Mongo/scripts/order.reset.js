/*
    - THis is the last resort;
    - After all API's have cleaned , just run this to make sure what API's have missed are all cleaned;
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

var path = __dirname + "/order_reset_cleanup.csv";
var payload = [];

var query = [{
    "$match": {
        "stockAllocation": { "$nin": ["NotAllocated"] },
        "paymentStatus": { "$nin": ["Reverted"] },
        "fulfilledBy": "MPS0",
        "status": { "$in": ["Processing", "Confirmed"] },
        "subOrders": {
            "$elemMatch": {
               // "status": { "$eq": "Confirmed" },
               // "snapshots": { "$ne": [] },
                "invoiced": false,
                "processed": false,
                //"blockedProducts": { "$ne": [] }
            }
        },

    }
},
{ "$unwind": "$subOrders" },
{
    "$match": {
        //"subOrders.status": { "$eq": "Confirmed" },
        "subOrders.invoiced": false,
        "subOrders.processed": false,
        //"subOrders.snapshots": { "$ne": [] },
        //"subOrders.blockedProducts": { "$ne": [] }
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


var cursor = db.collection('omsmasters').aggregate(query);

var queue = async.queue(function (order, CB) {
    if (order) {
        /*
            - status = "Confirmed";
            - gotRequestedProducts = false;
            - stockAllocation = "NotAllocated";
            - subOrders.status = "Confirmed";
            - subOrders.snapshots = [];
            - subOrders.blockedProducts = [];
            - subOrders.readyForBatching = false;
            - subOrders.internalStatus = Confirmed
            - subOrders.processed = false;
            - subOrders.invoiced = false;
            - 
         */
        var status = "Confirmed";
        var count = _.countBy(order.subOrders , o => o.status !== "Confirmed" ? true : false);
        status = count ? "Processing" : status;
        db.collection('omsmasters').update({ _id: order._id, "subOrders._id": order.subOrders._id },
            {
                "$set": {
                    "status": status,
                    "gotRequestedProducts": false,
                    "stockAllocation": "NotAllocated",
                    "subOrders.$.status": "Confirmed",
                    "subOrders.$.snapshots": [],
                    "subOrders.$.blockedProducts": [],
                    "subOrders.$.readyForBatching": false,
                    "subOrders.$.internalStatus": "Confirmed",
                    "subOrders.$.processed": false,
                    "subOrders.$.invoiced": false
                }
            },
            { new: true }, function (err, doc) {
                if (doc) {
                    order.remarks = "Success";
                    payload.push(order);
                    CB(null);
                } else {
                    order.remarks = "Failed";
                    order.log = err.message;
                    payload.push(order);
                    CB(null);
                }
            });
    } else {
        console.log("Order not found , skipping....");
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
        }
    });
}