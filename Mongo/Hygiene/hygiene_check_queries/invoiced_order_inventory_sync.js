"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');

/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
//const url ="mongodb://10.0.1.102:27017/skstaging";
const folder = "output";


/* --------MONGO CONNECT------ */
Mongoose.connect(url);
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
/********************************************************************************************************************************************/

function runScript() {
    /*  var cursor = db.collection('warehouses').find({ "_id": "WH16775" });
 
     cursor.forEach((wh) => {
 
         console.log("Found wh :", wh);
         process.exit();
 
     }); */

    var cursor = db.collection('warehouses').aggregate([
        {
            "$match": {
                "_id": "WH16775"
            }
        },
        {
            "$project" : {
                "_id"  :1
            }
        }
    ]);

    cursor.forEach(wh => {
        console.log("Found wh :", wh);
        //process.exit();
    });
}