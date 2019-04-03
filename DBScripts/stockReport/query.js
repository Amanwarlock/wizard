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

const db = Mongoose.connection;

const collectionName = 'dailyStockSummary';

/* 
    Sample Product Id = PR16711 [WMF0 , WMF4]
    This function runs from begining
*/
function run() {
    return new Promise((resolve, reject) => {

        const endYear = 2018;
        const endMonth = 4;
        const endDay = 11;

        var params = { endYear: endYear, endMonth: endMonth, endDay: endDay };

        var yearsList = getYearsToIterate(endYear);

        console.log("Years List : ---------", yearsList);

        //Iterate years;
        var queue = async.queue(function (year, queueCB) {
            console.log(chalker.blue.bold("#.Iterating Year  : ", year));
            iterateMonths(year, params).then(() => {
                queueCB();
            }).catch(e => {
                queueCB(e);
            });
        });

        queue.push(yearsList, function (err, result) {
            if (err) {
                console.error("Iterating years , error occured .....", err);
            }
        });

        queue.drain = function () {
            resolve();
        }

    });
}

/* 
    End year , month and day are taken by parameter;
*/
function triggerByRange(endYear, endMonth, endDay) {
    return new Promise((resolve, reject) => {

        var params = { endYear: endYear, endMonth: endMonth, endDay: endDay };

        var yearsList = getYearsToIterate(endYear);

        console.log("Years List : ---------", yearsList);

        //Iterate years;
        var queue = async.queue(function (year, queueCB) {

            console.log(chalker.blue.bold("#.Iterating Year  : ", year));

            iterateMonths(year, params).then(() => {
                queueCB();
            }).catch(e => {
                queueCB(e);
            });
        });

        queue.push(yearsList, function (err, result) {
            if (err) {
                console.error("Iterating years , error occured .....", err);
            }
        });

        queue.drain = function () {
            resolve();
        }

    });
}

/**
 * 0 - January , 1-february , 2-march
 */
function iterateMonths(year, params) {
    return new Promise((resolve, reject) => {

        var monthsList = getMonthsToIterate(year, params.endYear, params.endMonth);
        console.log("Months List ----", monthsList);

        var queue = async.queue(function (month, queueCB) {
            console.log(chalker.yellow.green.bold("#.Iterating month  : ", month, getMonthName(month), year));
            iterateDays(year, month, params).then(data => {
                queueCB(null);
            }).catch(e => {
                queueCB(e);
            })
        });

        queue.push(monthsList, function (err, data) {
            if (err) {
                console.error(`Error occured while iterating months ---`, err);
                queue.tasks = [];
                reject(err);
            }
        });

        queue.drain = function () {
            resolve();
        }

    });
}

function iterateDays(year, month, params) {
    return new Promise((resolve, reject) => {

        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth();

        let day = 0;

        if (currentYear === year && currentMonth === month) {
            day = new Date().getDate();
        } else {
            day = getDaysInMonth(month, year);
        }

        function shouldStop(_day) {

            if (!params) return false;

            if (params && params.endYear === year && params.endMonth === month && _day < params.endDay) {
                return true;
            }

            return false;
        }

        async.whilst(
            function () {
                console.log("-------------------------------Should Stop ? ", shouldStop(day));
                return day && day > 0 && !shouldStop(day);
            },
            function (callback) {

                var date = new Date(year, month, day, 23, 59, 59, 999); // End of the day;
                let params = { month: month, year: year, day: day };

                console.log(chalker.yellow.bold(`#.Iterating day - ${day} : [ Query Date : ${date.toISOString()} / Day : ${day} / Month : ${getMonthName(month)} / Year : ${year} ]`));

                /*  METHOD - 1
               
                // The report is grouped by productId and WHID - PR16711;
                bulkGetClosingStockData(date).then(data => {
                    if (data && data.length) {
                        console.log(chalker.blue(`Stock report found , proceeding with insertion ........[ Date : ${date.toISOString()} / Day : ${day} / Month : ${getMonthName(month)} / Year : ${year} ]`));
                        recordsInsertion(data, date, params).then(() => {
                            day--;
                            callback(null, data);
                        }).catch(e => {
                            day = -1;
                            callback(e);
                        });
                    } else { // Proceed with next day;
                        day--;
                        callback(null, data);
                    }
                }).catch(e => {
                    day = -1;
                    callback(e);
                }); 
                
                */


                // METHOD - 2

                recordInsertion_V2(date, params).then(() => {
                    //Proceed with next day;
                    day--;
                    callback(null);
                }).catch(e => {
                    day = -1;
                    callback(e);
                });



            },
            function (e, result) {
                if (e) {
                    reject(e);
                } else {
                    console.log(chalker.magentaBright.bold(`CB of whilst is called on end of month .........${day} ${month} ${getMonthName(month)} ${year}`));
                    resolve();
                }
            }
        );

    });
}


function bulkGetClosingStockData(date, productId, whId, params) {
    return new Promise((resolve, reject) => {
        if (productId && whId) {
            db.collection('stockledgers').aggregate([
                {
                    $match: {
                        productId: productId,
                        warehouseId: whId,
                        createdAt: { $lte: date },
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

            ], { allowDiskUse: true }).toArray((err, data) => {
                if (err)
                    reject(err)
                else if (data && data.length)
                    resolve(data);
                else
                    resolve([]);
            });
        }
        else if (productId) {
            // productId: "PR16711",
            db.collection('stockledgers').aggregate([
                {
                    $match: {
                        productId: productId,
                        createdAt: { $lte: date },
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

            ], { allowDiskUse: true }).toArray((err, data) => {
                if (err)
                    reject(err)
                else if (data && data.length)
                    resolve(data);
                else
                    resolve([]);
            });
        } else {
            db.collection('stockledgers').aggregate([
                {
                    $match: {
                        createdAt: { $lte: date },
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

            ], { allowDiskUse: true }).toArray((err, data) => {
                if (err)
                    reject(err)
                else if (data && data.length)
                    resolve(data);
                else
                    resolve([]);
            });
        }
    });
}

/* 
    - In data , records are grouped by ProductId and whId,
    - for each record find latest mrp and purchase price;
    - Also if GST is not there then default is null and if its defined 0 then only its 0;
*/
function recordsInsertion(data, date, params) {
    return new Promise((resolve, reject) => {

        if (!data && !data.length) {
            resolve();
        }

        var errorList = [];

        var queue = async.queue(function (record, queueCB) {

            const inRecord = _.find(record.records, { type: 'IN' });
            const outRecord = _.find(record.records, { type: 'OUT' });

            let entry = {
                productId: record.productId,
                whId: record.whId,
                in: inRecord && inRecord.total ? inRecord.total : 0, // cumulative until given date;
                out: outRecord && outRecord.total ? outRecord.total : 0, // cumulative until given date;
                openingStock: 0,
                closingStock: record.closingStock, // cumulative until given date;
                avgMrp: record.avgMrp ? parseFloat(record.avgMrp.toFixed(2)) : 0,
                avgPurchasePrice: record.avgPrice ? parseFloat(record.avgPrice.toFixed(2)) : 0,
                latestMrp: 0,
                latestPurchasePrice: 0,
                lastTransactionDate: 0,
                gst: null,
                createdAt: new Date(),
                queryDate: date,
                month: params.month + 1,
                year: params.year,
                day: params.day
            }
            // #.Get opening stock
            var openingStockPromise = new Promise((resolve, reject) => {
                var startDate = getstartOfDay(params.year, params.month, params.day);
                bulkGetClosingStockData(startDate, record.productId, record.whId).then(result => {
                    if (result && result.length) {
                        entry.openingStock = result[0].closingStock;
                        resolve();
                    } else {
                        resolve();
                    }
                }).catch(e => console.error(`Error on fetching opening stock for ${date} with starting as ${startDate} `, e.message));
            });

            // #. Get latest mrp , purchase price;
            var latestSnapShotPromise = new Promise((resolve, reject) => {
                db.collection('warehouses').findOne({ productId: record.productId, whId: record.whId }, { purchasePrice: 1, mrp: 1, productId: 1, whId: 1, _id: 1 }, function (err, inventory) {
                    if (err) {
                        console.error(`Error on fetching latest mrp and price ..`, err.message);
                        resolve()
                    } else if (inventory) {
                        entry.latestMrp = inventory.mrp ? parseFloat(inventory.mrp.toFixed(2)) : 0;
                        entry.latestPurchasePrice = inventory.purchasePrice ? parseFloat(inventory.purchasePrice.toFixed(2)) : 0;
                        resolve();
                    } else {
                        resolve();
                    }
                });
            });

            Promise.all([openingStockPromise, latestSnapShotPromise]).then(result => {
                db.collection(collectionName).findOneAndUpdate({ productId: record.productId, whId: record.whId, queryDate: date }, { $set: entry }, { upsert: true, new: true }, function (err, doc) {
                    if (err) {
                        errorList.push(err);
                        queueCB(err);
                    } else {
                        queueCB(null);
                    }
                });
            }).catch(e => {
                queueCB(e);
            });
        });

        queue.push(data, function (err, result) {
            if (err) {
                //queue.kill();
                errorList.push(err);
                queue.tasks = [];
                //queue.empty();
            }
        });

        queue.drain = function () {
            if (errorList && errorList.length) {
                reject();
            } else {
                resolve();
            }
        }

    });
}

function recordInsertion_V2(date, params) {
    return new Promise((_resolve, _reject) => {

        var startDate = getstartOfDay(params.year, params.month, params.day);

        var closingStockPromise = new Promise((resolve, reject) => {
            //PR16711
            bulkGetClosingStockData(date).then(data => {
                if (data && data.length) {
                    console.log(chalker.blue(`Closing Stock report found , proceeding with insertion ........[ Date : ${date.toISOString()} / Day : ${params.day} / Month : ${getMonthName(params.month)} / Year : ${params.year} / Total Records : ${data.length} ]`));
                    resolve(data);
                } else {
                    resolve(data);
                }
            }).catch(e => reject(e));
        });

        var openingStockPromise = new Promise((resolve, reject) => {
            //PR16711
            bulkGetClosingStockData(startDate).then(data => {
                if (data && data.length) {
                    console.log(chalker.blue(`Opening Stock report found , proceeding with insertion ........[ Date : ${startDate.toISOString()} / Day : ${params.day} / Month : ${getMonthName(params.month)} / Year : ${params.year} / Total Records : ${data.length} ]`));
                    resolve(data);
                } else {
                    resolve(data);
                }
            }).catch(e => reject(e));
        });

        Promise.all([closingStockPromise, openingStockPromise]).then(result => {

            var closingStock = result[0];
            var openingStock = result[1];

            closingStock = closingStock && closingStock.length ? closingStock : [];
            openingStock = openingStock && openingStock.length ? openingStock : [];

            var errorList = [];

            var queue = async.queue(function (closingRecord, queueCB) {

                const inRecord = _.find(closingRecord.records, { type: 'IN' });
                const outRecord = _.find(closingRecord.records, { type: 'OUT' });

                let openingStockQty = _.find(openingStock, { productId: closingRecord.productId, whId: closingRecord.whId });
                openingStockQty = openingStockQty && openingStockQty.closingStock ? openingStockQty.closingStock : 0;

                let entry = {
                    productId: closingRecord.productId,
                    whId: closingRecord.whId,
                    in: inRecord && inRecord.total ? inRecord.total : 0, // cumulative until given date;
                    out: outRecord && outRecord.total ? outRecord.total : 0, // cumulative until given date;
                    openingStock: openingStockQty,
                    closingStock: closingRecord.closingStock, // cumulative until given date;
                    avgMrp: closingRecord.avgMrp ? parseFloat(closingRecord.avgMrp.toFixed(2)) : 0,
                    avgPurchasePrice: closingRecord.avgPrice ? parseFloat(closingRecord.avgPrice.toFixed(2)) : 0,
                    latestMrp: 0,
                    latestPurchasePrice: 0,
                    lastTransactionDate: 0,
                    gst: null,
                    createdAt: new Date(),
                    queryDate: date,
                    month: params.month + 1,
                    year: params.year,
                    day: params.day
                }

                //Get Latest Mrp && PurchasePrice
                var latestSnapShotPromise = new Promise((res, rej) => {
                    
                     db.collection('warehouses').findOne({ productId: closingRecord.productId, whId: closingRecord.whId }, { purchasePrice: 1, mrp: 1, productId: 1, whId: 1, _id: 1 }, function (err, inventory) {
                         if (err) {
                             console.error(`Error on fetching latest mrp and price ..`, err.message);
                             res()
                         } else if (inventory) {
                             entry.latestMrp = inventory.mrp ? parseFloat(inventory.mrp.toFixed(2)) : 0;
                             entry.latestPurchasePrice = inventory.purchasePrice ? parseFloat(inventory.purchasePrice.toFixed(2)) : 0;
                             res();
                         } else {
                             res();
                         }
                     });

                });

                latestSnapShotPromise.then(() => {
                    // Insert Record
                    db.collection(collectionName).findOneAndUpdate({ productId: closingRecord.productId, whId: closingRecord.whId, queryDate: date }, { $set: entry }, { upsert: true, new: true }, function (err, doc) {
                        if (err) {
                            errorList.push(err);
                            queueCB(err);
                        } else {
                            queueCB(null);
                        }
                    });
                }).catch(e => {
                    errorList.push(e);
                    queueCB(e);
                })


            }); // Queue iteration ends here;

            queue.push(closingStock, function (err, result) {
                if (err) {
                    queue.tasks = [];
                }
            });

            queue.drain = function () {
                if (errorList && errorList.length) {
                    _reject(errorList);
                } else {
                    _resolve();
                }
            }

        }).catch(e => reject(e));

    });
}

function extractYearMonthAndDay(date) {
    var result = {};
    result.year = date.getFullYear();
    result.month = date.getMonth();
    result.day = date.getDate();
    result.getMonthName = getMonthName(date.getMonth());

    return result;
}

/*
    - Start of today with time midnight yesterday
 */
function getstartOfDay(year, month, day) {
    return new Date(year, month, day, 00, 00, 00, 000);
}

function getEndOfDay(year, month, day) {
    return new Date(year, month, day, 23, 59, 59, 999);
}

function getStartingDateOfMonth(month, year) {
    var dt = new Date();
    dt.setFullYear(year);
    dt.setMonth(month);

    return new Date(dt.getFullYear(), dt.getMonth(), 1);
}

function getEndingDateOfMonth(month, year) {
    var dt = new Date();
    dt.setFullYear(year);
    dt.setMonth(month);

    return new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
}

/* 
    How many days for a given month;
    console.log("Days - " ,getDaysInMonth(2,2018));
*/
function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}


function getYearsToIterate(endYear) {
    var yearsArr = [];

    var currentYear = new Date().getFullYear();

    if (currentYear === endYear) {
        return [currentYear];
    }

    for (let i = currentYear; i >= endYear; i--) {
        yearsArr.push(i);
    }

    return yearsArr;
}

function getMonthsToIterate(year, endYear, endMonth) {
    var monthsArr = [];
    var start = -1;
    var currentYear = new Date().getFullYear();

    if (currentYear === year) {
        start = new Date().getMonth();
    } else {
        start = 11;
    }

    for (let i = start; i >= 0; i--) {
        if (endYear && endMonth && year === endYear && i >= endMonth) {
            monthsArr.push(i);
            if (i === endMonth) break;
        } else {
            monthsArr.push(i);
        }
    }

    return monthsArr;

}

function getMonthName(month) {
    const monthList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthList[month];
}

module.exports = {
    run: run,
    triggerByRange: triggerByRange
}