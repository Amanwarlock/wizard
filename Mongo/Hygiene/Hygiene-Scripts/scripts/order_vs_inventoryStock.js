"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

/* Mongo URL */
//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const url ="mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging"; // SSH TUNNEL TO LIVE
//const url ="mongodb://10.0.1.102:27017/skstaging";
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
/********************************************************************************************************************************************/

function runScript() {
    console.log(chalker.green("#.Script Started : ........................."));
    var date = "01-08-2018";//For NOW DD-MM-YY  // MM-DD-YYYY //ISODate("2018-04-30T18:30:59.000+05:30") - April 30-04-18 : 11:59 pm; midnight;
    /*
        1. Get all snapshotIds which are GRNED from stock ledger;
        2. Get all inventories by snapshot Id - fields - quantity , onHold , ref.grn;
        3. Get reserved and invoiced count from orders by those snapshot ids;
        4. Tally and identify the corruped data; 
     */
    async.waterfall([
        _snapShotIds(date),//Get recent by date grn snapshots from stock ledger;
        _fetchInventories,// Get inventories data by the inventoryId;
        _orderStockCount,// Get invoiced and reserved qty against orders for those inventory ids,
        _heuristics // Compare the reserved qty, invoiced qty and intaked qty ; Alert the mismatched;prepare report;
    ], function (err, result) {
        if (err) {
            console.log("#.Error Occured while running the script ", err);
        }
        console.log(chalker.green("#.Script Ended : ........................."), path);
        process.exit();
    });
}

/* Step.1 */
function _snapShotIds(date) {
    return function (callback) {
        //  var _date = new Date(date)
        var _date = moment(new Date(date)).format("DD-MM-YYYY"); //ISODate("2018-04-30T18:30:59.000+05:30")
        _date = new Date(_date);
        console.log("From Date is : ", _date.toString() /* , moment(_date).format("DD-MMM-YYYY") */);

        db.collection("stockledgers").aggregate([
            {
                "$match": {
                    "referenceType": { $in: ["GRN", "Stock Movement"] }, "createdAt": { "$gt": _date },
                    "position.location": { "$eq": "Normal" }
                }
            },
            {
                "$group": { "_id": "$snapShotId", "GRNID": { "$first": "$reference.grn" }, "grnQty": { "$first": "$requestQty" }, "createdAt": { "$first": "$createdAt" }, "whId": { "$first": "$warehouseId" } }
            }
        ]).toArray(function (err, result) {
            if (err) {
                console.log("Error _snapShotIds : ", err);
                callback(err);
            } else {
                var params = {
                    "Date": moment(new Date(date)).format("DD-MM-YYYY"),
                    "ledgerInventoryData": result,
                    "snapShotIds": result.map(el => el._id)
                }
                callback(null, params);
            }
        });
    }
}


/* Step:2 */
function _fetchInventories(params, callback) {
    var select = { "_id": 1, "quantity": 1, "onHold": 1, "ref.grn": 1, "createdAt": 1, "whId": 1, productId : 1 };
    db.collection("warehouses").find({ "_id": { "$in": params.snapShotIds } })
        .project(select).limit(params.snapShotIds.length).toArray(function (err, snapShots) {
            if (err) {
                callback(err);
            } else {
                params.snapShots = snapShots;
                callback(null, params);
            }
        });
}

/* Step:3 */
function _orderStockCount(params, callback) {
    db.collection("omsmasters").aggregate([
        {
            "$match": {
                // "paymentStatus": "Paid",
                "subOrders": {
                    "$elemMatch": {
                        "status": { "$nin": ["Cancelled"] },
                        "snapshots": { "$elemMatch": { "snapShotId": { "$in": params.snapShotIds }, "quantity": { "$gt": 0 } } }
                    }
                }
            }
        },
        { "$unwind": "$subOrders" },
        {
            "$match": {
                "subOrders.status": { "$nin": ["Cancelled"] },
                "subOrders.snapshots": { "$elemMatch": { "snapShotId": { "$in": params.snapShotIds }, "quantity": { "$gt": 0 } } }
            }
        },
        { "$unwind": "$subOrders.snapshots" },
        {
            "$match": {
                "subOrders.snapshots.snapShotId": { "$in": params.snapShotIds },
                "subOrders.snapshots.quantity": { "$gt": 0 }
            }
        },
        {
            "$project": {
                "_id": 1,
                "subOrders._id": 1,
                "subOrders.invoiced": 1,
                "subOrders.performaInvoiceNo": 1,
                "subOrders.batchId": 1,
                "subOrders.snapshots.snapShotId": 1,
                "subOrders.snapshots.productId": 1,
                "subOrders.snapshots.quantity": 1
            }
        },
        {
            "$group": {
                "_id": {
                    "snapShotId": "$subOrders.snapshots.snapShotId",
                    "isInvoiced": "$subOrders.invoiced"
                },
                "stockQty": { "$sum": "$subOrders.snapshots.quantity" },
                "productId": { "$first": "$subOrders.snapshots.productId" },
                "subOrderIds": { "$addToSet": "$subOrders._id" },
            }
        },
        {
            "$project": {
                "_id": 0,
                "snapShotId": "$_id.snapShotId",
                "isInvoiced": "$_id.isInvoiced",
                "stockQty": 1,
                "productId": 1,
                "subOrderIds": 1
            }
        }
    ]).toArray(function (err, orders) {
        if (err) {
            callback(err);
        } else {
            params.orders = orders;
            callback(null, params);
        }
    });
}

/* Step:4 */
function _heuristics(params, callback) {
    /*
        params = {
            "ledgerInventoryData" : [],
            "snapShotIds" : [],
            "snapShots" : [],
            "orders" : [],
    
        }
     */

    var onHoldMismatch = [];
    var availableMismatch = [];
    var releaseMismatch = [];
    var corruptedInventories = [];

    //params.ledgerInventoryData = _.sample(params.ledgerInventoryData , 4); //Get 4 random elements from array;
    // params.ledgerInventoryData = params.ledgerInventoryData.slice(0, 4);//Get only starting 4 elements;

    params.ledgerInventoryData.map(ledger => {

        var stockIntaken = ledger.grnQty;
        var grnId = ledger.GRNID;
        var snapShotId = ledger._id;
        var whId = ledger.whId;
        //  var snapShots = params.snapShots;

        var inventory = _.find(params.snapShots, { "_id": snapShotId });

        var orderData = params.orders.filter(o => o.snapShotId === snapShotId);//_.filter(params.orders, { "_id.snapShotId": snapShotId });

        if (inventory && orderData && orderData.length) {
            //From order
            var invoicedOrder = _.find(orderData, { "isInvoiced": true });
            var reservedOrder = _.find(orderData, { "isInvoiced": false });
            //From order
            var invoicedStock = invoicedOrder ? invoicedOrder.stockQty : 0;
            var reservedStock = reservedOrder ? reservedOrder.stockQty : 0;

            //Check if inventories onHold stock === stock reserved against orders;
            if (inventory.onHold !== reservedStock) {
                onHoldMismatch.push({
                    ["Inventory Id"]: snapShotId,
                    ["Warehouse"]: inventory.whId,
                    ["productId"]: inventory.productId,
                    ["GRN ID"]: grnId,
                    ["Stock Intaken"]: stockIntaken,
                    ["Inventory Qty"]: inventory.quantity,
                    ["Inventory onHold"]: inventory.onHold,
                    ["Order Reserved Qty"]: reservedStock,
                    ["Order Invoiced Qty"]: invoicedStock,
                    ["Inventory Created At"]: inventory.createdAt,
                    ["Mismatch Type"]: "OnHold Qty Mismatch"
                });
            }

            //Check for the inventory available stock is correct;
            var expectedAvailableQty = stockIntaken - (reservedStock + invoicedStock);
            if (expectedAvailableQty !== inventory.quantity) {
                availableMismatch.push({
                    ["Inventory Id"]: snapShotId,
                    ["Warehouse"]: inventory.whId,
                    ["productId"]: inventory.productId,
                    ["GRN ID"]: grnId,
                    ["Stock Intaken"]: stockIntaken,
                    ["Expected Inventory Qty"]: expectedAvailableQty,
                    ["Inventory Qty"]: inventory.quantity,
                    ["Inventory onHold"]: inventory.onHold,
                    ["Order Reserved Qty"]: reservedStock,
                    ["Order Invoiced Qty"]: invoicedStock,
                    ["Inventory Created At"]: inventory.createdAt,
                    ["Mismatch Type"]: "Available Qty Mismatch"
                });
            };

            //Check for release qty mismatch;
            var inventoryStocks = (inventory.onHold + inventory.quantity + invoicedStock);
            if (stockIntaken !== inventoryStocks) {
                releaseMismatch.push({
                    ["Inventory Id"]: snapShotId,
                    ["Warehouse"]: inventory.whId,
                    ["productId"]: inventory.productId,
                    ["GRN ID"]: grnId,
                    ["Stock Intaken"]: stockIntaken,
                    ["Inventory Qty"]: inventory.quantity,
                    ["Inventory onHold"]: inventory.onHold,
                    ["Order Reserved Qty"]: reservedStock,
                    ["Order Invoiced Qty"]: invoicedStock,
                    ["Actual Release Stocks"]: inventoryStocks,
                    ["Inventory Created At"]: inventory.createdAt
                });
            }
        }
    });


    if (onHoldMismatch && onHoldMismatch.length) {
        let fileName = `${new Date()}_onHoldMismatch_Report.csv`;
        generateFile(fileName, onHoldMismatch);
    }

    if (availableMismatch && availableMismatch.length) {
        let fileName = `${new Date()}_availableQuantityMismatch_Report.csv`;
        // generateFile(fileName, onHoldMismatch);
    }

    if (releaseMismatch && releaseMismatch.length) {
        let fileName = `${new Date()}_releaseMismatch_Report.csv`;
        //generateFile(fileName, onHoldMismatch);
    }

    callback(null, params);
}

function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}`;
            console.log(chalker.yellow("CSV created successfully...", _path));
            fs.writeFileSync(_path, csv);
        }
    });
}

function checkFolder(path) {
    //var path = `${__dirname}/${folder}`;
    var isExist = fs.existsSync(path)
    if (!isExist) {
        console.log("Creating folder");
        fs.mkdirSync(path);
    } else {
        //console.log("Folder already there ..skipping..");
    }
}

/*
Run : /work/wizard/Mongo/Hygiene/Hygiene-Scripts/scripts : node order_vs_inventoryStock.js

*/