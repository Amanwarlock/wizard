
/*
    - Script to correct order status to processing if any one suborder status is confirmed;
    - Only for orders which are not batched;
 */

var async = require("async");
var _ = require("lodash");
var url = "mongodb://localhost/QA_Bug";
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");

var db = mongoShell(url);

var path = __dirname + "/order_status_cleanup.csv";
var payload = [];

var cursor = db.collection('omsmasters').find({ "subOrders.processed": true, status: { "$eq": "Confirmed" } });

var inculsion = ["Createdd", "New"]

var queue = async.queue(function (data, CB) {
    var _status = null;
    if (data.status !== "Confirmed") {
        _status = data.status;
    } else if (inculsion.indexOf(data.status) > -1) {
        _status = "Created";
    } else {
        _status = "Processing";
    }
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
    } else {
        console.log("No order found....");
    }
})


function generateFile(payload) {

    jsonexport(payload, function (err, csv) {
        if (csv) {
            fs.writeFileSync(path, csv);
            process.exit();
        }
    });
}
