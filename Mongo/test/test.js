/* 
    - Script to find all orders with mismatch status;
    - Script for warehouse;
    - Script for Batch cancellation;
    - Script for GRN;
*/
//node test/test
"use strict;";
var Mongoose = require("mongoose");
var http = require("http");
//var cuti = require("cuti");
var _ = require("lodash");
var url = "mongodb://localhost/QA_Bug";

// Collecions;
const orderCollection = "omsMaster";
const invoiceCollection = "omsInvoice";
const batchCollection = "omsBatch";

var db = null;

Mongoose.connect(url, function (err, db) {
    if (!err) {
        console.log("Connected to the DB");
        db = db;
        /*  db.collection("omsmasters").find({ _id: "OR201805071" }).forEach(el => {
             console.log("----order---" , el);
         }); */
         orderStatusUpdate(db);

    } else {
        console.log("error " + err.message);
    }
});


function orderStatusUpdate(db) {
    var collection = db.collection("omsmasters");
    collection.find({ "subOrders.processed": true, status: { "$eq": "Confirmed" } }).toArray(function (err, result) {
        if (result) {
            console.log("---order id---", result[0]._id);
        }
    });
}   