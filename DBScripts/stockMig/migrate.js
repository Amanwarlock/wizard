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
puttu.connect();

var fmcg = require("./fmcg");
var mobile = require("./mobile");
var inventoryHelper = require("./inventory.helper");
var grnHelper = require("./grn.helper");
var csvToJson = require('csvjson');




/* ---------SET UP - PREREQUISITES--------------- */
/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging"; //live
//const url = "mongodb://localhost:27017/multiWh"; //local

var local = false; //true/false

var whAddress = fmcg.karnatakaWhAddress;

var file_1 = "/data/hp_products.csv";

var file_2 = "/data/hp_serialNo_1.csv";

//live token;
var token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA4LTE2VDA1OjQ2OjI4LjA2OFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wOC0xM1QwNzozOTo0My4wNDRaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiLCJXTUYyIl0sImRlZmF1bHRXaElkIjoiV01GMCJ9LCJyb2xlSWQiOiJST0xFMSIsImlhdCI6MTUzNDQ4ODI4MywiZXhwIjoxNTM0NTc0NjgzfQ.UJG5s_BM9UN6XsEMOfdalVyvJfHXRhxoovdyZyyKVhs";

//local token;
//var token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjU5YTZhNjUxYjZjMDZjZmVjODljNzUiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA4LTA5VDA5OjI5OjQ3LjY3MFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDcyOCIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wNy0yNlQxMTo1ODo1Mi40NDBaIiwicmVmSWQiOiJFTVA3MjgiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6ZmFsc2UsInBsYXRmb3JtIjoiV2ViIiwid2hEZXRhaWxzIjp7IndoSWRzIjpbIldNRjEiLCJXTUYwIl0sImRlZmF1bHRXaElkIjoiV01GMCJ9LCJyb2xlSWQiOiJST0xFMSIsImlhdCI6MTUzMzkxNDczMiwiZXhwIjoxNTM0MDAxMTMyfQ.Xkbvem-ojcSzS0cesn7YRy9vJRg9G8bMaIcXacysqHs"
/* ---------------------------------------------------------------- */

module.exports = {
    local: local,
    token: token
}



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

fmcg.init(local, token);
mobile.init(local, token);
inventoryHelper.init(local, token);
grnHelper.init(local, token);


function runScript() {
    console.log("SCRIPT STARTED : ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    //getProductDetails("PR10017").then(p => console.log(p)).catch(e => console.log(e));
    //grnHelper.create(fmcg.karnatakaWhAddress, "WMF1", [{ "productId": "ABCD" }]).then(grn => console.log(grn)).catch(e => console.log(e));

    async.waterfall([
        fetchJson(),
        fetchProductData,
        createGrn,
        createInventories
    ], function (err, result) {
        if (err) {
            console.log("Error :", err);
            process.exit();
        }
        else {
            //console.log("Result ----- : ", result[0]['product id']);
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

        //serialNo
        var serialNoData = fs.readFileSync(path.join(__dirname, file_2), { encoding: 'utf8' });
        var serialJson = csvToJson.toObject(serialNoData, options);
        json.map(product => {
            product.serialNo = [];
            serialJson.map(el => {
                if (el.productId === product.productId) {
                    product.serialNo.push(el.imei_no);
                }
            });
        });
        callback(null, json);
    }
}


function fetchProductData(json, callback) {
    var productIds = json.map(product => product.productId);
    db.collection("products").find({ _id: { $in: productIds } }).toArray(function (err, products) {
        if (err)
            callback(err);
        else {
            callback(null, json, products);
        }
    });

}


function createGrn(json, productData, callback) {

    var productList = [];
    /* 
    "position": {
            "location": "Normal",
            "area": "NormalAR-WMF2-1",
            "rack": "Rack-1",
            "bin": "Bin-1"
        }
    */
    json.map(product => {
        var prod = _.find(productData, { "_id": product.productId });
        entry = {};
        entry.inputVat = 0; // inv
        entry.productId = product.productId;//inv
        entry.productName = prod ? prod.name : product["product_name"];//inv
        entry.categoryId = prod ? prod.category[0] : "";//inv
        entry.brandId = prod ? prod.brand[0] : "";//inv
        entry.poId = "";//inv
        entry.barcode = product.barcode;//inv
        entry.receivedQuantity = parseInt(product.quantity);//inv
        entry.invoiceQuantity = parseInt(product.quantity);
        //entry.invoiceNo = "INV89342760",
        entry.location = whAddress.position.location; //inv
        entry.area = whAddress.position.area//inv
        entry.rack = whAddress.position.rack//inv
        entry.bin = whAddress.position.bin//inv
        entry.expiry = { "shelfLife": new Date(product.shelfLife) }; //inv
        entry.price = {
            "mrp": Number(product.mrp),//inv
            "purchasePrice": Number(product.purchasePrice),//inv
            "margin": {

            }
        };
        entry.imei = product.serialNo; //inv
        productList.push(entry);
    });

    grnHelper.create(whAddress, whAddress.whId, productList).then(grn => {
        console.log("GRN Created --- : ", grn);
        callback(null, json, grn, productList);
    }).catch(e => callback(e));
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
        entry.ref = { "grn": grn._id };
        entry.barcode = [product.barcode.toLocaleUpperCase()];
        entry.quantity = parseInt(product.receivedQuantity);
        entry.offer = "";
        entry.mrp = product.price.mrp;
        entry.vat = product.inputVat;
        entry.purchasePrice = product.price.purchasePrice;
        entry.onHold = 0;
        entry.serialNo = product.imei && product.imei.length ? product.imei.map(el => el.toLocaleUpperCase()) : [];
        entry.location = product.location;
        entry.area = product.area;
        entry.whId = whAddress.whId;
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
        whId: whAddress.whId,
        user: { "username": "9113033298" },
        inventoryList: snapshotList
    }


    inventoryHelper.create(payload).then(snapShotList => {
        callback(null, snapShotList);
    }).catch(e => callback(e));
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
                options.hostname = "newerp.storeking.in";
                options.port = '8080';
                options.headers = {
                    "content-type": "application/json",
                    "authorization": token
                };
                options.path = "/api/wh/v1" + _path;
                options.method = _method;
                console.log("Options----", options);
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

            }).catch(e => reject(e));
    });
}


/* From sorcing team */
var format = {
    "productId": "", //From new Erp
    "whId": "", //whid for the product if two different warehouses , then two entries for each
    "mrp": "",//mrp ; if different mrps , then different entries;
    "cost": "",// cost
    "shelfLife": "",//Expriy
    "barcode": "",
    "quantity": "",// quantity/units to be intaken
    "offer": "",//offer if any
    "purchasePrice": "",
    "serialNo": [],//Imei no's if any
    "location": "",// location in warehouse
    "area": "",//area
    "rackId": "",//rack
    "binId": "",//bin
    "productName": ""//
}