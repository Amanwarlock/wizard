/**
 * @author AmanKareem <aman.kareem@storeking.in>
 * @fileOverview A stock ledger request processor to process all pending docs;
 */
"use strict;"
var Mongoose = require("mongoose");
var http = require("http");
var cuti = require("cuti");
var log4js = cuti.logger.getLogger;
var logger = log4js.getLogger("warehouse");
var async = require("async");
var _ = require("lodash");
var eventEmitter = null;// Pub-Sub pattern for updating deals for avaialble stocks flag;
var crudder = null;
var cluster = require("cluster");
var chalk = require("chalk");
const chalker = new chalk.constructor({ enabled: true, level: 1 });

/* --------------------------------[CLUSTER]----------------------------- */
var clusterId = null;

console.log("NODE APP INSTANCE AKA Cluster No. :", process.env.NODE_APP_INSTANCE, typeof process.env.NODE_APP_INSTANCE);

if (process.env.NODE_APP_INSTANCE == 0) {
    clusterId = parseInt(process.env.NODE_APP_INSTANCE);
}
console.log("Is master cluster : ", cluster.isMaster);

console.log("Cluster count :", clusterId, typeof clusterId);

/* -------------------------------------------------[REDIS SET UP]------------------------------------------------------------------ */
var redisSMQ = require("rsmq");
var RSMQWorker = require("rsmq-worker"); //Deprecated due to parallel polling when run at node cluster level;
var rsmq = new redisSMQ({ port: port, host: host, ns: "STKLED" });//Used for manual polling only from 1st cluster instantiated;
var kue = require('kue');//Queued all manually polled data from the redis from cluster - 1 only

var host = process.env.REDIS_CON.split(":")[0];
var port = process.env.REDIS_CON.split(":")[1];

var worker = new RSMQWorker("stock_ledgers", {
    "host": host,
    "port": port,
    "autostart": true,
    "maxReceiveCount": 1,
    "defaultDelay": 0,
    "interval": 0.1,
    "timeout": 600000 //0 0r 600000ms (10min) 
});

/* --------------------------------------------KUE---------------------------------------- */
var kueWorker = kue.createQueue({
    redis: {
        host: host,
        port: port
    }
});

rsmq.createQueue({ qname: "stock_ledgers" }, (err, resp) => {
    if (resp === 1)
        logger.log("Queue creation successful")
});

const redisIndicator = `${chalker.bold.yellow("[")}${chalker.bold.underline.yellow("REDIS")}${chalker.bold.yellow("]")} ${chalker.bold.yellow(":")}`;
const kueIndicator = `${chalker.bold.cyan("[")}${chalker.bold.underline.cyan("REDIS-KUE-WORKER")}${chalker.bold.cyan("]")} ${chalker.bold.cyan(":")}`;
/* ------------------------------------------------------------------------------------ */

/* ----------------------------------IMPORT FILES--------------------------------------- */
var dealUpdateCtrl = require("./deal.update");
/* ------------------------------------------------------------------------------------- */

function init(_crudder) {
    crudder = _crudder;
}

function initEvents(_eventEmitter) {
    eventEmitter = _eventEmitter;
}

/* function pushToRedis(entity) {
    return new Promise((resolve, reject) => {
        try {
            entity = JSON.stringify(entity);
            worker.send(entity, function (err, message) {
                if (err) {
                    logger.error("Redis error while pushing to queue : ", err.message);
                    reject(new Error(err.message))
                }
                else {
                    logger.info("REDIS: Request is queued..", entity);
                    resolve(entity);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
} */

function pushToRedis(entity) {
    return new Promise((resolve, reject) => {
        try {
            entity = JSON.stringify(entity);
            rsmq.sendMessage({ qname: "stock_ledgers", message: entity }, function (err, resp) {
                if (resp) {
                    logger.info(redisIndicator, chalker.green(`Request in queued ....${entity}`));
                    resolve(entity);
                }
                else {
                    logger.error(err.message);
                    reject(err);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

if (clusterId === 0) {
    logger.trace(redisIndicator, chalker.bold.green(`RSMQ interval initialized for cluster ${clusterId}`));
    setInterval(function () {
        rsmq.popMessage({ qname: "stock_ledgers" }, function (err, resp) {
            if (resp && resp.id && resp.message) {
                logger.trace(redisIndicator, chalker.green(`Processing rsmq queue ....${resp.message}`));
                var payload = resp.message;
                try {
                    payload = JSON.parse(payload);
                    payload = Object.assign({ title: 'Stock Ledger Processor' }, payload);
                    var job = kueWorker.create('Ledger_Job_Runner', payload)
                        .removeOnComplete(true)
                        .save((err, result) => {
                            if (err) {
                                logger.error(kueIndicator, chalker.red(`Redis error while pushing to queue : ${err.message}`));
                            } else {
                                logger.info(kueIndicator, chalker.green(`Request is queued ....${JSON.stringify(payload)}`));
                            }
                        });

                    job.on('error', (err) => {
                        logger.error("Redis error while pushing to queue : ", err.message);
                    });

                    job.on('failed', () => {
                        logger.error("Redis attempt to pushing to queue failed: ");
                    });

                    job.on('job complete', function (id, result) {
                        kueWorker.job.get(id, function (err, job) {
                            if (err) {
                                console.log("Failed to remove job : ", err);
                                return;
                            } else {
                                job.remove((err) => {
                                    if (err) {
                                        console.log("Failed to remove job :", err);
                                    } else {
                                        console.log("Job successfully removed");
                                    }
                                });
                            }
                        })
                    });
                } catch (e) { logger.error(e.message) }
            }
        });
    }, 50);


    kueWorker.process('Ledger_Job_Runner', 1, function (job, ctx, done) {
        processStockLedgers(job.data).then(() => done()).catch(e => done());

    });
}


function processStockLedgers(_payload) {
    return new Promise((resolve, reject) => {
        logger.trace(kueIndicator, chalker.green(`Processing stock change request.`));
        async.waterfall([
            _findstockLedgers(_payload),
            _updateSnapshots,
            _updateStockLedgers
        ], function (err, result) {
            if (err) {
                logger.error("Process ledger requests error", err.message);
                resolve();
            }
            else {
                logger.info(kueIndicator, chalker.bold.green(`Job completed successfully ${JSON.stringify(result)}`));
                triggerWebhook(_payload);
                resolve();
            }
        });
    });
}

function _findstockLedgers(_payload) {
    return function (callback) {
        Mongoose.models['stockledger'].find({ _id: { $in: _payload.list }, status: "Pending" }).sort({ "createdAt": 1 }).exec().then(_list => {
            callback(null, _list);
        }).catch(e => callback(e));
    };
}

function _updateSnapshots(_list, callback) {
    if (!_list && !_list.length) {
        callback(new Error(`Cannot find stock ledgers to process.`));
    }
    var successList = [];
    var failedList = [];
    var queue = async.queue(function (_entity, queueCB) {
        decisiveTrigger(_entity)
            .then(result => {
                _entity.status = result.status;
                _entity.log = result.log;
                _entity.stockTransaction = [result.before, result.after];
                _entity.mrp = result.mrp;
                _entity.barcode = result.barcode;
                _entity.position = result.position;
                _entity.lastUpdated = result.lastUpdated;
                queueCB(null, _entity);
            })
            .catch(e => {
                _entity.status = "Failed";
                _entity.log = e.message;
                _entity.lastUpdated = new Date();
                queueCB(_entity, null);
            });
    });
    queue.drain = function () {
        callback(null, _list, successList, failedList);
    };
    _.each(_list, doc => {
        queue.push(doc, (_failedDoc, _succeededDoc) => {
            if (_failedDoc)
                failedList.push(_failedDoc);
            else if (_succeededDoc)
                successList.push(_succeededDoc);

        });
    });
}

function decisiveTrigger(_entity) {
    var quantity = _entity.requestQty;
    var snapShotId = _entity.snapShotId;
    var _type = _entity.referenceType;
    var serialNo = _entity.serialNo;
    switch (_type) {//Reference type of ledger;
        case "Stock Reservation": return putQtyOnHold(quantity, snapShotId);
        case "Stock Unreservation": return removeFromHold(quantity, snapShotId);
        case "Order Reservation": return putQtyOnHold(quantity, snapShotId);
        case "Order Cancellation": return removeFromHold(quantity, snapShotId);
        case "GRN Reservation": return putQtyOnHold(quantity, snapShotId);
        case "Invoice reserved": return putQtyOnHold(quantity, snapShotId, true);
        case "Invoice unreserved": return removeFromHold(quantity, snapShotId, true);
        case "Release": return release(quantity, snapShotId, serialNo);
        case "Invoice Cancellation": return revertRelease(quantity, snapShotId, serialNo);
        case "Invoice cancel reservation": return putQtyOnHold(quantity, snapShotId, true);
        case "Invoice cancel unreservation": return removeFromHold(quantity, snapShotId, true);
        case "Stock Correction": return correction(quantity, snapShotId, serialNo);
        case "HPB Reservation": return voidOnHold(quantity, snapShotId);
        case "HPB UnReservation": return voidRemoveFromHold(quantity, snapShotId);
        case "HPB Release": return voidRelease(quantity, snapShotId, serialNo);
        default: Promise.reject("Invalid reference type for stock ledger");
    }
}

function _updateStockLedgers(_list, successList, failedList, callback) {
    var _combinedList = successList.concat(failedList);
    var model = new crudder.model(_combinedList[0]);
    var bulk = model.collection.initializeUnorderedBulkOp();
    _combinedList.map(doc => {
        doc = doc.toObject();
        bulk.find({ _id: doc._id }).update({ "$set": { "status": doc.status, "stockTransaction": doc.stockTransaction, "mrp": doc.mrp, "barcode": doc.barcode, "position": doc.position, "log": doc.log, "lastUpdated": doc.lastUpdated } });
    });
    bulk.execute(function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, result);
    });
}

/**
 * 
 * @param {*} _payload - This payload is same what is pushed to redis queue;
 * payload comprises two fields : list: [] webhook: {} , 
 * list is the list of stockLedger _id's
 */
function triggerWebhook(_payload) {
    if (!_payload || _.isEmpty(_payload.webhook) || _.isEmpty(_payload.webhook.magicKey) || _.isEmpty(_payload.webhook.path)) {
        return;
    }
    logger.trace("Triggering webhook from stock ledger.");
    var magicKey = _payload.webhook.magicKey;
    var path = _payload.webhook.path;
    var method = "POST";
    //call the mentioned webhook;
    _fireHttpRequest(magicKey, path, method, _payload).then(() => logger.info("webhook call back success")).catch(e => logger.error("Webhook Error :", e.message));
}

/* This function block decrements quantity field and increments onHold quantity field */
function putQtyOnHold(count, snapShotId, strict) {
    logger.trace("RESERVING: Adding quantity to hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }
        setTimeout(function () {
            Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, quantity: { "$gte": count }, isGoodStock: true },
                { "$inc": { quantity: count * (-1), onHold: count } },
                { new: false })
                .exec().then(doc => {
                    if (doc) {
                        //success;
                        var result = {};
                        result.before = {
                            _id: doc._id,
                            quantity: doc.quantity,
                            onHold: doc.onHold,
                            state: "before"
                        };
                        result.after = {
                            _id: doc._id,
                            quantity: doc.quantity - count,
                            onHold: doc.onHold + count,
                            state: "after"
                        };
                        result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                        result.mrp = doc.mrp;
                        result.barcode = doc.barcode;
                        result.status = "Committed";
                        result.log = `Quantity ${count} added to onHold status`;
                        result.lastUpdated = new Date();
                        eventEmitter.emit("stock_change", doc.productId);
                        resolve(result);
                    }
                    else if (!strict) {
                        //retry;
                        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, quantity: { "$gt": 0 }, isGoodStock: true },
                            { "$set": { quantity: 0 } },
                            { new: false })
                            .exec()
                            .then(whDoc => {
                                if (whDoc) {
                                    //update the holdQty;
                                    Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId }, { "$inc": { onHold: whDoc.quantity } }, { new: true })
                                        .exec().then(newDoc => {
                                            var result = {};
                                            result.before = {
                                                _id: whDoc._id,//old doc;
                                                quantity: whDoc.quantity,
                                                onHold: whDoc.onHold,
                                                state: "before"
                                            };
                                            result.after = {
                                                _id: newDoc._id,//new doc;
                                                quantity: newDoc.quantity,
                                                onHold: newDoc.onHold,
                                                state: "after"
                                            };
                                            result.position = { "location": newDoc.location, "area": newDoc.area, "whId": newDoc.whId, "rackId": newDoc.rackId, "binId": newDoc.binId };
                                            result.mrp = newDoc.mrp;
                                            result.barcode = newDoc.barcode;
                                            result.status = "Committed";
                                            result.log = `Quantity ${whDoc.quantity} added to onHold status`;
                                            result.lastUpdated = new Date();
                                            eventEmitter.emit("stock_change", newDoc.productId);
                                            resolve(result);
                                        }).catch(e => reject(e));
                                } else {
                                    reject(new Error(`Stock not found for snapshot : ${snapShotId}`));
                                }
                            }).catch(e => reject(e));
                    } else {
                        reject(new Error(`Stock not found for snapshot : ${snapShotId}`));
                    }
                }).catch(e => reject(e));

        }, 60000); //60000
    });
}

/* This function block decrements onHold Field count and increments quantity field count;*/
function removeFromHold(count, snapShotId, strict) {
    logger.trace("UN-RESERVING: Removing quantity from hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }
        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gte": count }, isGoodStock: true },
            { "$inc": { onHold: count * (-1), quantity: count } },
            { new: false })
            .exec()
            .then(doc => {
                if (doc) {
                    //success;
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity + count,
                        onHold: doc.onHold - count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.log = `Quantity ${count} removed from onHold status`;
                    result.lastUpdated = new Date();
                    eventEmitter.emit("stock_change", doc.productId);
                    resolve(result);
                } else if (!strict) {
                    Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gt": 0 }, isGoodStock: true },
                        { "$set": { onHold: 0 } },
                        { new: false })
                        .exec().then(whDoc => {
                            if (whDoc) {
                                Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId }, { "$inc": { quantity: whDoc.onHold } }, { new: true })
                                    .exec()
                                    .then(newDoc => {
                                        var result = {};
                                        result.before = {
                                            _id: whDoc._id,
                                            quantity: whDoc.quantity,
                                            onHold: whDoc.onHold,
                                            state: "before"
                                        };
                                        result.after = {
                                            _id: newDoc._id,
                                            quantity: newDoc.quantity,
                                            onHold: newDoc.onHold,
                                            state: "after"
                                        };
                                        result.position = { "location": newDoc.location, "area": newDoc.area, "whId": newDoc.whId, "rackId": newDoc.rackId, "binId": newDoc.binId };
                                        result.mrp = newDoc.mrp;
                                        result.barcode = newDoc.barcode;
                                        result.status = "Committed";
                                        result.log = `Quantity ${whDoc.onHold} removed from onHold status`;
                                        result.lastUpdated = new Date();
                                        eventEmitter.emit("stock_change", newDoc.productId);
                                        resolve(result);
                                    }).catch(e => reject(e));
                            } else {
                                reject(new Error(`onHold Stock not found for snapshot : ${snapShotId}`));
                            }
                        }).catch(e => reject(e));
                } else {
                    reject(new Error(`onHold Stock not found for snapshot : ${snapShotId}`));
                }
            }).catch(e => reject(e));
    });
}

/* This function block only decrements onHold field count; This may happen on succesfull invoicing etc. */
function release(count, snapShotId, serialNo) {
    logger.trace("RELEASING: Reducing quantity from hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }

        if (serialNo && !_.isArray(serialNo)) {
            reject(new Error(`Error ! Serial number should be an array`));
            return;
        }

        serialNo = serialNo && serialNo.length ? serialNo : [];

        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gte": count }, isGoodStock: true },
            { "$inc": { onHold: count * (-1) }, "$pull": { "serialNo": { "$in": serialNo } }, "$addToSet": { "scannedSerialNo": { "$each": serialNo } } },
            { new: false })
            .exec()
            .then(doc => {
                if (doc) {
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold - count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.log = `Quantity ${count} released/Invoiced`;
                    result.lastUpdated = new Date();
                    eventEmitter.emit("stock_change", doc.productId);
                    resolve(result);
                } else {
                    reject(new Error(`Invalid requested quantity , cannot release requested quantity from hold.`));
                }
            }).catch(e => reject(e));
    });
}

/* 
    - This function is used when invoice is cancelled or etc;
    - This adds back the released qty to onHold again;
 */
function revertRelease(count, snapShotId, serialNo) {
    logger.trace("Reverting Release: Adding back released qty back to onHold...");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }

        if (serialNo && !_.isArray(serialNo)) {
            reject(new Error(`Error ! Serial number should be an array`));
            return;
        }

        serialNo = serialNo && serialNo.length ? serialNo : [];

        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, isGoodStock: true },
            { "$inc": { onHold: count }, "$pull": { "scannedSerialNo": { "$in": serialNo } }, "$addToSet": { "serialNo": { "$each": serialNo } } },
            { new: false })
            .exec()
            .then(doc => {
                if (doc) {
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold + count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.lastUpdated = new Date();
                    result.log = `${count} Added to onHold on Invoice cancellation`;
                    resolve(result);
                } else {
                    reject(new Error(`Error occured while reverting released quantity`));
                }
            }).catch(e => reject(e));
    });
}

function correction(count, snapShotId, serialNo) {
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Quantity cannot be empty.`));
            return;
        }
        if (serialNo && !_.isArray(serialNo)) {
            reject(new Error(`Error ! Serial number should be an array`));
            return;
        }

        serialNo = serialNo && serialNo.length ? serialNo : [];

        var finder = { _id: snapShotId };
        var setter = {};

        if (count > 0) {//Incremental;
            setter = Object.assign(setter, { "$inc": { quantity: count } });
            setter = Object.assign(setter, { "$addToSet": { "serialNo": { "$each": serialNo } } });
            Mongoose.models['warehouse'].findOneAndUpdate(finder, setter, { new: false }).exec()
                .then(doc => {
                    if (doc) {
                        var result = {};
                        result.before = {
                            _id: doc._id,
                            quantity: doc.quantity,
                            onHold: doc.onHold,
                            state: "before"
                        };
                        result.after = {
                            _id: doc._id,
                            quantity: doc.quantity + count,
                            onHold: doc.onHold,
                            state: "after"
                        };
                        result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                        result.mrp = doc.mrp;
                        result.barcode = doc.barcode;
                        result.status = "Committed";
                        result.log = `Quantity varied by ${count} `;
                        result.lastUpdated = new Date();
                        eventEmitter.emit("stock_change", doc.productId);
                        resolve(result);
                    } else {
                        reject(new Error(`Invalid requested quantity , cannot vary requested quantity.`));
                    }
                })
                .catch(e => reject(e));
        } else if (count < 0) { // Decremental;
            var getCount = function (required, available) {
                return required <= available ? required : required > available ? available : 0;
            };
            var variantQty = Math.abs(count);
            //First try: Decrease entirely from qty if available;
            Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, quantity: { "$gte": variantQty } },
                { "$inc": { quantity: variantQty * (-1) }, "$pull": { serialNo: { "$in": serialNo } } },
                { new: false }).exec()
                .then(doc1 => {//FIRST TRY:
                    if (doc1) {
                        var result = {};
                        result.before = {
                            _id: doc1._id,
                            quantity: doc1.quantity,
                            onHold: doc1.onHold,
                            state: "before"
                        };
                        result.after = {
                            _id: doc1._id,
                            quantity: doc1.quantity - variantQty,
                            onHold: doc1.onHold,
                            state: "after"
                        };
                        result.position = { "location": doc1.location, "area": doc1.area, "whId": doc1.whId, "rackId": doc1.rackId, "binId": doc1.binId };
                        result.mrp = doc1.mrp;
                        result.barcode = doc1.barcode;
                        result.status = "Committed";
                        result.log = `Quantity varied by ${variantQty} `;
                        result.lastUpdated = new Date();
                        eventEmitter.emit("stock_change", doc1.productId);
                        resolve(result);
                    } else {
                        //Second Try: Decrease partially from qty and partially from onHold ;  If qty > 0 and set qty to 0 and rest qty decrease from onHold
                        Mongoose.models['warehouse'].findOne({ _id: snapShotId, quantity: { "$gt": 0 }, onHold: { "$gt": 0 } }).select("_id quantity onHold").lean().exec().then(wh => {
                            if (wh && (wh.quantity + wh.onHold) >= variantQty) {
                                var qtyVariant = getCount(variantQty, wh.quantity);
                                variantQty -= qtyVariant;
                                var onHoldVariant = getCount(variantQty, wh.onHold);
                                variantQty -= onHoldVariant;
                                if (variantQty === 0) {
                                    Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, quantity: { "$gte": qtyVariant }, onHold: { "$gte": onHoldVariant } },
                                        { "$inc": { "quantity": qtyVariant * (-1), "onHold": onHoldVariant * (-1) }, "$pull": { serialNo: { "$in": serialNo }, /* scannedSerialNo: { "$in": serialNo } */ } },
                                        { new: false }).exec()
                                        .then(doc2 => {
                                            if (doc2) {
                                                var result = {};
                                                result.before = {
                                                    _id: doc2._id,
                                                    quantity: doc2.quantity,
                                                    onHold: doc2.onHold,
                                                    state: "before"
                                                };
                                                result.after = {
                                                    _id: doc2._id,
                                                    quantity: doc2.quantity - qtyVariant,
                                                    onHold: doc2.onHold - onHoldVariant,
                                                    state: "after"
                                                };
                                                result.position = { "location": doc2.location, "area": doc2.area, "whId": doc2.whId, "rackId": doc2.rackId, "binId": doc2.binId };
                                                result.mrp = doc2.mrp;
                                                result.barcode = doc2.barcode;
                                                result.status = "Committed";
                                                result.log = `Quantity varied by ${variantQty} `;
                                                result.lastUpdated = new Date();
                                                eventEmitter.emit("stock_change", doc2.productId);
                                                resolve(result);
                                            } else {
                                                reject(`Invalid requested quantity , cannot vary requested quantity.`);
                                            }
                                        }).catch(e => reject(e));
                                } else {
                                    reject(`Invalid requested quantity , cannot vary requested quantity.`);
                                }
                            } else {
                                //Third Try: Decrease entirely from onHold as no qty available;
                                Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gte": variantQty } },
                                    { "$inc": { onHold: variantQty * (-1) }, "$pull": { serialNo: { "$in": serialNo } } },
                                    { new: false }).exec()
                                    .then(doc3 => {
                                        if (doc3) {
                                            var result = {};
                                            result.before = {
                                                _id: doc3._id,
                                                quantity: doc3.quantity,
                                                onHold: doc3.onHold,
                                                state: "before"
                                            };
                                            result.after = {
                                                _id: doc3._id,
                                                quantity: doc3.quantity,
                                                onHold: doc3.onHold - variantQty,
                                                state: "after"
                                            };
                                            result.position = { "location": doc3.location, "area": doc3.area, "whId": doc3.whId, "rackId": doc3.rackId, "binId": doc3.binId };
                                            result.mrp = doc3.mrp;
                                            result.barcode = doc3.barcode;
                                            result.status = "Committed";
                                            result.log = `Quantity varied by ${variantQty} `;
                                            result.lastUpdated = new Date();
                                            resolve(result);
                                        } else {
                                            reject(new Error(`Invalid requested quantity , cannot vary requested quantity.`));
                                        }
                                    }).catch(e => reject(e))
                            }
                        }).catch(e => reject(e));
                    }
                }).catch(e => reject(e));
        }
    });
}

/* Skips isGoodStock Check */
/* This function block decrements quantity field and increments onHold quantity field without checking for isGoodStock true*/
function voidOnHold(count, snapShotId) {
    logger.trace("RESERVING: Adding quantity to hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }
        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, quantity: { "$gte": count } },
            { "$inc": { quantity: count * (-1), onHold: count } },
            { new: false })
            .exec().then(doc => {
                if (doc) {
                    //success;
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity - count,
                        onHold: doc.onHold + count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.log = `Quantity ${count} added to onHold status`;
                    result.lastUpdated = new Date();
                    eventEmitter.emit("stock_change", doc.productId);
                    resolve(result);
                }
                else {

                    reject(new Error(`Stock not found for snapshot : ${snapShotId}`));
                }
            }).catch(e => reject(e));
    });
}

/* This function block decrements onHold Field count and increments quantity field count;*/
function voidRemoveFromHold(count, snapShotId) {
    logger.trace("UN-RESERVING: Removing quantity from hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }
        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gte": count } },
            { "$inc": { onHold: count * (-1), quantity: count } },
            { new: false })
            .exec()
            .then(doc => {
                if (doc) {
                    //success;
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity + count,
                        onHold: doc.onHold - count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.log = `Quantity ${count} removed from onHold status`;
                    result.lastUpdated = new Date();
                    eventEmitter.emit("stock_change", doc.productId);
                    resolve(result);
                } else {
                    reject(new Error(`onHold Stock not found for snapshot : ${snapShotId}`));
                }
            }).catch(e => reject(e));
    });
}

/* This function block only decrements onHold field count; This may happen on succesfull invoicing etc. */
function voidRelease(count, snapShotId, serialNo) {
    logger.trace("RELEASING: Reducing quantity from hold");
    return new Promise((resolve, reject) => {
        if (!snapShotId) {
            reject(new Error(`Snapshot Id not found.`));
            return;
        }
        if (!count) {
            reject(new Error(`Invalid hold quantity.`));
            return;
        }

        if (serialNo && !_.isArray(serialNo)) {
            reject(new Error(`Error ! Serial number should be an array`));
            return;
        }

        serialNo = serialNo && serialNo.length ? serialNo : [];

        Mongoose.models['warehouse'].findOneAndUpdate({ _id: snapShotId, onHold: { "$gte": count } },
            { "$inc": { onHold: count * (-1) }, "$pull": { "serialNo": { "$in": serialNo } }, "$addToSet": { "scannedSerialNo": { "$each": serialNo } } },
            { new: false })
            .exec()
            .then(doc => {
                if (doc) {
                    var result = {};
                    result.before = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold,
                        state: "before"
                    };
                    result.after = {
                        _id: doc._id,
                        quantity: doc.quantity,
                        onHold: doc.onHold - count,
                        state: "after"
                    };
                    result.position = { "location": doc.location, "area": doc.area, "whId": doc.whId, "rackId": doc.rackId, "binId": doc.binId };
                    result.mrp = doc.mrp;
                    result.barcode = doc.barcode;
                    result.status = "Committed";
                    result.log = `Quantity ${count} released/Invoiced`;
                    result.lastUpdated = new Date();
                    resolve(result);
                } else {
                    reject(new Error(`Invalid requested quantity , cannot release requested quantity from hold.`));
                }
            }).catch(e => reject(e));
    });
}

/**
 * @description Common Http request making function block;
 * @param {*String} _magickey //Redis-Key;
 * @param {*String} _path //API Path;
 * @param {*String} _method // Http method - POST , PUT , GET;
 * @param {*Object} _payload //Requset body;
 */
function _fireHttpRequest(_magickey, _path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_magickey) {
            reject(new Error(`Magic Key cannot be empty for HTTP request.`));
            return;
        }
        if (!_path) {
            reject(`Path cannot be empty for HTTP request.`);
            return;
        }
        if (!_method) {
            reject(`Http Method cannot be empty for HTTP request.`);
            return;
        }
        cuti.request.getUrlandMagicKey(_magickey)
            .then(options => {
                options.path += _path;
                options.method = _method;
                var request = http.request(options, response => {
                    var data = "";
                    response.on('data', _data => data += _data.toString());
                    response.on('end', () => {
                        if (response.statusCode === 200) {
                            try {
                                data = JSON.parse(data);
                                resolve(data);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error(data));
                        }
                    });
                });
                //Request error handling;
                request.on('error', function (err) {
                    reject(err);
                });
                //Close HTTP port;
                if ((_method === 'POST' || _method === 'PUT') && !_.isEmpty(_payload))
                    request.end(JSON.stringify(_payload));
                else
                    request.end();

            }).catch(e => reject(e));
    });
}

/* JUnit test-case-suite set up;  */
(function testEnv() {
    if (process.env.TEST_ENV) {
        module.exports = {
            putQtyOnHold: putQtyOnHold,
            removeFromHold: removeFromHold,
            release: release,
            correction: correction
        }
    }
}());

module.exports.init = init;
module.exports.initEvents = initEvents;
module.exports.pushToRedis = pushToRedis;
