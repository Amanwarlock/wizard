

/*
2018-08-30T10:16:32.374+05:30 - reserve created
2018-08-30T10:16:32.829+05:30 - reserve updated

2018-08-30T10:16:32.609+05:30 - release created
2018-08-30T10:16:32.699+05:30 - release updated
*/


var ledgers = [
    /* 3 */
    {
        "_id": "10043541535604392288",
        "snapShotId": "WH23978",
        "warehouseId": "WMF0",
        "productId": "PR15962",
        "requestQty": 1,
        "referenceType": "Invoice reserved",
        "lastUpdated": ISODate("2018-08-30T10:16:32.829+05:30"),
        "deleted": false,
        "createdAt": ISODate("2018-08-30T10:16:32.374+05:30"),
        "stockTransaction": [
            {
                "_id": "WH23978",
                "quantity": 253,
                "onHold": 0,
                "state": "before"
            },
            {
                "_id": "WH23978",
                "quantity": 252,
                "onHold": 1,
                "state": "after"
            }
        ],
        "barcode": [
            "6941059601791"
        ],
        "serialNo": [],
        "status": "Committed",
        "reference": {
            "subOrderId": "OR2018082954081_4",
            "invoiceNo": "IN17100028204",
            "performaId": "PR40546",
            "batchId": "BR20180830967A"
        },
        "mrp": 15999,
        "position": {
            "location": "Normal",
            "area": "NormalAR-WMF0-2",
            "whId": "WMF0",
            "rackId": "Rack-1",
            "binId": "Bin-1"
        },
        "log": "Quantity 1 added to onHold status"
    },

    /* 4 */
    {
        "_id": "10043601535604392586",
        "snapShotId": "WH23978",
        "warehouseId": "WMF0",
        "productId": "PR15962",
        "referenceType": "Release",
        "requestQty": 1,
        "lastUpdated": ISODate("2018-08-30T10:16:32.699+05:30"),
        "deleted": false,
        "createdAt": ISODate("2018-08-30T10:16:32.609+05:30"),
        "stockTransaction": [],
        "barcode": [],
        "serialNo": [
            "865021047966346"
        ],
        "status": "Failed",
        "reference": {
            "subOrderId": "OR2018082954081_4",
            "performaId": "PR40546",
            "invoiceNo": "IN17100028204"
        },
        "mrp": null,
        "position": null,
        "log": "Invalid requested quantity , cannot release requested quantity from hold."
    },
]