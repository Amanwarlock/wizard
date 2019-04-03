var Mongoose = require("mongoose");
var db = Mongoose.connection;

var local = null;
var token = null;

function init(_local, _token) {
    local = _local;
    token = _token;
}

var mobile = [
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


//Mobile
var karnatakaWhAddress = {
    "name": "Storeking Warehouse",
    "companyName": "Local Cube Commerce Pvt Ltd",
    "state": "Karnataka",
    "district": "Kumbalgodu",
    "town": "Kumbalgodu",
    "pincode": 560074,
    "mobile": 8095188113,
    "gstNo": "29AACCL2418A1ZZ",
    "whId": "WMF0", //Mobile
    "address": {
        "door_no": "Plot No: 14",
        "street": "KIBAD Layout,Kumbalagudu",
        "landmark": "Behind Prajavani Press",
        "full_address": ""
    }
}

//Mobile
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
    "whId": "WMF2"
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
    mobile: mobile,
    karnatakaWhAddress: karnatakaWhAddress,
    TelanganaWhAddress: TelanganaWhAddress
};