"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');//Generates CSV;

/* ----------------USER INPUTS - DB URI , OUTPUT FOLDER--------------------- */
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
    // TODO: Log the answer in a database
    console.log(`Thank you for your valuable feedback: ${answer}`);

    rl.close();
});

const url = "mongodb://localhost/QA_Bug";
const folder = "output";

/* --------PUTTU CONNECT-------- */
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();

/* --------MONGO CONNECT------ */
Mongoose.connect(url);
var db = Mongoose.connection;

/* -----LISTENERS------ */
db.on('error', function () {
    console.log("Connection Error....");
});

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});
/********************************************************************************************************************************************/



function runScript() {
    console.log("Running script.....");

    var cursor = db.collection('omsmasters').find({ "status": "Cancelled" }, { _id: 1, status: 1 }).limit(2);

    var payload = [];
    const fileName = "test_order.csv";

    var queue = async.queue(function (order, queueCB) {
        if (order) {
            console.log("ORDER ID: ", order._id);
            queueCB(null);
        } else {
            queueCB(new Error("No order found..."));
        }
    });

    queue.drain = function () {
        console.log("Ending cursor...");
        generateFile(payload, fileName);
        process.exit();
    };

    cursor.forEach(function (order, err) {
        if (err)
            console.log("ERROR: ", err);
        else if (order) {
            queue.push(order);
        } else {
            console.log("No order found");
        }
    });
}

/*
    - Payload should be an array ;
    - folder = Global const variable;
 */
function generateFile(payload, fileName) {
    checkFolder();
    jsonexport(payload, function (err, csv) {
        if (csv) {
            var path = `${__dirname}/${folder}/${fileName}`;
            console.log("CSV created successfully...", path);
            fs.writeFileSync(path, csv);
        }
        else {
            console.log("ERROR: Could not generate CSV....");
        }
    });
}

function checkFolder() {
    var path = `${__dirname}/${folder}`;
    var isExist = fs.existsSync(path)
    if (!isExist) {
        console.log("Creating folder");
        fs.mkdirSync(path);
    } else {
        console.log("Folder already there ..skipping..");
    }
}