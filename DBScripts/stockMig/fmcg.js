
var Mongoose = require("mongoose");
var db = Mongoose.connection;
var local = null;
var token = null;

function init(_local, _token) {
    local = _local;
    token = _token;
}

var fmcg = [
    {
        "productId": "", //From new Erp
        "whId": "",
        "mrp": "",
        "cost": "",
        "shelfLife": "",
        "barcode": "",
        "quantity": "",
        "offer": "",
        "purchasePrice": "",
        "serialNo": "",
        "location": "",
        "area": "",
        "rackId": "",
        "binId": "",
        "productName": ""
    }
]

//FMCG
var karnatakaWhAddress = {
    "name": "StoreKing FMCG Warehouse",
    "state": "Karnataka",
    "district": "Bangalore Rural",
    "town": "Kumbalgudu",
    "mobile": 8095188111,
    "email": "agowda@storeking.in",
    "gstNo": "29AACCL2418A1ZZ",
    "address": {
        "door_no": "C/o, Shree Industries",
        "street": "122/1, Off Bhimanakuppe Village,",
        "landmark": "Opp to SLV Cafe",
        "full_address": "Big Banyan tree road,  Opp to SLV Cafe"
    },
    "whId": "WMF1",//FMCG,
    "position": {
        "location": "Normal",
        "area": "NormalAR-WMF1-1",
        "rack": "Rack-1",
        "bin": "Bin-1"
    }
}

//FMCG
var TelanganaWhAddress = {
    "name": "Hyderabad Warehouse",
    "state": "Telangana",
    "district": "Hyderabad",
    "town": "Hyderabad",
    "mobile": 8095188113,
    "email": "agowda@storeking.in",
    "pincode": 500014,
    "gstNo": "36AACCL2418A1Z4",
    "address": {
        "door_no": "M/s. Local cube commerce Pvt Ltd",
        "street": "C/oJayem warehousing Pvt Ltd. 63/4,",
        "landmark": "Kompally village",
        "full_address": "Survey No.157, 158 & 159. Kompally village,  Secunderabad"
    },
    "whId": "WMF2",
    "position": {
        "location": "Normal",
        "area": "NormalAR-WMF2-1",
        "rack": "Rack-1",
        "bin": "Bin-1"
    }
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



module.exports = {
    init: init,
    fmcg: fmcg,
    karnatakaWhAddress: karnatakaWhAddress,
    TelanganaWhAddress: TelanganaWhAddress
};



/* 

{
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
}


*/