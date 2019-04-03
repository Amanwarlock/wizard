"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
var fs = require("fs");
var path = require("path");
var csvToJson = require('csvjson');
puttu.connect();

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

/* -------------------------------------------------------------INITIAL FILE/ DATA SETUP---------------------------------------------------------- */
const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTEyLTEwVDA4OjQ3OjU0LjQ4OVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0xMS0zMFQxMjowMjoyMC4yOTVaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjAiLCJXTUYxIiwiV01GMyIsIldNRjQiLCJXTUYyIl0sImRlZmF1bHRXaElkIjoiV01GMCJ9LCJyb2xlSWQiOiJST0xFMSIsImlhdCI6MTU0NDU5ODA0MiwiZXhwIjoxNTQ0Njg0NDQyfQ.M_WyYV007mLPyjfZCCRNjNOWjbP0TDIaIKwyCNK6L6Q";
//"JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjU5YTZhNjUxYjZjMDZjZmVjODljNzUiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTEyLTExVDA3OjM5OjQxLjgwNVoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDcyOCIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0xMS0wMVQxODo0Mzo0NS40MzhaIiwicmVmSWQiOiJFTVA3MjgiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjEiLCJXTUYwIiwiV01GMyJdLCJkZWZhdWx0V2hJZCI6IldNRjAifSwicm9sZUlkIjoiUk9MRTEiLCJpYXQiOjE1NDQ2MTE2MTIsImV4cCI6MTU0NDY5ODAxMn0.5FiwkB7Lz0p7BGRfScOjlSMgimMLHe2MtpdIJPWInrE";

//var whAddress = fmcg.karnatakaWhAddress;

const position_local = {
    location: "Normal",
    area: "NormalAR-WMF0-1",
    rack: "Rack-1",
    bin: "Bin-1"
}

const position_live = {
    location: "Normal",
    area: "NormalAR-WMF1-1",
    rack: "Rack-1",
    bin: "Bin-1"
}

var file_1 = "/data/hp_products.csv";

/* ------------------------------------------------------------MONGO SET UP----------------------------------------------------------------------- */

const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging"; //live

//const url = "mongodb://localhost:27017/multiWh"; //local

var local = true; //true/false

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

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */


function runScript() {
    console.log("SCRIPT STARTED : ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    async.waterfall([
        fetchJson(),
        askLocal,
        fetchProductData,
        createGrn,
        createInventories
    ], function (err, result) {
        if (err) {
            console.log("Error :", err);
            process.exit();
        }
        else {
            console.log("SCRIPT COMPLETED : ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
            process.exit();
        }

    });
}

function fetchJson() {
    return function (callback) {
        var options = {
            delimiter: ',', // optional
            quote: '"' // optional
        };
        //product
        var data = fs.readFileSync(path.join(__dirname, file_1), { encoding: 'utf8' });
        var json = csvToJson.toObject(data, options);

        json.map(product => {
            product.serialNo = [];
        });
        callback(null, json);
    }
}

function askLocal(json, callback) {
    rl.question(`Is local  ?  [Y/N]`, (answer) => {
        answer = answer.toLocaleUpperCase();
        if (answer === 'Y') {
            local = true;
            callback(null, json);
        } else if (answer === 'N') {
            local = false;
            callback(null, json);
        } else {
            process.exit();
        }

    });
}


function fetchProductData(json, callback) {
    var productIds = json.map(product => product.productId);
    db.collection("products").aggregate([
        {
            $match: { _id: { $in: productIds } }
        }
    ]).toArray(function (err, products) {
        if (err)
            callback(err);
        else if (products && products.length) {
            callback(null, json, products);
        } else {
            callback(new Error(`Cannot get Products from master... `));
        }
    });

}



function createGrn(json, productData, callback) {

    var productList = [];

    var position = {};

    if (local) {
        position = position_local;
    } else {
        position = position_live;
    }

    json.map(product => {
        var prod = _.find(productData, { "_id": product.productId });
        entry = {};
        entry.whId = product.whId;
        entry.inputVat = 0; // inv
        entry.productId = product.productId;//inv
        entry.productName = prod ? prod.name : product["product_name"];//inv
        entry.categoryId = prod ? prod.category[0] : "";//inv
        entry.brandId = prod ? prod.brand[0] : "";//inv
        entry.poId = "";//inv
        entry.barcode = product.barcode;//inv
        entry.receivedQuantity = parseInt(product.quantity);//inv
        entry.invoiceQuantity = parseInt(product.quantity);
        entry.location = position.location; //inv
        entry.area = position.area//inv
        entry.rack = position.rack//inv
        entry.bin = position.bin//inv
        entry.expiry = { "shelfLife": new Date(product.shelfLife) }; //inv
        entry.offer = product.offer ? product.offer : "";
        entry.price = {
            "mrp": Number(product.mrp),//inv
            "purchasePrice": Number(product.purchasePrice),//inv
            "margin": {

            }
        };
        entry.imei = product.serialNo; //inv
        productList.push(entry);
    });

    callback(null, json, {}, productList);

    /*  grnHelper.create(whAddress, whAddress.whId, productList).then(grn => {
         console.log("GRN Created --- : ", grn);
         callback(null, json, grn, productList);
     }).catch(e => callback(e)); */
}

function createInventories(json, grn, productList, callback) {
    snapshotList = [];
    productList.map(product => {
        var entry = {};
        entry.productId = product.productId;
        entry.cost = 0;
        entry.shelfLife = product.expiry.shelfLife;
        entry.poId = product.poId;
        entry.intakeDate = new Date();
        entry.ref = { correction: '12/12/2018-Migration' };
        entry.barcode = [product.barcode.toLocaleUpperCase()];
        entry.quantity = parseInt(product.receivedQuantity);
        entry.offer = product.offer;
        entry.mrp = product.price.mrp;
        entry.vat = product.inputVat;
        entry.purchasePrice = product.price.purchasePrice;
        entry.onHold = 0;
        entry.serialNo = product.imei && product.imei.length ? product.imei.map(el => el.toLocaleUpperCase()) : [];
        entry.location = product.location;
        entry.area = product.area;
        entry.whId = product.whId;
        entry.rackId = product.rack;
        entry.binId = product.bin;
        entry.categoryId = product.categoryId;
        entry.brandId = product.brandId;
        entry.createdBy = "9113033298";
        entry.createdAt = new Date();
        entry.productName = product.productName;
        snapshotList.push(entry);
    });

    var payload = {
        whId: snapshotList[0].whId,
        user: { "username": "9113033298" },
        inventoryList: snapshotList
    }
    console.log("Snapshot list ------------", JSON.stringify(snapshotList));

    inventoryHelper(payload).then(snapShotList => {
        callback(null, snapShotList);
    }).catch(e => callback(e));
}

function inventoryHelper(list) {
    /* 
        format:
        {
            whId:  "",
            user: { "username" : "9113033298"},
            inventoryList : []
        }
    
    */
    return new Promise((resolve, reject) => {
        if (!list) {
            reject(new Error(`Inventory payload is required to create snapshots`));
            return;
        }
        //{{api-url}}/wh/v1/inventory/create
        //"/api/wh/v1" + _path;
        var path = `/api/wh/v1/inventory/create`;

        _fire(path, "POST", list).then(result => {
            resolve(result);
        }).catch(e => {
            console.log("Inventory Helper Error : ", e);
            reject(e);
        })
    });
}


function _fire(_path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_path) {
            reject(`Path cannot be empty for HTTP request.`);
            return;
        }
        if (!_method) {
            reject(`Http Method cannot be empty for HTTP request.`);
            return;
        }
        var options = {};

        if (local) {
            options.hostname = "localhost";
            options.port = '8080';
            options.headers = {
                "content-type": "application/json",
                "authorization": token
            };
            options.path = _path//"/api/wh/v1" + _path;
            options.method = _method;
        } else {
            options.hostname = "newerp.storeking.in";
            options.port = '8080';
            options.headers = {
                "content-type": "application/json",
                "authorization": token
            };
            options.path = _path//"/api/wh/v1" + _path;
            options.method = _method;
        }

        var request = http.request(options, response => {
            var data = "";
            response.on('data', _data => data += _data.toString());
            response.on('end', () => {
                if (response.statusCode == 200) {
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
        if ((_method === 'POST' || _method === 'PUT') && !_.isEmpty(_payload))
            request.end(JSON.stringify(_payload));
        else
            request.end();
    });
}
