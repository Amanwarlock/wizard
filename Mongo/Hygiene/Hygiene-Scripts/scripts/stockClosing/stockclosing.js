k"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/* Mongo URL */
const liveurl = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const localurl = "mongodb://localhost:27017/report";

var path = "/home/aman/Desktop/stockClosingReport";//__dirname + "/csv_reports";

/* --------MONGO CONNECT------ */
var options = { "useNewUrlParser": true };

var db = null;

/* -----LISTENERS------ */
function initConnection() {
    rl.question(chalker.blue('#. Select Mongo Connection Local or Live ? [ 1 = Local | 2 = Live ]   '), (answer) => {
        if (parseInt(answer) === 1) {
            //chalker.yellow("Mongo url : -------------", localurl);
            Mongoose.connect(localurl, options);
            db = Mongoose.connection;

            db.on('error', function () {
                console.log("Connection Error....");
                process.exit();
            });

            db.once('open', function callback() {
                console.log("Connection established to : ", localurl);
                runScript();
            });

        } else if (parseInt(answer) === 2) {
            // chalker.yellow("Mongo url : -------------", liveurl);
            Mongoose.connect(liveurl, options);
            db = Mongoose.connection;

            db.on('error', function () {
                console.log("Connection Error....");
                process.exit();
            });

            db.once('open', function callback() {
                console.log("Connection established to : ", liveurl);
                runScript();
            });

        } else {
            console.log(chalker.red(`Script Terminated ...................`));
            process.exit();
        }
    });
}

initConnection();

/* Mongoose.connect(localurl, options);
db = Mongoose.connection;

db.on('error', function () {
    console.log("Connection Error....");
    process.exit();
});

db.once('open', function callback() {
    console.log("Connection established to : ", localurl);
    runScript();
}); */


function runScript() {
    console.log("Running Script : --------------------------------------------");
    var params = {};
    async.waterfall([
        _askProductIds(params),
        _getGrn, // IN
        _getCorrections, // IN / OUT
        _getTransfers, // IN / OUT
        _getInvoicedOrders, // OUT , IN = Cancelled;
        _getDistinctWhIds,
        _compute
    ], function (err, result) {
        if (err) {
            chalker.red(console.log("Error Occured:  ", err));
            process.exit();
        } else {
            chalker.green(console.log(`#.Script completed ----------------------------- \n`, result.data));
            chalker.green(console.log(`#.Data ----------------------------- \n`, JSON.stringify(result)));
            process.exit();
        }
    });
}

function _askProductIds(params) {
    return function (callback) {
        rl.question(chalker.blue(`Enter Product Id - `), (answer) => {
            if (answer) {
                params.productId = answer;
                callback(null, params);
            } else {
                callback(new Error(`Product Id cannot be empty`));
            }
        });
    }
}

/*  GRN */
function _getGrn(params, callback) {
    var productId = params.productId;
    db.collection('stockintakes').aggregate([
        {
            $match: {
                status: { $nin: ["Cancelled", "Rejected"] },
                productDetails: {
                    $elemMatch: {
                        productId: productId
                    }
                }
            }
        },
        { $unwind: "$productDetails" },
        {
            $match: {
                "productDetails.productId": productId
            }
        },
        {
            $project: {
                _id: 1,
                status: 1,
                whId: 1,
                productId: "$productDetails.productId",
                quantity: "$productDetails.receivedQuantity",
                mrp: "$productDetails.price.mrp",
                purchasePrice: "$productDetails.price.purchasePrice",

            }
        },
        {
            $group: {
                _id: { productId: "$productId", whId: "$whId" },
                total: { $sum: "$quantity" },
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                productId: "$_id.productId",
                whId: "$_id.whId",
                total: 1,
            }
        }
    ], { allowDiskUse: true }).toArray(function (err, result) {
        if (err)
            callback(err);
        else {
            params.grn = result && result.length ? result : [];
            callback(null, params.productId, params);
        }
    });
}


/* STOCK CORRECTION */
function _getCorrections(productId, params, callback) {
    db.collection('stockadjustments').aggregate([
        {
            $match: {
                status: { $in: ["Approved"] },
                productId: productId
            }
        },
        {
            $project: {
                productId: 1,
                whId: 1,
                quantity: "$changeQtyBy",
                mrp: 1,
                snapshot: 1,
                status: 1,
                createdAt: 1,
                type: {
                    $cond: {
                        if: { $lt: ["$changeQtyBy", 0] },
                        then: 'OUT',
                        else: 'IN'
                    }
                }
            }
        },
        {
            $group: {
                _id: { productId: "$productId", whId: "$whId", type: "$type" },
                total: { $sum: "$quantity" },
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                productId: "$_id.productId",
                whId: "$_id.whId",
                type: "$_id.type",
                total: 1,
                data: 1,
            }
        },
        {
            $group: {
                _id: { productId: "$productId", whId: "$whId" },
                records: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                productId: "$_id.productId",
                whId: "$_id.whId",
                "records.total": 1,
                "records.productId": 1,
                "records.whId": 1,
                "records.type": 1,
                net: {
                    $reduce: {
                        input: "$records",
                        initialValue: 0,
                        in: {
                            $cond: {
                                if: { $eq: ["$$this.type", "IN"] },
                                then: { $sum: ["$$value", "$$this.total"] },
                                else: { $sum: ["$$value", "$$this.total"] }
                            }
                        }
                    }
                }

            }
        }
    ], { allowDiskUse: true }).toArray(function (err, result) {
        if (err)
            callback(err);
        else {
            params.correction = result && result.length ? result : [];
            callback(null, productId, params);
        }
    });
}


/* STOCK TRANSFER */
function _getTransfers(productId, params, callback) {
    db.collection('stocktransfers').aggregate([
        {
            $match: {
                productId: productId,
                status: "Approved"
            }
        },
        {
            $project: {
                productId: 1,
                whId: 1,
                towhId: 1,
                quantity: 1,
                status: 1
            }
        },
        {
            $lookup: {
                from: "stockledgers",
                localField: "_id",
                foreignField: "reference.objectId",
                as: 'ledgers'
            }
        },
        { $unwind: "$ledgers" },
        { $match: { "ledgers.status": "Committed" } },
        {
            $project: {
                productId: 1,
                whId: 1,
                towhId: 1,
                quantity: 1,
                status: 1,
                "ledgers._id": 1,
                "ledgers.productId": 1,
                "ledgers.whId": "$ledgers.warehouseId",
                "ledgers.before": { $add: [{ $arrayElemAt: ["$ledgers.stockTransaction.quantity", 0] }, { $arrayElemAt: ["$ledgers.stockTransaction.onHold", 0] }] },
                "ledgers.after": { $add: [{ $arrayElemAt: ["$ledgers.stockTransaction.quantity", 1] }, { $arrayElemAt: ["$ledgers.stockTransaction.onHold", 1] }] },
            }
        },
        {
            $project: {
                productId: 1,
                whId: 1,
                towhId: 1,
                quantity: 1,
                status: 1,
                ledgers: 1,
                type: {
                    $cond: {
                        if: { $lt: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, 0] },
                        then: 'IN',
                        else: 'OUT'
                    }
                },
                changeQty: {
                    $cond: {
                        if: { $lt: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, 0] },
                        then: { $multiply: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, -1] },
                        else: { $subtract: ["$ledgers.before", "$ledgers.after"] }
                    }
                },

            }
        },
        {
            $group: {
                _id: { productId: "$productId", type: "$type", whId: "$ledgers.whId" },
                total: { $sum: "$changeQty" }
            }
        },
        {
            $project: {
                _id: 0,
                productId: "$_id.productId",
                type: "$_id.type",
                whId: "$_id.whId",
                total: 1
            }
        },
        {
            $group: {
                _id: { productId: "$productId", whId: "$whId" },
                records: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                productId: "$_id.productId",
                whId: "$_id.whId",
                records: 1,
                net: {
                    $reduce: {
                        input: "$records",
                        initialValue: 0,
                        in: {
                            $cond: {
                                if: { $eq: ["$$this.type", "IN"] },
                                then: { $sum: ["$$value", "$$this.total"] },
                                else: { $subtract: ["$$value", "$$this.total"] }
                            }
                        }
                    }
                }
            }
        }
    ], { allowDiskUse: true }).toArray(function (err, result) {
        if (err)
            callback(err);
        else {
            params.transfer = result && result.length ? result : [];
            callback(null, productId, params)
        }
    });
}


function _getInvoicedOrders(productId, params, callback) {
    db.collection('omsmasters').aggregate([{
        $match: {
            paymentStatus: "Paid",
            fulfilledBy: "MPS0",
            subOrders: {
                $elemMatch: {
                    // status: {$nin : ["Cancelled" , "Pending" , "Returned" , "Confirmed" , "Processing"]},
                    invoiced: true,
                    readyForBatching: true,
                    products: {
                        $elemMatch: {
                            id: productId,

                        }
                    }
                }
            }
        },
    }, {
        $project: {
            paymentStatus: 1,
            fulfilledBy: 1,
            status: 1,
            source: 1,
            "subOrders.status": 1,
            "subOrders.invoiced": 1,
            "subOrders.readyForBatching": 1,
            "subOrders.products.id": 1,
            "subOrders.products.quantity": 1
        }
    },
    {
        $unwind: "$subOrders"
    },
    {
        $match: {
            "subOrders.invoiced": true,
            "subOrders.readyForBatching": true,
            "subOrders.products": {
                $elemMatch: {
                    id: productId,

                }
            }
        }
    },
    {
        $unwind: "$subOrders.products"
    },
    {
        $match: {
            "subOrders.invoiced": true,
            "subOrders.readyForBatching": true,
            "subOrders.products.id": productId
        }
    },
    {
        $group: {
            _id: { productId: "$subOrders.products.id", whId: "$source" },
            total: { $sum: "$subOrders.products.quantity" }
        }
    },
    {
        $project: {
            _id: 0,
            productId: "$_id.productId",
            whId: "$_id.whId",
            total: 1,
            type: "OUT",
        }
    }
    ], { allowDiskUse: true }).toArray(function (err, result) {
        if (err)
            callback(err);
        else {
            params.order = result && result.length ? result : [];
            callback(null, productId, params)
        }
    });
}

function _getDistinctWhIds(productId, params, callback) {
    db.collection('warehouses').distinct("whId", { productId: productId }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            params.whIdList = result && result.length ? result : [];
            callback(null, productId, params);
        }
    });
}

function _compute(productId, params, callback) {

    var data = [];

    params.whIdList.map(whId => {
        var closingStock = 0;
        var grn = _.find(params.grn, { whId: whId });
        var correction = _.find(params.correction, { whId: whId });
        var transfer = _.find(params.transfer, { whId: whId });
        var order = _.find(params.order, { whId: whId });

        closingStock += grn && grn.total ? grn.total : 0;

        closingStock += correction && correction.net ? correction.net : 0;

        closingStock += transfer && transfer.net ? transfer.net : 0;

        closingStock -= order && order.total ? order.total : 0;

        data.push({
            productId: productId,
            whId: whId,
            closingStock: closingStock
        });
    });
    params.data = data;
    callback(null, params);

}


function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}`;
            console.log(chalker.yellow("CSV created successfully...-----------------", _path));
            fs.writeFileSync(_path, csv);
        }
    });
}

function checkFolder(path) {
    var isExist = fs.existsSync(path)
    if (!isExist) {
        console.log(chalker.grey("Creating folder ----------------------------------"));
        fs.mkdirSync(path);
    } else {
        //console.log("Folder already there ..skipping..");
    }
}