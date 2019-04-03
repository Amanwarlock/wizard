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


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function _askQuestion() {
    return function (callback) {
        rl.question('Enter Inventory Id to get scanned Imeis ?', (answer) => {
            // TODO: Log the answer in a database
            console.log(`Thank you ....: ${answer}`);
            callback(null, answer.toString());
            rl.close();
        });
    }
}


/* -----------------------------------------------------------------[ SCRIPT ]----------------------------------------------------------------------------- */


function runScript() {
    console.log(chalker.blue.bold("#. Inventory Sync script started ........................................................................."));
    async.waterfall([
        _askOrSkipWhIdQuestion(),
        _askOrSkipInventoryIds,
        _heuristics
    ], function (err, result) {
        if (err) {
            console.log(chalker.red.bold(`#.SCRIPT TERMINATED : ------------------------------- `, err.message));
            process.exit();
        } else {
            console.log(chalker.green.bold(`#.SCRIPT Completed : -------------------------------`, result));
            process.exit();
        }
    });
}


function _askOrSkipWhIdQuestion() {
    return function (callback) {
        var params = {};
        //If global whId field ID is not there , then ask to enter from console;
        if (!whId) {
            rl.question(chalker.yellow.bold('Enter warehouse Id ? '), (answer) => {
                params.whId = answer.toString();
                params.whId = params.whId.toLocaleUpperCase();
                console.log(chalker.green.bold(`warehouse Id : ${params.whId}`));
                callback(null, params);
            });
        } else {
            rl.question(chalker.yellow.bold(`Entered warehouse Id --> ${whId}  . Do you want to continue ? [Y/N] `), (answer) => {
                console.log(chalker.green.bold(`warehouse Id : ${whId}`));
                answer = answer.toString();
                answer = answer.toLocaleUpperCase();
                if (answer === 'Y') {
                    params.whId = whId;
                    callback(null, params);
                } else {
                    callback(new Error(`Terminated`));
                }
            });
        }
    }
}

function _askOrSkipInventoryIds(params, callback) {
    if (!inventoryIds || !inventoryIds.length) {
        rl.question(chalker.yellow.bold('Enter Inventory Ids ? [Coma or space separated]  \n'), (answer) => {
            var inventoryIds = parseInventoryIds(answer.toString());
            console.log("Inventory Ids length : ", inventoryIds ? inventoryIds.length : NaN);
            console.log(chalker.blue.bold(`Inventory Ids : `, inventoryIds));

            params.totalIterations = inventoryIds ? inventoryIds.length : 0;
            params.remainingIterations = 0;

            rl.question(chalker.green.bold(`Confirm Inventory Ids ? [Y/N] `), (answer) => {
                answer = answer.toString();
                answer = answer.toLocaleUpperCase();
                if (answer === 'Y') {
                    params.inventoryIds = inventoryIds;
                    callback(null, params);
                } else {
                    callback(new Error(`Terminated`));
                }
            });
        });
    } else {

    }
}

function parseInventoryIds(input) {

    if (Array.isArray(input)) {
        input = input.join(",");
    }

    input = input.split(",");
    // Split by coma first
    input.map((el, index) => {
        el = el.trim();
        if (el) {
            var elem = el.split(" ");
            if (elem.length > 1) {
                input.splice(index, 1);
                input = input.concat(elem);
            }
        }
    });
    // Eliminate white spaces (empty spaces ) and unrecognized input;
    input.map((el, index) => {
        if (!el.trim() || !(el.match(new RegExp("WH", "g")) || []).length) {
            input.splice(index, 1);
        }

    });

    input.map((el, index) => {
        // Eliminate white spaces;
        var el = el.replace(/\s/g, '');
        input.splice(index, 1, el);
        // Check for multilpe occurences of 'O' and then split those as they are separate order ids joined together;
        if ((el.match(new RegExp("WH", "g")) || []).length > 1) {
            var positions = []; // Positions of multiple occurences;
            var elem = "";
            for (var i = 0; i < el.length; i++) {
                if (el[i] === 'W') {
                    positions.push(i);
                }

                if (el[i].trim()) {
                    if (i != 0 && el[i] === 'W') {
                        elem += `,${el[i]}`
                    } else {
                        elem += el[i];
                    }
                }
            }
            elem = elem.split(",").filter(Boolean);
            input.splice(index, 1);
            input = input.concat(elem);
        }
    });

    input = _.uniq(input);
    input = input.filter(Boolean)

    return input;
}

function _heuristics(params, callback) {
    var _whId = params.whId;
    var _inventoryIds = params.inventoryIds;

    if (!_inventoryIds || !_inventoryIds.length) {
        callback(new Error("Inventory Ids not provided as input.."));
        return;
    }

    var queue = async.queue((snapShotId, queueCB) => {
        // Get Order onHold and Invoiced;
        // Get snapshot
        // Get total Intaken from ledger;
        // Get stock correction qty from ledger;
        // compare and correct and update;

        //Get Order onHold and Invoiced;
        var orderPromise = getOrderedQuantity(snapShotId).catch(e => queueCB(e)); // Order onHold and Invoiced quantities;
        var snapShot = getSnapShot(snapShotId).catch(e => queueCB(e)); // Inventory / Snapshot to be corrected;
        var intakenLedger = getIntakenLedger(snapShotId).catch(e => queueCB(e)); // Ledger entry to find Intaken units;
        var correctionLedger = getCorrectionLedger(snapShotId).catch(e => queueCB(e)); // Ledger entry to find total corrections if any;

        Promise.all([orderPromise, snapShot, intakenLedger, correctionLedger]).then(resultArr => {

            if (!resultArr || !resultArr.length) {
                queueCB(new Error(`Could not get heuristic data for snapshot ${snapShotId}`));
            }

            var orderData = resultArr[0];
            var snapShot = resultArr[1];
            var intakenLedger = resultArr[2];
            var correctionLedger = resultArr[3];

            var orderOnHold = orderData ? orderData.onHold : 0; // OnHOld from orders - reserved against orders;
            var invoicedQty = orderData ? orderData.invoiced : 0; // Invoiced qty;
            var intakenQty = intakenLedger ? intakenLedger.requestQty : 0; // GRN or intaken QTy;
            var correctedQty = correctionLedger ? correctionLedger.correctedQty : 0;
            var correctionEntries = correctionLedger ? correctionLedger.totalEntries : 0;

            var netIntaken = intakenQty + correctedQty//After deducting corrections if any;

            var suggestion = {
                quantity: netIntaken - invoicedQty - orderOnHold,
                onHold: netIntaken - invoicedQty - (netIntaken - invoicedQty - orderOnHold),
                Net_Intaken: 0,// Quantity + onHold + Invoiced;
                Message: "",
                isMismatch: true
            };

            if (suggestion.quantity < 0) {
                suggestion.quantity = 0;
            }

            if (suggestion.onHold < 0) {
                suggestion.onHold = 0;
            }

            if (suggestion.quantity === snapShot.quantity && suggestion.onHold === snapShot.onHold) {
                suggestion.Message = chalker.greenBright.bold(` " NO MISMATCH " `);
                suggestion.isMismatch = false;
            } else {
                suggestion.isMismatch = true;
                suggestion.Message = chalker.redBright.bold(` " MISMATCH DETECTED ! "`);
            }

            suggestion['Net_Intaken'] = suggestion.quantity + suggestion.onHold + invoicedQty; // Quantity + onHold + Invoiced;

            console.log(chalker.blue.bold(
                `---------------------------------------------------------------------------------------------------------
                {
                    CURRENT INVENTORY: [ WHID: ${_whId} / SnapShot : ${snapShot._id} / Quantity : ${snapShot.quantity} / onHold : ${snapShot.onHold} / serialNo's : ${snapShot.serialNo.length} / scanned Serial No's : ${snapShot.scannedSerialNo.length} ]
                    HEURISTICS: [ WHID: ${_whId} / SnapShot : ${snapShot._id} / Intaken : ${intakenQty} [ Net : ${netIntaken} ] / corrected : ${correctedQty} / Order-onHold : ${orderOnHold} / Invoiced = ${invoicedQty} ]
                    SUGGESTION: [ WHID: ${_whId} / SnapShot : ${snapShot._id} / Quantity : ${suggestion.quantity} / onHold : ${suggestion.onHold} / Arrived Intaken (qty+onHold+invoiced) : ${suggestion['Net_Intaken']} ]
                    MESSAGE : ${suggestion.Message}
                }
                ---------------------------------------------------------------------------------------------------------
                `
            ));

            // What if inTaken qty is not available or zero;
            if (intakenQty) {
                // Do correction logic;
                console.log("Update : ", autoUpdate);
                if (!autoUpdate) {
                    if (suggestion.isMismatch) {

                        rl.question(chalker.green.bold(`Update Suggested Heuristics for ${snapShotId} ? [Y/N/E] [E = Enter Inputs] `), (answer) => {
                            answer = answer.toString();
                            answer = answer.toLocaleUpperCase();
                            if (answer === 'Y') {
                                updateInventory(snapShotId, suggestion.quantity, suggestion.onHold).then(result => {
                                    queueCB(null);
                                }).catch(e => queueCB(e));
                            } else if (answer === 'E') {
                                rl.question(`Enter Quantity to be updated = `, (qty) => {
                                    qty = qty.toString();
                                    qty = parseInt(qty);
                                    rl.question(`Enter onHold to be updated = `, (onHold) => {
                                        onHold = onHold.toString();
                                        onHold = parseInt(onHold);
                                        updateInventory(snapShotId, qty, onHold).then(result => {
                                            queueCB(null);
                                        }).catch(e => queueCB(e));
                                    });
                                });
                            } else {
                                queueCB(new Error(`skipped auto update`));
                            }
                        });

                    } else {

                        rl.question(chalker.green.bold(`No Mismatch Found , Do you want to proceed ? [Y/E] [E = Enter inputs] `), (answer) => {
                            answer = answer.toString();
                            answer = answer.toLocaleUpperCase();
                            if (answer === 'Y') {
                                queueCB(null);
                            } else if (answer === 'E') {
                                rl.question(`Enter Quantity to be updated = `, (qty) => {
                                    qty = qty.toString();
                                    qty = parseInt(qty);
                                    rl.question(`Enter onHold to be updated = `, (onHold) => {
                                        onHold = onHold.toString();
                                        onHold = parseInt(onHold);
                                        updateInventory(snapShotId, qty, onHold).then(result => {
                                            queueCB(null);
                                        }).catch(e => queueCB(e));
                                    });
                                });
                            } else {
                                queueCB(null);
                            }
                        });
                    }


                } else {
                    queueCB(null);
                }
            } else {
                queueCB(new Error(`No Intaken Quantity found for ${snapShotId}`));
            }

        }).catch(e => queueCB(e));
    });

    queue.push(_inventoryIds, (e, result) => {
        if (e) {
            console.log("Error in heuristics : ", e.message);
        }
        //params.totalIterations , params.remainingIterations
        params.remainingIterations += 1;
        console.log(chalker.cyanBright.bold(` \n \n  ::::::::::: [PROGRESS] ::::::::::: : ${params.totalIterations} / ${params.remainingIterations}  \n \n`));
    });

    queue.drain = function () {
        callback(null);
    }

}


function getSnapShot(snapShotId) {
    return new Promise((resolve, reject) => {
        var select = { "_id": 1, "quantity": 1, "onHold": 1, "ref": 1, "createdAt": 1, "whId": 1 ,"serialNo": 1 , "scannedSerialNo":1};
        db.collection("warehouses").find({ "_id": { "$in": [snapShotId] } })
            .project(select).limit(1).toArray(function (err, snapShots) {
                if (err) {
                    reject(err);
                } else if (snapShots && snapShots.length) {
                    resolve(snapShots[0]);
                } else {
                    reject(new Error(`Could not get snapshot for id ${snapShotId}`));
                }
            });
    });
}

function getOrderedQuantity(snapShotId) {
    return new Promise((resolve, reject) => {
        db.collection("omsmasters").aggregate([
            {
                "$match": {
                    // "paymentStatus": "Paid",
                    "subOrders": {
                        "$elemMatch": {
                            "status": { "$nin": ["Cancelled"] },
                            "snapshots": { "$elemMatch": { "snapShotId": { "$in": [snapShotId] }, "quantity": { "$gt": 0 } } }
                        }
                    }
                }
            },
            { "$unwind": "$subOrders" },
            {
                "$match": {
                    "subOrders.status": { "$nin": ["Cancelled"] },
                    "subOrders.snapshots": { "$elemMatch": { "snapShotId": { "$in": [snapShotId] }, "quantity": { "$gt": 0 } } }
                }
            },
            { "$unwind": "$subOrders.snapshots" },
            {
                "$match": {
                    "subOrders.snapshots.snapShotId": { "$in": [snapShotId] },
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
                reject(err);
            } else if (orders && orders.length) {
                var invoiceData = _.find(orders, { "isInvoiced": true });
                var onHoldData = _.find(orders, { "isInvoiced": false });
                var invoicedQty = invoiceData ? invoiceData.stockQty : 0;
                var onHoldQty = onHoldData ? onHoldData.stockQty : 0;
                var data = { "onHold": onHoldQty, "invoiced": invoicedQty };
                resolve(data);
            } else {
                reject(new Error(`Could not find order onHold and invoiced quantities...`));
            }
        });
    });
}

function getIntakenLedger(snapShotId) {
    return new Promise((resolve, reject) => {
        var inTakeTypes = ["GRN", "Stock Correction", "Stock Movement"];
        db.collection("stockledgers").find({ "snapShotId": { "$in": [snapShotId] }, "referenceType": { $in: inTakeTypes }, requestQty: { $gt: 0 }, status: "Committed" }).sort({ createdAt: 1 }).limit(1).toArray(function (err, ledgers) {
            if (err) {
                reject(err);
            } else if (ledgers && ledgers.length) {
                resolve(ledgers[0]);
            } else {
                reject(new Error(`Could not get ledger for intake for  id ${snapShotId}`));
            }
        });
    });
}


function getCorrectionLedger(snapShotId) {
    return new Promise((resolve, reject) => {
        db.collection("stockledgers").aggregate([
            {
                $match: {
                    "snapShotId": snapShotId,
                    "referenceType": "Stock Correction",
                    "requestQty": { $lt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    correctedQty: { $sum: "$requestQty" },
                    totalEntries: { $sum: 1 }
                }
            }
        ]).toArray((err, result) => {
            if (err) {
                reject(err);
            } else {
                var correctedQty = result && result.length ? result[0].correctedQty : 0;
                var totalEntries = result && result.length ? result[0].totalEntries : 0;
                resolve({ "correctedQty": correctedQty, "totalEntries": totalEntries });
            }
        })
    });
}

function updateInventory(snapShotId, quantity, onHold) {
    return new Promise((resolve, reject) => {
        var setter = {};

        if (quantity !== undefined || quantity !== null) {
            setter.quantity = quantity;
        }
        if (onHold !== undefined || onHold !== null) {
            setter.onHold = onHold;
        }

        console.log(chalker.black.bold(`UPDATING : Inventory ${snapShotId} as : [ ${JSON.stringify(setter)} ]`));

        if (!_.isEmpty(setter)) {

            db.collection("warehouses").findOneAndUpdate({ _id: snapShotId }, { $set: setter }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });

        } else {
            reject(new Error(`Could not update inventory ${snapShotId}`));
        }

    });
};

/* ||||||||||||||||||||||||||||||||||||||||||||||||-------------[ INPUT PANEL ]--------------------|||||||||||||||||||||||||||||||||||||||||||||||||||||| */

const inventoryIds = [];

const whId = null;

const autoUpdate = false;
/* ||||||||||||||||||||||||||||||||||||||||||||||||-------------[ END ]--------------------|||||||||||||||||||||||||||||||||||||||||||||||||||||| */


/* 
WH31126
WH31009
WH28491
WH28419
WH28418

WH28410
WH29725
WH29394
WH29839 

*/