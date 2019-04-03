var _ = require("lodash");

var sourceOrder = [/* 1 */
    {
        "_id": "OR2018041715",
        "stockAllocation": "NotAllocated",
        "subOrders": {
            "id": "D10021",
            "name": "Engage On Woman Pocket Perfume - Sweet Blossom (18ml)",
            "shipsIn": "24-48 Hrs",
            "mrp": 60,
            "memberPrice": 0,
            "b2bPrice": 51,
            "orgPrice": 51,
            "invoice_seperately": false,
            "quantity": 2,
            "price": 51,
            "kingsale": "",
            "_id": "OR2018041715_1",
            "logs": [
                {
                    "status": "Order Placed",
                  
                },
                {
                    "status": "Order Confirmed",
                    
                }
            ],
            "batchId": "",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": false,
            "readyForBatching": false,
            "gotRequestedProducts": true,
            "snapshots": [],
            "blockedProducts": [],
            "requestedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 2,
                    "_id": "5ad5a6f80e4dc8537f9dcace"
                }
            ],
            "internalStatus": "Confirmed",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Confirmed",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "Engage On Woman Pocket Perfume - Sweet Blossom (18ml)",
                    "mrp": 60,
                    "HSNNumber": "33030010",
                    "barcode": "8901725959180",
                    "skuCode": "0",
                    "brand": "BR15900",
                    "category": "C5395",
                    "quantity": 2,
                    "id": "PR10017",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": "5ad5a6f80e4dc8537f9dcacd",
                    "taxInfo": {
                        "tax": 28,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0,
                    "blockedQty": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "Engage",
                "id": "BR15900"
            },
            "category": {
                "name": "Perfume - Women",
                "id": "C5395"
            },
            "shippingCharges": 0,
            "images": [
                "00259425222890102013"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0
        },
        "gotRequestedProducts": false,
        "status": "Confirmed"
    },

    /* 2 */
    {
        "_id": "OR2018041715",
        "stockAllocation": "NotAllocated",
        "subOrders": {
            "id": "D10261",
            "name": "White Tone Face Powder (30g)",
            "shipsIn": "24-48 Hrs",
            "mrp": 55,
            "memberPrice": 0,
            "b2bPrice": 47,
            "orgPrice": 47,
            "invoice_seperately": false,
            "quantity": 3,
            "price": 47,
            "kingsale": "",
            "_id": "OR2018041715_2",
            "logs": [
                {
                    "status": "Order Placed",
                },
                {
                    "status": "Order Confirmed",
                }
            ],
            "batchId": "",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": false,
            "readyForBatching": false,
            "gotRequestedProducts": true,
            "snapshots": [],
            "blockedProducts": [],
            "requestedProducts": [
                {
                    "productId": "PR10199",
                    "quantity": 3,
                    
                }
            ],
            "internalStatus": "Confirmed",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Confirmed",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "White Tone Face Powder (30g)",
                    "mrp": 55,
                    "barcode": "8908001158077",
                    "HSNNumber": "33049110",
                    "skuCode": "0",
                    "brand": "BR12619",
                    "category": "C5191",
                    "quantity": 3,
                    "id": "PR10199",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": ("5ad5a6f80e4dc8537f9dcacb"),
                    "taxInfo": {
                        "tax": 28,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0,
                    "blockedQty": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "White Tone",
                "id": "BR12619"
            },
            "category": {
                "name": "Talcum Powder",
                "id": "C5191"
            },
            "shippingCharges": 0,
            "images": [
                "00958753959786239242"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0
        },
        "gotRequestedProducts": false,
        "status": "Confirmed"
    }]



    var source = _.find(sourceOrder , o => o.subOrders._id === "OR2018041715_1");

    console.log("---source ---" ,source);