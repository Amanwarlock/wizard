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

var path = __dirname + "/order_status_reset.csv";
var payload = [];


var query = [
    {
        "$match": {
            "status": { "$in": ["Createdd", "New"] },
            "stockAllocation": { "$in": ["Pending", "Allocated", "PartialAllocated"] },
            "paymentStatus": { "$nin": ["Reverted"] },
            "fulfilledBy": "MPS0",
        }
    },
    {
        "$project": {
            _id: 1,
            "paymentStatus": 1,
            "status": 1,
            "stockAllocation": 1,
            "fulfilledBy": 1,
        }
    }
]


var cursor = db.collection('omsmasters').aggregate(query);


var queue = async.queue(function (order, CB) {
    var status = order.status;
    var allocation = order.stockAllocation;
    if (order.status === "Createdd" || order.status === "New") {
        status = order.paymentStatus === "Paid" ? "Confirmed" : "Created";
    }

    if (order.stockAllocation === "Pending") {
        allocation = "NotAllocated";
    }

    db.collection('omsmasters').update({ _id: order._id }, { "$set": { "status": status, "stockAllocation": allocation } }, { new: false }, function (err, doc) {
        if (doc) {
            order.remarks = "Success";
            order.log = `Changed order status from  ${order.status} to ${status} and stockAllocation from ${order.stockAllocation} to ${allocation}`;
            payload.push(order);
            CB(null);
        } else {
            order.remarks = "Failed";
            order.log = err.message;
            payload.push(order);
            CB(null);
        }
    });

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