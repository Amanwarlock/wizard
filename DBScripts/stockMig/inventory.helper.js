var Mongoose = require("mongoose");
var http = require("http");
var _ = require("lodash");
var db = Mongoose.connection;

var local = null;
var token = null;

function init(_local, _token) {
    local = _local;
    token = _token;
}

module.exports = {
    init: init,
    create: create
}


/*  Create snapshots */
function create(list) {
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

/* var inv = {
    "productId": snapShot.productId,
    "cost": snapShot.cost,
    "shelfLife": snapShot.shelfLife,
    "intakeDate": new Date(),
    "poId": "",
    "ref": { "movement": doc._id },
    "barcode": snapShot.barcode,
    "quantity": qty,
    "offer": snapShot.offer,
    "mrp": snapShot.mrp,
    "vat": snapShot.vat,
    "purchasePrice": snapShot.purchasePrice,
    "onHold": onHold,
    "serialNo": doc.serialNo,
    "location": doc.newLocation,
    "area": doc.newArea,
    "whId": doc.towhId,
    "rackId": doc.newRack,
    "binId": doc.newBin,
    "categoryId": snapShot.categoryId,
    "brandId": snapShot.brandId,
    "fulfilmentPolicy": snapShot.fulfilmentPolicy,
    // "isGoodStock": "",//Taken care in prehooks  based on given location;
    //"inwardedQuantity": doc.quantity,
    "createdBy": doc.createdBy,
    "createdAt": new Date(),
    "holdStatus": snapShot.holdStatus,
    "productType": snapShot.productType,
    "productName": snapShot.productName
} */

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
