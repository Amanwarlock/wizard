
var async = require("async");
var _ = require("lodash");
var url = "mongodb://localhost/QA_Bug";
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");

var db = mongoShell(url);

var path = __dirname + "/order_status_cleanup.csv";
var payload = [];

var cursor = db.collection('omsmasters').find({ "subOrders.processed": true, "subOrders.invoiced": false, status: { "$eq": "Confirmed" } });


var queue = async.queue(function (data, CB) {
    db.collection('omsmasters').update({ _id: data.orderId }, { "$set": { status: "Processing" } }, function (err, doc) {
        if (doc) {
            data.remarks = "Success";
            payload.push(data);
            CB(null);
        } else {
            data.remarks = "Failed";
            payload.push(data);
            CB(null);
        }
    });
});

queue.drain = function () {
    generateFile(payload);
};

cursor.forEach(function (err, order) {
    if (order) {
        console.log("----order id--", order._id);
        queue.push({
            "orderId": order._id,
            "status": order.status,
            "changedTo": "Processing",
            "stockAllocation": order.stockAllocation,
        }, function (err, result) {
            if (err)
                console.log(err.message);
        });
    }
})


function generateFile(payload) {

    jsonexport(payload, function (err, csv) {
        if (csv) {
            fs.writeFileSync(path, csv);
        }
    });
}
