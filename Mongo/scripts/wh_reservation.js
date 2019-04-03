
var async = require("async");
var _ = require("lodash");
var mongoShell = require("mongojs");
var jsonexport = require('jsonexport');
var fs = require("fs");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
const readline = require('readline');
puttu.connect();

/* -------------------------DB CONNECTION------------------------------- */
var url = "mongodb://localhost/QA_Bug";
var db = mongoShell(url);
/*---------------------------------------------------------------------- */

var json_input = [
    {
        "snapShotId": "WH14155",
        "warehouseId": "WMF0",
        "productId": "PR10743",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108901526382228002",
        "lastUpdated": "2018-05-15T11:03:48.115Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.115Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae15e8918e4c82631cb9f56",
            "subOrderId": "OR2018042613820_4",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14155",
        "warehouseId": "WMF0",
        "productId": "PR10743",
        "requestQty": 4,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108911526382228002",
        "lastUpdated": "2018-05-15T11:03:48.116Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.116Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae19d3a5d7948260690ca80",
            "subOrderId": "OR2018042613835_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14155",
        "warehouseId": "WMF0",
        "productId": "PR10743",
        "requestQty": 1,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108921526382228002",
        "lastUpdated": "2018-05-15T11:03:48.117Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.117Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae19d3a18e4c82631cb9fe0",
            "subOrderId": "OR2018042613836_3",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 3,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108931526382228003",
        "lastUpdated": "2018-05-15T11:03:48.119Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.119Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae3419197e35f2e74e40116",
            "subOrderId": "OR2018042713982_1",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 3,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108941526382228003",
        "lastUpdated": "2018-05-15T11:03:48.119Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.119Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae45b5c55fcd326003f9b32",
            "subOrderId": "OR2018042814071_5",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14176",
        "warehouseId": "WMF0",
        "productId": "PR13747",
        "requestQty": 10,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108951526382228003",
        "lastUpdated": "2018-05-15T11:03:48.120Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.120Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae462f755fcd326003f9b63",
            "subOrderId": "OR2018042814075_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14178",
        "warehouseId": "WMF0",
        "productId": "PR13748",
        "requestQty": 10,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108961526382228003",
        "lastUpdated": "2018-05-15T11:03:48.121Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.121Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae462f755fcd326003f9b61",
            "subOrderId": "OR2018042814075_3",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108971526382228003",
        "lastUpdated": "2018-05-15T11:03:48.122Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.122Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae4784155fcd326003f9ba8",
            "subOrderId": "OR2018042814093_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108981526382228003",
        "lastUpdated": "2018-05-15T11:03:48.123Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.123Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae5909b18e4c82631cba4b4",
            "subOrderId": "OR2018042914142_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10108991526382228003",
        "lastUpdated": "2018-05-15T11:03:48.124Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.124Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae591f497e35f2e74e4036c",
            "subOrderId": "OR2018042914143_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 7,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109001526382228003",
        "lastUpdated": "2018-05-15T11:03:48.125Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.125Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae601e055fcd326003f9cc8",
            "subOrderId": "OR2018042914175_1",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109011526382228003",
        "lastUpdated": "2018-05-15T11:03:48.126Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.126Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae6b29197e35f2e74e40403",
            "subOrderId": "OR2018043014197_4",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109021526382228003",
        "lastUpdated": "2018-05-15T11:03:48.127Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.127Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae6c13897e35f2e74e40486",
            "subOrderId": "OR2018043014221_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109031526382228004",
        "lastUpdated": "2018-05-15T11:03:48.127Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.127Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae6c70a55fcd326003f9e3c",
            "subOrderId": "OR2018043014228_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109041526382228004",
        "lastUpdated": "2018-05-15T11:03:48.127Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.127Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae6d94797e35f2e74e405c8",
            "subOrderId": "OR2018043014267_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109051526382228004",
        "lastUpdated": "2018-05-15T11:03:48.129Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.129Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae6e09955fcd326003f9f78",
            "subOrderId": "OR2018043014280_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109061526382228004",
        "lastUpdated": "2018-05-15T11:03:48.129Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.129Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae72d1e18e4c82631cba994",
            "subOrderId": "OR2018043014376_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14169",
        "warehouseId": "WMF0",
        "productId": "PR10741",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109071526382228004",
        "lastUpdated": "2018-05-15T11:03:48.130Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.130Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5ae73f43802e9e0a9ec628e8",
            "subOrderId": "OR2018043014383_2",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14172",
        "warehouseId": "WMF0",
        "productId": "PR13744",
        "requestQty": 8,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109081526382228004",
        "lastUpdated": "2018-05-15T11:03:48.130Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.130Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5af17c3bd3304a4c6a958b98",
            "subOrderId": "OR2018050814761_1",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14163",
        "warehouseId": "WMF0",
        "productId": "PR14921",
        "requestQty": 1,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109091526382228005",
        "lastUpdated": "2018-05-15T11:03:48.130Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.130Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5af42dd4a2f9ba6b76cad943",
            "subOrderId": "OR2018051014851_1",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14141",
        "warehouseId": "WMF0",
        "productId": "PR13552",
        "requestQty": 1,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109101526382228005",
        "lastUpdated": "2018-05-15T11:03:48.131Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.131Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5afa450f2d703161e54b0f73",
            "subOrderId": "OR2018051515192_1",
            "grn": "GRN421"
        }
    },
    {
        "snapShotId": "WH14153",
        "warehouseId": "WMF0",
        "productId": "PR11154",
        "requestQty": 2,
        "referenceType": "GRN Reservation",
        "createdBy": "",
        "_id": "10109111526382228005",
        "lastUpdated": "2018-05-15T11:03:48.131Z",
        "deleted": false,
        "createdAt": "2018-05-15T11:03:48.131Z",
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [],
        "status": "Pending",
        "reference": {
            "objectId": "5afa450f2d703161e54b0f6b",
            "subOrderId": "OR2018051515192_5",
            "grn": "GRN421"
        }
    }
]


function run() {
    var queue = async.queue(function (ledger, queueCB) {
        db.collection('stockledgers').findOne({ _id: ledger._id }, function (err, ledgerDoc) {
            if (ledgerDoc) {
                db.collection('stockledgers').update({ _id: ledger._id }, { "$inc": { "stockTransaction.1.quantity": ledger.requestQty, "stockTransaction.1.onHold": ledger.requestQty * (-1) }, "$set": { "status": "Failed" } }, { new: true }, function (err, newLedger) {
                    if (newLedger) {
                        //warehouses
                        db.collection('warehouses').update({ _id: ledger.snapShotId }, { "$inc": { "quantity": ledger.requestQty, "onHold": ledger.requestQty * (-1) } }, { new: true }, function (err, newWh) {
                            if (newWh) {
                                queueCB(null);
                            } else {
                                queueCB(null);
                            }
                        });
                    }
                });
            }
        });
    });

    queue.drain = function () {
        console.log("Successfully ran....");
        process.exit();
    };

    queue.push(json_input, function (err, result) {
        if (err)
            console.log("ERROR: ", err);
    });
}


run();