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



const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/* Mongo URL */
//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const url = "mongodb://localhost:27017/report";


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

function runScript() {
    return new Promise((resolve, reject) => {

        var params = {};

        async.waterfall([
            _askGrnId(params),
            _fetchGrn,
        ], function (err, result) {
            if (err) {
                console.log("Error occured while inserting stock ledger ...........", err);
                reject(err);
                process.exit();
            }
            else {
                console.log("Stock ledger inserted successfully ........", result);
                resolve(result);
                process.exit();
            }

        });

    });
}


function _askGrnId(params) {
    return function (callback) {
        rl.question(`Enter GRN ID : `, (answer) => {
            if (answer) {
                params.grnId = answer;
                callback(null, params);
            } else {
                callback(new Error(`GRN Id is required ......`));
            }
        });
    }
}

function _fetchGrn(params, callback) {
    db.collection('stockintakes').findOne({ _id: params.grnId }, function (err, grn) {
        if (err) {
            callback(err);
        } else if (grn) {

            console.log(chalker.yellow.bold(`GRN ID : ${grn._id} , total products ${grn.productDetails.length}`));

            var skippedProducts = [];

            var queue = async.queue(function (grnProduct, queueCB) {

                //check if ledger is there , if yes skip;

                db.collection('stockledgers').findOne({ productId: grnProduct.productId, "reference.grn": grn._id, status: "Committed" }, function (err, ledger) {
                    if (err) {
                        callback(err);
                    } else if (ledger) {
                        console.log(chalker.green.bold(` [ Ledger entry found for grn - ${grn._id} , product - ${grnProduct.productId} ] , skipping insertion ........ `));
                        queueCB(null);
                    } else {
                        // if not , then find inventory
                        // get current stock , closing and after adding this ledger what it will be, if skipp then add to skip else insert
                        var inventoryPromise = new Promise((resolve, reject) => {
                            _findInventory(grn, grnProduct).then(inv => resolve(inv)).catch(e => reject(e));
                        });

                        var closingPromise = new Promise((resolve, reject) => {
                            _closingRecord(grn, grnProduct).then(data => resolve(data)).catch(e => reject(e));
                        });

                        var inventoryStockPromise = new Promise((resolve, reject) => {
                            _inventoryStock(grn, grnProduct).then(stock => {
                                resolve(stock);
                            }).catch(e => reject(e));
                        });

                        Promise.all([inventoryPromise, closingPromise, inventoryStockPromise]).then(resultList => {

                            var inventory = resultList[0];
                            var closingStock = resultList[1];
                            var inventoryStock = resultList[2];

                            if (inventory) {

                                console.log(chalker.yellow.bold(
                                    `   ANALYSIS :  [ GRN : ${grn._id} | Product Id : ${grnProduct.productId} | quantity : ${grnProduct.receivedQuantity} | whId: ${grn.whId} ]
                                        ---------------------------------------------------------------------------------------------------------------
                                            BEFORE:                                                       AFTER:   
                                                Closing Stock : ${closingStock.closingStock}                  Closing Stock : ${closingStock.closingStock + grnProduct.receivedQuantity}
                                                Inventory Stock : ${inventoryStock.current}         
                                        ---------------------------------------------------------------------------------------------------------------
                                    `
                                ));

                                rl.question(` Do you want to insert ledger record [ Y | N ] ? `, (answer) => {
                                    answer = answer.toString();
                                    answer = answer.toLocaleUpperCase();
                                    if (answer === 'Y') {

                                        _ledgerinsert(params, grn, grnProduct, inventory).then(ledgerRecord => {
                                            var obj = { grn: grn._id, createdAt: new Date, productId: grnProduct.productId, whId: grn.whId, ledgerId: ledgerRecord._id, snapshot: inventory._id, qty: ledgerRecord.requestQty }
                                            db.collection('migrationInserts').findOneAndUpdate({ productId: grnProduct.productId, grn: grn._id, whId: grn.whId }, { $set: obj }, { new: true, upsert: true }, function (err, record) {
                                                if (err) {
                                                    console.log(chalker.red.bold(`Cannot record ledger insert in migration records db for ledger Id : ${ledgerRecord._id}.... `));
                                                    queueCB(err);
                                                } else {
                                                    console.log(chalker.yellow.bold(` \n \n ----------------------Insert for ledger ${ledgerRecord._id} recorded in migrationInserts collection by Id ${record._id}.... \n \n`));
                                                    queueCB();
                                                }
                                            });
                                        }).catch(e => queueCB(e));


                                    } else {
                                        console.log(chalker.blue.bold(`\n \n------------------Skipping ledger insertion for ${grnProduct.productId} , grn : ${grn._id} \n \n`));
                                        skippedProducts.push({
                                            grnId: grn._id,
                                            productId: grnProduct.productId
                                        });
                                        queueCB();
                                    }
                                });

                            } else {
                                console.log(chalker.red.bold(` Inventory not found , skipping .....`));
                                skippedProducts.push({
                                    grnId: grn._id,
                                    productId: grnProduct.productId
                                });
                                queueCB();
                            }


                        }).catch(e => {
                            console.log(chalker.red.bold(` Error `, e));
                            skippedProducts.push({
                                grnId: grn._id,
                                productId: grnProduct.productId
                            });
                            queueCB();
                            //queueCB(e)
                        });

                    }
                })



            });

            queue.push(grn.productDetails, function (err, result) {
                if (err) {
                    queue.tasks = [];
                    callback(err);
                    return;
                }
            });

            queue.drain = () => {
                params.skippedProducts = skippedProducts;
                var bulk = db.collection('skippedMigrationInserts').initializeUnorderedBulkOp();
                params.skippedProducts.map(el => {
                    el.createdAt = new Date();
                    bulk.find({ productId: el.productId, grnId: el.grnId }).upsert().update({ $set: el });

                });

                if (params.skippedProducts && params.skippedProducts.length) {
                    bulk.execute(function (err, result) {
                        if (err)
                            console.log(chalker.red.bold(`Error while inserting skipped migration insert in Collection  skippedMigrationInserts`, err));
                        else {
                            console.log(" \n \n -----------Successfully inserted skipped migration insert in Collection  skippedMigrationInserts------------");
                            callback(null, params);
                        }
                    });
                }else{
                    callback(null, params);
                }

            }

        } else {
            callback(new Error(`No GRN found...`));
        }
    })
}


function _findInventory(grn, product) {
    return new Promise((resolve, reject) => {
        db.collection('warehouses').findOne({ whId: grn.whId, productId: product.productId, barcode: { $in: [product.barcode] }, ref: { $exists: false } }, function (err, inv) {
            if (err) {
                reject(err);
            } else if (inv) {
                console.log(chalker.blue.bold(` Inventory found for inserting record : id - ${inv._id} , createdAt: ${inv.createdAt} , barcode : ${inv.barcode}`));
                resolve(inv);
            } else {
                console.log(chalker.yellow.bold(` Did not find any inventory for ${product.productId} , GRN : ${grn._id}, please manually specify : `));
                resolve(null);
                /*  rl.question(chalker.yellow.bold(` Did not find any inventory for ${product.productId} , GRN : ${grn._id}, please manually specify : `), (answer) => {
                     if (answer && answer !== "") {
                         db.collection('warehouses').findOne({ whId: grn.whId, productId: product.productId, _id: answer }, function (err, inv) {
                             if (err) {
                                 reject(err);
                             } else if (inv) {
                                 console.log(chalker.blue.bold(` Inventory found for inserting record : id - ${inv._id} , createdAt: ${inv.createdAt} , barcode : ${inv.barcode}`));
                                 resolve(inv);
                             } else {
                                 reject(new Error(`No Inventory found ...`));
                             }
                         });
                     } else {
                         console.log(chalker.red.bold(`Invalid entry ......`));
                         return reject(new Error(`No Inventory found ...`))
                     }
                 }); */
            }
        })
    });
}


function _closingRecord(grn, product) {
    return new Promise((resolve, reject) => {
        db.collection('stockledgers').aggregate([
            {
                $match: {
                    productId: product.productId,
                    warehouseId: grn.whId,
                    status: "Committed",
                    referenceType: { $in: ["GRN", "Invoice Cancellation", "Stock Correction", "Stock Movement", "Release"] }, // IN
                }
            },
            {
                $project: {
                    _productId: "$productId",
                    _whId: "$warehouseId",
                    _snapShotId: "$snapShotId",
                    _referenceType: "$referenceType",
                    _requestQty: "$requestQty",
                    _type: {
                        $cond: {
                            if: { $lt: [{ $subtract: [{ $arrayElemAt: ["$stockTransaction.quantity", 0] }, { $arrayElemAt: ["$stockTransaction.quantity", 1] }] }, 0] },
                            then: 'IN',
                            else: 'OUT'
                        }
                    },
                    _before: { $add: [{ $arrayElemAt: ["$stockTransaction.quantity", 0] }, { $arrayElemAt: ["$stockTransaction.onHold", 0] }] },
                    _after: { $add: [{ $arrayElemAt: ["$stockTransaction.quantity", 1] }, { $arrayElemAt: ["$stockTransaction.onHold", 1] }] },
                    _mrp: "$mrp",
                    _createdAt: "$createdAt",
                    _reference: "$reference",
                    _stockTransaction: "$stockTransaction",
                    _position: "$position",
                    _status: "$status",

                }
            },
            {
                "$lookup": {
                    from: "warehouses",
                    localField: "_snapShotId",
                    foreignField: "_id",
                    as: "inventory"
                }
            },
            {
                $project: {
                    _productId: 1,
                    _whId: 1,
                    _snapShotId: 1,
                    _type: 1,
                    _referenceType: 1,
                    _quantity: {
                        $cond: {
                            if: { $lt: [{ $subtract: ["$_before", "$_after"] }, 0] },
                            then: { $multiply: [{ $subtract: ["$_before", "$_after"] }, -1] },
                            else: { $subtract: ["$_before", "$_after"] }
                        }
                    },
                    _mrp: 1,
                    _purchasePrice: { $arrayElemAt: ["$inventory.purchasePrice", 0] },
                    _createdAt: 1,
                    _reference: 1
                }
            }, {
                $group: {
                    _id: { productId: "$_productId", "whId": "$_whId", "type": "$_type",/* snapShotId: "$_snapShotId"*/ },
                    data: { $push: "$$ROOT" },
                    total: { $sum: "$_quantity" },
                    totalPrice: { $sum: { $multiply: ["$_quantity", "$_purchasePrice"] } },
                    totalMrp: { $sum: { $multiply: ["$_quantity", "$_mrp"] } }
                }
            },
            {
                $group: {
                    _id: {
                        productId: "$_id.productId",
                        whId: "$_id.whId",
                    },
                    records: { $push: "$$ROOT" }
                }
            },

            {
                $project: {
                    _id: 0,
                    productId: "$_id.productId",
                    whId: "$_id.whId",
                    snapShotId: "$_id.snapShotId",
                    currentStock: {
                        $reduce: {
                            input: "$records",
                            initialValue: 0,
                            in: {
                                $cond: {
                                    if: { $eq: ["$$this._id.type", "IN"] },
                                    then: { $sum: ["$$value", "$$this.total"] },
                                    else: { $subtract: ["$$value", "$$this.total"] }
                                }
                            }
                        }
                    },
                    records: {
                        $map: {
                            input: "$records",
                            in: {
                                "type": "$$this._id.type",
                                "total": "$$this.total",
                                "totalPrice": "$$this.totalPrice",
                                totalMrp: "$$this.totalMrp"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    productId: 1,
                    whId: 1,
                    closingStock: "$currentStock",
                    records: 1,
                    avgPrice: { $divide: [{ $add: [{ $arrayElemAt: ["$records.totalPrice", 0] }, { $arrayElemAt: ["$records.totalPrice", 1] }] }, { $add: [{ $arrayElemAt: ["$records.total", 0] }, { $arrayElemAt: ["$records.total", 1] }] }] },
                    avgMrp: { $divide: [{ $add: [{ $arrayElemAt: ["$records.totalMrp", 0] }, { $arrayElemAt: ["$records.totalMrp", 1] }] }, { $add: [{ $arrayElemAt: ["$records.total", 0] }, { $arrayElemAt: ["$records.total", 1] }] }] }
                }
            }

        ], { allowDiskUse: true }).toArray(function (err, data) {
            if (err) {
                callback(err);
            } else if (data && data.length) {
                resolve(data[0]);
            } else {
                console.log(chalker.red.bold(`No closing stock data found from ledger ........`));
                reject(new Error(`No closing stock data found from ledger for ${product.productId}........`));
            }
        });
    });
}


function _inventoryStock(grn, product) {
    return new Promise((resolve, reject) => {
        db.collection('warehouses').aggregate([
            {
                $match: {
                    productId: product.productId,
                    whId: grn.whId,
                }
            },
            {
                $group: {
                    _id: { productId: "$productId", whId: "$whId" },
                    qty: { $sum: "$quantity" },
                    onHold: { $sum: "$onHold" }
                }
            },
            {
                $project: {
                    _id: 1,
                    qty: 1,
                    onHold: 1,
                    current: { $sum: ["$qty", "$onHold"] }
                }
            }
        ]).toArray(function (err, data) {
            if (err) {
                reject(err);
            } else if (data && data.length) {
                resolve(data[0]);
            } else {
                reject(new Error(`Could not get current inventory stock for ${product.productId}......`));
            }
        })
    });
}


function _ledgerinsert(params, grn, grnProduct, inventory) {
    return new Promise((resolve, reject) => {

        let randomId = "" + Math.floor(100000 + Math.random() * 900000)
        randomId += inventory._id + grn._id;

        let ledger = {
            "_id": randomId,
            "snapShotId": inventory._id,
            "mrp": inventory.mrp,
            "warehouseId": inventory.whId,
            "productId": inventory.productId,
            "reference": {
                "grn": grn._id
            },
            "referenceType": "GRN",
            "status": "Committed",
            "position": {
                "location": inventory.location,
                "area": inventory.area,
                "whId": inventory.whId,
                "rackId": inventory.rackId,
                "binId": inventory.binId
            },
            "requestQty": grnProduct.receivedQuantity,
            "serialNo": inventory.serialNo && inventory.serialNo.length ? inventory.serialNo : [],
            "barcode": inventory.barcode && inventory.barcode.length ? inventory.barcode : [],
            "stockTransaction": [
                {
                    "_id": inventory._id,
                    "quantity": 0,
                    "onHold": 0,
                    "state": "before"
                },
                {
                    "_id": inventory._id,
                    "quantity": grnProduct.receivedQuantity,
                    "onHold": 0,
                    "state": "after"
                }
            ],
            "log": "Stock clean up",
            "createdBy": "StoreKing",
            "createdAt": inventory.createdAt,
            "deleted": false,
            "manualInsertion": true
        }

        db.collection('stockledgers').insert(ledger, function (err, ledgerRecord) {
            if (err) {
                reject(err);
            } else {
                console.log(chalker.blue.bold(`Inserted ledger entry with Id: ${ledgerRecord.ops[0]._id}`, JSON.stringify(ledgerRecord)));
                ledgerRecord._id = ledgerRecord.ops[0]._id;
                resolve(ledgerRecord);
            }
        });
    });
}