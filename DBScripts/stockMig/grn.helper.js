
var Mongoose = require("mongoose");
var db = Mongoose.connection;
var cuti = require("cuti");
cuti.init("grn");
var grnCollection = db.collection('stockintakes');

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


function create(whAddress, whId, productList) {
    return new Promise((resolve, reject) => {
        var payload = {
            "vendorId": "V0",
            "whId": whId,
            "from": whId,
            "createdBy": "9113033298",
            "whAddress": whAddress,
            "deleted": false,
            "createdAt": new Date(),
            "dockInventory": [],
            "productDetails": productList,
            "invoiceDetails": [],
            "audit": [],
            "message": "Stock Migration - Telanaga and Karnataka",
            "status": "Closed"
        };

        cuti.counter.getCount("GRN", null, function (err, doc) {
            if (err) reject(err);
            else {
                payload._id = "GRN" + doc.next;
                grnCollection.insert(payload, function (err, grn) {
                    if (err)
                        reject(err);
                    else
                        resolve(grn);
                });
            }
        });

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







/* var testPayload = {
    "_id": "GRN360",
    "vendorId": "V1002",
    "whId": "WMF0",
    "from": "WMF0",
    "createdBy": "7829463181",
    "whAddress": {
        "name": "StoreKing Warehouse",
        "state": "Karnataka",
        "district": "Kombalgodu",
        "town": "Kombalgodu",
        "mobile": 1234567890,
        "email": null,
        "gstNo": "",
        "address": {
            "door_no": null,
            "street": null,
            "landmark": null,
            "full_address": null
        },
        "whId": "WMF0"
    },
    "lastUpdated": ISODate("2018-08-09T17:21:09.719+05:30"),
    "deleted": false,
    "dockInventory": [
        {
            "quantity": 2,
            "inventoryId": "WH4994",
            "_id": ObjectId("5b6c2aa632a8687d2ed9a496")
        }
    ],
    "productDetails": [
        {
            "inputVat": 0,
            "productId": "PR10961",
            "categoryId": "C4299",
            "brandId": "BR17735",
            "poId": "201808091",
            "barcode": "4856fdjgdjkgdjkg$#^%$#^%",
            "receivedQuantity": 2,
            "invoiceQuantity": 2,
            "invoiceNo": "INV89342760",
            "location": "Normal",
            "area": "NormalAR-WMF0-1",
            "rack": "Rack-1",
            "bin": "Bin-1",
            "_id": ObjectId("5b6c2aa532a8687d2ed9a495"),
            "expiry": {
                "shelfLife": ISODate("2019-06-29T00:00:00.000+05:30")
            },
            "price": {
                "mrp": "5000",
                "purchasePrice": 4500,
                "margin": {
                    "bMargin": 10,
                    "sMargin": 0,
                    "sMarginType": "%"
                }
            },
            "imei": [
                "@#$4384678956#^&%$",
                "&57368563*&^$$"
            ]
        }
    ],
    "invoiceDetails": [
        {
            "no": "INV89342760",
            "date": "2018-08-08T18:30:00.000Z",
            "amount": 100,
            "_id": ObjectId("5b6c2aa532a8687d2ed9a493"),
            "brandCategories": [
                {
                    "brandId": "BR17735",
                    "categoryId": "C4299",
                    "amount": 9000,
                    "_id": ObjectId("5b6c2aa532a8687d2ed9a494")
                }
            ],
            "dock": {
                "areaId": "DockAR-WMF0-1",
                "rack": "Rack-1",
                "bin": "Bin-1"
            },
            "doc": [],
            "file": []
        }
    ],
    "audit": [],
    "createdAt": ISODate("2018-08-09T17:21:01.931+05:30"),
    "status": "Pending Finance Team Approval",
    "__v": 0,
    "message": "trwret",
    "modifiedBy": "59c49b1c7e840c79b6cce4fd"
} */