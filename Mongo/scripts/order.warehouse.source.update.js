"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");

/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
//const url = "mongodb://localhost:27017/multiWh"; // local server
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



//var orderIds = ["OR2018071124736" , "OR2018071124744" , "OR2018071124753" , "OR2018071124761" , "OR2018071124816" , "OR2018071124832"];

var orderIds = ["OR20190222249749"];

function runScript() {

    var warehouseDetails = {
        "gstno" : "29AACCL2418A1ZZ",
		"serviceTax" : "123467899998877",
		"vat" : "",
		"cinno" : "U51909KA2012PTC063576"
    };
    var warehouseAddress = {
        "name" : "Bangalore FMCG Warehouse",
		"companyName" : "Localcube Commerce Pvt Ltd.",
		"doorNo" : "No.87/2",
		"street" : "Gerupalya",
		"landmark" : "Next to Chandra Farm",
		"city" : "Kumbalgudu",
		"district" : "Bangalore Rural",
		"state" : "Karnataka",
		"pincode" : "560074",
		"mobile" : "8095188111"
    };
    db.collection("omsmasters").update({ "_id": { "$in": orderIds }, /* "status": "Confirmed" */ }, { "$set": { "source": "WMF1", "warehouseDetails": warehouseDetails, "warehouseAddress": warehouseAddress } }, { "multi": true }, function (err, result) {
        if (err) {
            console.log("Error ;;", err);

        }
        else {
            console.log("SUCCESS-----------------");
            process.exit();
        }

    })//.toArray();
}