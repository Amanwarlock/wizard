/* 
    - This script query all published and active deals;
    - For linked products checks if all of them has stock;
    - If all linked products have stock , deal flag display=true is marked;
*/

"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");

/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging"; //LIVE
//const url = "mongodb://localhost:27017/storeKing";//LOCAL
//const url = "mongodb://liveDumpUser:X7jqXAJbN9NM3LefgUQQ@13.126.167.108:27017/liveDump" ; //PRE-PROD;
var path = "/home/aman/Desktop/DealSync";//__dirname + "/csv_reports";
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


function runScript() {
    console.info("--------##.Running Script------------------------------------------------------------------");
    async.waterfall([
        _queryDeals(),
        _queryStocks,
        _updateDeals
    ], function (err, status, result, report) {
        if (err) {
            console.error("Error Occured : ", err);
            process.exit();
        } else {
            generateFile(`DealSyncReport.csv`, report);
            console.log("--------##.Script Completed-----------------------------------------------------------");
            process.exit();
        }

    });

}

function _queryDeals() {
    return function (callback) {
        db.collection('deals').aggregate([{
            "$match": {
                "status": "Publish",
                "active": true,
            }
        },
        {
            '$project': {
                "_id": 0,
                "dealId": "$_id",
                "minimumQuantity": 1,
                "product.id": 1,
                "product.quantity": 1,
                "display": 1
            }
        }
        ]).toArray(function (err, dealList) {
            if (err)
                callback(err);
            else {
                if (!dealList || !dealList.length) {
                    callback(new Error(`No Deals found for the product`));
                    return;
                }

                var productIds = []
                dealList.map(deal => {
                    productIds = productIds.concat(deal.product.map(pr => pr.id));

                });
                productIds = _.uniq(productIds);
                callback(null, dealList, productIds);
            }
        })
    }
}

function _queryStocks(dealList, productIds, callback) {
    db.collection('warehouses').aggregate([
        {
            "$match": {
                "isGoodStock": true,
                "quantity": { "$gt": 0 },
                "productId": { "$in": productIds }
            }
        },
        {
            "$group": {
                "_id": "$productId",
                "quantity": { "$sum": "$quantity" }
            }
        },
        {
            "$project": {
                "_id": 0,
                "productId": "$_id",
                "quantity": 1
            }
        }

    ]).toArray(function (err, inventories) {
        if (err)
            callback(err);
        else
            callback(null, dealList, productIds, inventories);
    });
}

function _updateDeals(dealList, productIds, inventories, callback) {
    if (!inventories || !inventories.length) {
        callback(new Error(`Could not get inventories for deal sync`));
        return;
    }

    var report = [];

    var bulk = db.collection('deals').initializeUnorderedBulkOp();
    //Iterate deals;
    dealList.map(deal => {
        //Iterate Products;
        _.each(deal.product, product => {
            var inventory = _.find(inventories, { "productId": product.id });
            if (inventory) {
                var count = parseInt(inventory.quantity / product.quantity);
                product.display = count > 0 ? true : false;
            } else {
                product.display = false;
            }
        });

        var inStockCount = _.countBy(deal.product, { "display": true });
        var hasStock = inStockCount && inStockCount.true >= deal.product.length ? true : false;

        bulk.find({ _id: deal.dealId }).update({ "$set": { "display": hasStock } });

        if (deal.display !== hasStock) {
            report.push([
                {
                    "Deal Id": deal.dealId,
                    "Previous Display Status": deal.display,
                    "Current Flag": hasStock
                }
            ]);
        }

    });

    bulk.execute(function (err, result) {
        if (err)
            callback(err);
        else
            callback(null, `Success`, result, report);
    });

};



function generateFile(fileName, payload) {
    checkFolder(path);
    jsonexport(payload, function (err, csv) {
        if (csv) {
            _path = `${path}/${fileName}`;
            console.log("CSV created successfully...", _path);
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
