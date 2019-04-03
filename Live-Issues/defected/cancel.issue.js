db.getCollection("omsmasters").update({ _id: "OR2018071625961" }, {
    $set: {
        "name": "StoreKing",
        "logistics": 7.5,
        "fulfilledBy": "MPS0",
        "orderAmount": 712.53,
        "paymentStatus": "Paid",
        "type": "Physical",
        "orderType": "Wholesale",
        "isExclusiveType": false,
        "transactionId": "10037471531720986650",
        "remarks": "Checkout for cart scope.cartId",
        "exclusivetype": [],
        "releaseOnHoldAmount": false,
        "logs": [],
        "needOrderIdCorrection": false,
        "partnerOrderDetails": {
            "otherCharges": NumberInt("0"),
            "shippingCharges": NumberInt("0")
        },
        "mpsShipped": false,
        "commissionUpdated": false,
        "descriptiveCommission": {
            "imeiCommission": {
                "amount": NumberInt("0"),
                "paid": false
            },
            "physicalCommission": {
                "amount": NumberInt("0"),
                "paid": false
            },
            "skCommission": {
                "amount": NumberInt("0"),
                "paid": false
            },
            "logistics": {
                "amount": NumberInt("0"),
                "paid": false
            }
        },
        "skApp": true,
        "payoutHappened": false,
        "lastUpdated": ISODate("2018-07-29T11:20:41.413+05:30"),
        "createdAt": ISODate("2018-07-16T11:33:06.662+05:30"),
        "batchEnabled": true,
        "returns": [],
        "deleted": false,
        "subOrdersCreated": true,
        "deals": [
            {
                "quantity": NumberInt("1"),
                "id": "D10245",
                "_id": ObjectId("5a771722cc84b6514a2439ad"),
                "price": 45.83
            },
            {
                "quantity": NumberInt("1"),
                "id": "D3699342737",
                "_id": ObjectId("5a7ea3a73c39772ff34ab37d"),
                "price": 13.95
            },
            {
                "quantity": NumberInt("1"),
                "id": "D10062",
                "_id": ObjectId("5b36ebf22c3a4761920af12c"),
                "price": 45.56
            },
            {
                "quantity": NumberInt("6"),
                "id": "D10056",
                "_id": ObjectId("5b36ebf79d4b08765e6f7379"),
                "price": 9.26
            },
            {
                "quantity": NumberInt("6"),
                "id": "D0253822739",
                "_id": ObjectId("5b36ed8b2c3a4761920af133"),
                "price": 9.1
            },
            {
                "quantity": NumberInt("3"),
                "id": "D8828439762",
                "_id": ObjectId("5b36f0232c3a4761920af139"),
                "price": 45.57
            },
            {
                "quantity": NumberInt("1"),
                "id": "D5984513718",
                "_id": ObjectId("5b4c342964caec5041d9964b"),
                "price": 352.82
            }
        ],
        "invoices": [
            {
                "invoiceNo": "IN17100013463",
                "amount": 360.32,
                "_id": ObjectId("5b4c70f081c0ce76afb24cf3"),
                "isCustomerReturn": false,
                "processRefund": false,
                "isRTO": false,
                "isCulled": false,
                "commissionReleased": "Released",
                "logisticsChargesIncluded": true,
                "status": "New",
                "boxId": "BX1",
                "shippedOn": ISODate("2018-07-16T17:31:18.186+05:30")
            },
            {
                "invoiceNo": "IN17100015950",
                "amount": 169.94,
                "_id": ObjectId("5b5955cb6875ae3a71a8883c"),
                "isCustomerReturn": false,
                "processRefund": false,
                "isRTO": false,
                "isCulled": false,
                "commissionReleased": "Released",
                "logisticsChargesIncluded": false,
                "status": "New",
                "boxId": "BX1",
                "shippedOn": ISODate("2018-07-26T13:34:14.842+05:30")
            },
            {
                "invoiceNo": "IN17100016481",
                "amount": 136.71,
                "_id": ObjectId("5b5c3971f9717619a7eae497"),
                "isCustomerReturn": false,
                "processRefund": false,
                "isRTO": false,
                "isCulled": false,
                "commissionReleased": "Released",
                "logisticsChargesIncluded": false,
                "status": "New",
                "boxId": "BX1",
                "shippedOn": ISODate("2018-07-29T11:20:41.227+05:30")
            }
        ],
        "warehouseDetails": {
            "gstno": "29AACCL2418A1ZZ",
            "serviceTax": "AACCL2418ASD001",
            "vat": "29230678061",
            "cinno": "U51909KA2012PTC063576"
        },
        "warehouseAddress": {
            "name": "Sk Mobile Warehouse",
            "companyName": "Localcube Commerce Pvt Ltd.",
            "doorNo": "# 21/A-B,2nd Phase",
            "street": "",
            "landmark": "Opposite Fetherlite Furnitures",
            "city": "Kumbalgudu",
            "district": "Bangalore Rural",
            "state": "Karnataka",
            "pincode": "560074"
        },
        "franchise": {
            "name": "Sadguru Mobile Shop",
            "city": "Nagardhan",
            "state": "Maharashtra",
            "district": "Nagpur",
            "town": "Nagardhan",
            "pincode": "441106",
            "accountId": "10000033910",
            "type": "RF",
            "parent": "F104729",
            "id": "F141467",
            "mobile": "9890628495",
            "code": "32756858",
            "address": {
                "door_no": "00",
                "street": "Hamlapuri Road, Near Gandhi Chowk",
                "landmark": "Nagardhan",
                "full_address": ""
            }
        },
        "date": ISODate("2018-07-16T11:33:06.658+05:30"),
        "mpsOrderType": "SKOrder",
        "readyForBatching": false,
        "stockAllocation": "Allocated",
        "subOrders": [
            {
                "id": "D10245",
                "name": "Fair & Lovely Advanced Daily Fairness Expert Cream - Multi Vitamin (25g)",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("50"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 45.83,
                "orgPrice": 45.83,
                "invoice_seperately": false,
                "quantity": NumberInt("1"),
                "price": 45.83,
                "kingsale": "",
                "_id": "OR2018071625961_1",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.451+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d9966a")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.882+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d99688")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-26T10:32:03.493+05:30"),
                        "_id": ObjectId("5b5955cb6875ae3a71a88838")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-26T13:33:10.363+05:30"),
                        "_id": ObjectId("5b59803e2d445569f3747cb5")
                    }
                ],
                "batchId": "BR2018072458A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10087881531816259995",
                        "snapShotId": "WH18561",
                        "whId": "WMF0",
                        "productId": "PR10248",
                        "quantity": NumberInt("0"),
                        "mrp": NumberInt("50"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-10",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-17T14:01:00.193+05:30")
                    },
                    {
                        "type": "Reserved",
                        "binId": "Bin-1",
                        "rackId": "Rack-1",
                        "area": "NormalAR-WMF0-10",
                        "location": "Normal",
                        "mrp": NumberInt("50"),
                        "quantity": NumberInt("0"),
                        "productId": "PR10248",
                        "whId": "WMF0",
                        "snapShotId": "WH18562",
                        "ledgerId": "10047441532326712374",
                        "_id": ObjectId("5b55733858beab24d01665c8"),
                        "serialNo": [],
                        "barcode": []
                    },
                    {
                        "type": "Reserved",
                        "binId": "Bin-1",
                        "rackId": "Rack-1",
                        "area": "NormalAR-WMF0-10",
                        "location": "Normal",
                        "mrp": NumberInt("50"),
                        "quantity": NumberInt("1"),
                        "productId": "PR10248",
                        "whId": "WMF0",
                        "snapShotId": "WH18563",
                        "ledgerId": "10048351532326840149",
                        "_id": ObjectId("5b5573b84106ac176730e461"),
                        "serialNo": [],
                        "barcode": []
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR10248",
                        "quantity": NumberInt("1")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR10248",
                        "quantity": NumberInt("1"),
                        "_id": ObjectId("5b4c352264caec5041d99674")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Fair & Lovely Advanced Daily Fairness Expert Cream - Multi Vitamin (25g)",
                        "mrp": NumberInt("50"),
                        "barcode": "8901030637377",
                        "skuCode": "12014",
                        "HSNNumber": "3304.99.10",
                        "brand": "BR16109",
                        "category": "C5204",
                        "quantity": NumberInt("1"),
                        "id": "PR10248",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d9966b"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Fair & Lovely",
                    "id": "BR16109"
                },
                "category": {
                    "name": "Cream & Lotion",
                    "id": "C5204"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "98491370462168233012"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR17654",
                "invoiceNo": "IN17100015950"
            },
            {
                "id": "D3699342737",
                "name": "Surf Excel Detergent Bar (150g)",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("15"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 13.95,
                "orgPrice": 13.95,
                "invoice_seperately": false,
                "quantity": NumberInt("1"),
                "price": 13.95,
                "kingsale": "",
                "_id": "OR2018071625961_2",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.450+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d99668")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.882+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d99689")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-26T10:32:03.493+05:30"),
                        "_id": ObjectId("5b5955cb6875ae3a71a88839")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-26T13:33:10.364+05:30"),
                        "_id": ObjectId("5b59803e2d445569f3747cb6")
                    }
                ],
                "batchId": "BR2018072458A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10063331532329194137",
                        "snapShotId": "WH18714",
                        "whId": "WMF0",
                        "productId": "PR11421",
                        "quantity": NumberInt("1"),
                        "mrp": NumberInt("15"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-13",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-23T12:29:54.388+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR11421",
                        "quantity": NumberInt("1")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR11421",
                        "quantity": NumberInt("1"),
                        "_id": ObjectId("5b4c352264caec5041d99675")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Surf Excel Detergent Bar (150g)",
                        "mrp": NumberInt("15"),
                        "skuCode": "453306",
                        "barcode": "8901030420719",
                        "HSNNumber": "3401.19.30",
                        "brand": "BR19491",
                        "category": "C4100",
                        "quantity": NumberInt("1"),
                        "id": "PR11421",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d99669"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Surf Excel",
                    "id": "BR19491"
                },
                "category": {
                    "name": "Laundry Detergent Bar",
                    "id": "C4100"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "00059163532398211388"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR17654",
                "invoiceNo": "IN17100015950"
            },
            {
                "id": "D10062",
                "name": "Godrej No.1 Bathing Soap - Glycerin and Honey (75g x 3 pcs)",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("68"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 45.56,
                "orgPrice": 45.56,
                "invoice_seperately": false,
                "quantity": NumberInt("1"),
                "price": 45.56,
                "kingsale": "",
                "_id": "OR2018071625961_3",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.304+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d99666")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.883+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d9968a")
                    }
                ],
                "batchId": "",
                "invoiced": false,
                "readyToShip": false,
                "inwardScan": false,
                "processed": false,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10037501531720994967",
                        "snapShotId": "WH16248",
                        "whId": "WMF0",
                        "productId": "PR10057",
                        "quantity": NumberInt("1"),
                        "mrp": NumberInt("68"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-1",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-16T11:33:15.428+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR10057",
                        "quantity": NumberInt("1")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR10057",
                        "quantity": NumberInt("1"),
                        "_id": ObjectId("5b4c352264caec5041d99676")
                    }
                ],
                "internalStatus": "Confirmed",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Confirmed",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Godrej No.1 Bathing Soap - Glycerin and Honey (75g x 3 pcs)",
                        "mrp": NumberInt("68"),
                        "barcode": "8901023013430",
                        "HSNNumber": "34011190",
                        "skuCode": "0",
                        "brand": "BR10189",
                        "category": "C4788",
                        "quantity": NumberInt("1"),
                        "id": "PR10057",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d99667"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Godrej",
                    "id": "BR10189"
                },
                "category": {
                    "name": "Soap",
                    "id": "C4788"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "02210315694380767536"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0")
            },
            {
                "id": "D10056",
                "name": "Lux Soap - Pink (51g)",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("10"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 9.26,
                "orgPrice": 9.26,
                "invoice_seperately": false,
                "quantity": NumberInt("6"),
                "price": 9.26,
                "kingsale": "",
                "_id": "OR2018071625961_4",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.543+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d99664")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.883+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d9968b")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-26T10:32:03.494+05:30"),
                        "_id": ObjectId("5b5955cb6875ae3a71a8883a")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-26T13:33:10.364+05:30"),
                        "_id": ObjectId("5b59803e2d445569f3747cb7")
                    }
                ],
                "batchId": "BR2018072458A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10064131532329302617",
                        "snapShotId": "WH18715",
                        "whId": "WMF0",
                        "productId": "PR10158",
                        "quantity": NumberInt("6"),
                        "mrp": NumberInt("10"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-13",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-23T12:31:42.707+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR10158",
                        "quantity": NumberInt("6")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR10158",
                        "quantity": NumberInt("6"),
                        "_id": ObjectId("5b4c352264caec5041d99677")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Lux Soap - Pink (51g)",
                        "mrp": NumberInt("10"),
                        "barcode": "8901030572784",
                        "skuCode": "17043",
                        "HSNNumber": "3401.11.90",
                        "brand": "BR14057",
                        "category": "C4788",
                        "quantity": NumberInt("6"),
                        "id": "PR10158",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d99665"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Lux",
                    "id": "BR14057"
                },
                "category": {
                    "name": "Soap",
                    "id": "C4788"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "00042451172083422989"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR17654",
                "invoiceNo": "IN17100015950"
            },
            {
                "id": "D0253822739",
                "name": "Colgate (Rs. 10) Maxfresh Toothpaste - Red Gel (24g)",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("10"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 9.1,
                "orgPrice": 9.1,
                "invoice_seperately": false,
                "quantity": NumberInt("6"),
                "price": 9.1,
                "kingsale": "",
                "_id": "OR2018071625961_5",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.278+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d99662")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.883+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d9968c")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-26T10:32:03.494+05:30"),
                        "_id": ObjectId("5b5955cb6875ae3a71a8883b")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-26T13:33:10.364+05:30"),
                        "_id": ObjectId("5b59803e2d445569f3747cb8")
                    }
                ],
                "batchId": "BR2018072458A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10064921532329433860",
                        "snapShotId": "WH18716",
                        "whId": "WMF0",
                        "productId": "PR11454",
                        "quantity": NumberInt("6"),
                        "mrp": NumberInt("10"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-13",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-23T12:33:53.959+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR11454",
                        "quantity": NumberInt("6")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR11454",
                        "quantity": NumberInt("6"),
                        "_id": ObjectId("5b4c352264caec5041d99678")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Colgate (Rs. 10) Maxfresh Toothpaste - Red Gel (24g)",
                        "mrp": NumberInt("10"),
                        "skuCode": "459209",
                        "barcode": "8901314306425",
                        "HSNNumber": "3306.10.20",
                        "brand": "BR11931",
                        "category": "C4779",
                        "quantity": NumberInt("6"),
                        "id": "PR11454",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d99663"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Colgate",
                    "id": "BR11931"
                },
                "category": {
                    "name": "Toothpaste",
                    "id": "C4779"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "84203310554344327368"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR17654",
                "invoiceNo": "IN17100015950"
            },
            {
                "id": "D8828439762",
                "name": "Tide Plus Detergent Powder (500g)",
                "shipsIn": "72-96 Hrs",
                "mrp": NumberInt("49"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 45.57,
                "orgPrice": 45.57,
                "invoice_seperately": false,
                "quantity": NumberInt("3"),
                "price": 45.57,
                "kingsale": "",
                "_id": "OR2018071625961_6",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.565+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d99660")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.883+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d9968d")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-28T15:07:53.716+05:30"),
                        "_id": ObjectId("5b5c3971f9717619a7eae496")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-29T11:14:59.253+05:30"),
                        "_id": ObjectId("5b5d545bf9717619a7eae94f")
                    }
                ],
                "batchId": "BR20180728103A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10065801532329550510",
                        "snapShotId": "WH18717",
                        "whId": "WMF0",
                        "productId": "PR14420",
                        "quantity": NumberInt("2"),
                        "mrp": NumberInt("49"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-13",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-23T12:35:50.668+05:30")
                    },
                    {
                        "ledgerId": "10176711532350523775",
                        "snapShotId": "WH18761",
                        "whId": "WMF0",
                        "productId": "PR14420",
                        "quantity": NumberInt("1"),
                        "mrp": NumberInt("49"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-11",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-23T18:25:23.871+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR14420",
                        "quantity": NumberInt("3")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR14420",
                        "quantity": NumberInt("3"),
                        "_id": ObjectId("5b4c352264caec5041d99679")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "Tide Plus Detergent Powder (500g)",
                        "skuCode": "472132",
                        "mrp": NumberInt("49"),
                        "barcode": "47213200",
                        "HSNNumber": "00003402",
                        "brand": "BR19817",
                        "category": "C4118",
                        "quantity": NumberInt("3"),
                        "id": "PR14420",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d99661"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": NumberInt("100")
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Tide",
                    "id": "BR19817"
                },
                "category": {
                    "name": "Laundry Detergent Powder",
                    "id": "C4118"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "00051316829775915354"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR18689",
                "invoiceNo": "IN17100016481"
            },
            {
                "id": "D5984513718",
                "name": "KPB - FREE Get 1 Micro SD Card Reader + Sandisk 16 GB MicroSD Card Class 4 Memory Card",
                "shipsIn": "4-5 days",
                "mrp": NumberInt("620"),
                "memberPrice": NumberInt("0"),
                "b2bPrice": 352.82,
                "orgPrice": 352.82,
                "invoice_seperately": false,
                "quantity": NumberInt("1"),
                "price": 352.82,
                "kingsale": "",
                "_id": "OR2018071625961_7",
                "logs": [
                    {
                        "status": "Order Placed",
                        "createdAt": ISODate("2018-07-16T11:33:04.559+05:30"),
                        "_id": ObjectId("5b4c351a64caec5041d9965d")
                    },
                    {
                        "status": "Order Confirmed",
                        "createdAt": ISODate("2018-07-16T11:33:15.883+05:30"),
                        "_id": ObjectId("5b4c352364caec5041d9968e")
                    },
                    {
                        "status": "Invoiced",
                        "createdAt": ISODate("2018-07-16T15:48:24.269+05:30"),
                        "_id": ObjectId("5b4c70f081c0ce76afb24cf2")
                    },
                    {
                        "status": "Packed",
                        "createdAt": ISODate("2018-07-16T16:55:33.706+05:30"),
                        "_id": ObjectId("5b4c80ad6cdbfa330578f590")
                    }
                ],
                "batchId": "BR10052A",
                "invoiced": true,
                "readyToShip": false,
                "inwardScan": false,
                "processed": true,
                "readyForBatching": true,
                "gotRequestedProducts": false,
                "snapshots": [
                    {
                        "ledgerId": "10037521531720994969",
                        "snapShotId": "WH17978",
                        "whId": "WMF0",
                        "productId": "PR13746",
                        "quantity": NumberInt("1"),
                        "mrp": NumberInt("30"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-5",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-16T11:33:15.427+05:30")
                    },
                    {
                        "ledgerId": "10037511531720994969",
                        "snapShotId": "WH17382",
                        "whId": "WMF0",
                        "productId": "PR13744",
                        "quantity": NumberInt("1"),
                        "mrp": NumberInt("590"),
                        "location": "Normal",
                        "area": "NormalAR-WMF0-2",
                        "rackId": "Rack-1",
                        "binId": "Bin-1",
                        "type": "Reserved",
                        "createdAt": ISODate("2018-07-16T11:33:15.428+05:30")
                    }
                ],
                "blockedProducts": [
                    {
                        "productId": "PR13746",
                        "quantity": NumberInt("1")
                    },
                    {
                        "productId": "PR13744",
                        "quantity": NumberInt("1")
                    }
                ],
                "requestedProducts": [
                    {
                        "productId": "PR13744",
                        "quantity": NumberInt("1"),
                        "_id": ObjectId("5b4c352264caec5041d9967b")
                    },
                    {
                        "productId": "PR13746",
                        "quantity": NumberInt("1"),
                        "_id": ObjectId("5b4c352264caec5041d9967a")
                    }
                ],
                "internalStatus": "Shipped",
                "commission": {
                    "paid": false,
                    "perc": NumberInt("0"),
                    "amount": NumberInt("0")
                },
                "status": "Shipped",
                "kingsaleDisc": NumberInt("0"),
                "couponDisc": NumberInt("0"),
                "products": [
                    {
                        "name": "SanDisk Class 4 MicroSD Memory Card (16GB)",
                        "mrp": NumberInt("590"),
                        "skuCode": "471442",
                        "barcode": "471442",
                        "HSNNumber": "00008523",
                        "brand": "BR17697",
                        "category": "C6226",
                        "quantity": NumberInt("1"),
                        "id": "PR13744",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d9965f"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": true,
                            "spMargin": 99.9
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    },
                    {
                        "name": "Generic Micro USB Card Reader",
                        "mrp": NumberInt("30"),
                        "skuCode": "471439",
                        "barcode": "471439",
                        "HSNNumber": "00008523",
                        "brand": "BR19006",
                        "category": "C4660",
                        "quantity": NumberInt("1"),
                        "id": "PR13746",
                        "barcodeScanned": false,
                        "imeiCommAvailable": false,
                        "stickyOrderPrice": false,
                        "collectSerialNumber": false,
                        "_id": ObjectId("5b4c351a64caec5041d9965e"),
                        "taxInfo": {
                            "tax": NumberInt("18"),
                            "isDefaultHSN": false,
                            "spMargin": 0.1
                        },
                        "returnedSerialNos": [],
                        "serialNos": [],
                        "snapShot": [],
                        "images": [],
                        "returnedQuantity": NumberInt("0")
                    }
                ],
                "claimed": NumberInt("0"),
                "brand": {
                    "name": "Generic",
                    "id": "BR19006"
                },
                "category": {
                    "name": "Card Reader",
                    "id": "C4660"
                },
                "shippingCharges": NumberInt("0"),
                "images": [
                    "54538746472375421335"
                ],
                "encryptedShipmentId": "0",
                "cashOnDeliveryCharge": NumberInt("0"),
                "performaInvoiceNo": "PR15634",
                "invoiceNo": "IN17100013463"
            }
        ],
        "gotRequestedProducts": true,
        "disabledBatch": false,
        "commissionReleasedAt": "Shipped",
        "source": "WMF0",
        "invoiced": false,
        "readyToShip": false,
        "processed": true,
        "inwardScan": false,
        "discount": NumberInt("0"),
        "notification": {
            "Delivered": true,
            "Partially Delivered": true,
            "Closed": true,
            "Shipped": true,
            "Partially Shipped": false,
            "Processing": false,
            "Cancelled": true,
            "Invoiced": true,
            "Confirmed": true,
            "Payment Initiated": true,
            "Created": false
        },
        "status": "Partially Shipped",
        "kingsale": [],
        "kingsaleDisc": NumberInt("0"),
        "couponDisc": NumberInt("0"),
        "coupon": {
            "discount": NumberInt("0"),
            "couponDiscPerDeal": [],
            "isCouponUsed": false,
            "isCouponUpdated": false
        },
        "useWallet": true,
        "vatFixed": false,
        "autoConfirm": true,
        "autoCancel": true,
        "isOffline": false,
        "typeOfOrder": "SK",
        "__v": NumberInt("2"),
        "commission": {

        },
        "billingAddress": {
            "pincode": NumberInt("441106"),
            "state": "Maharashtra",
            "district": "Nagpur",
            "city": "Nagardhan",
            "landmark": "Nagardhan",
            "line2": "",
            "line1": "00"
        },
        "paymentMode": "Cash",
        "shippingAddress": {
            "line1": null,
            "line2": null,
            "landmark": "Nagardhan",
            "city": "Nagardhan",
            "district": "Nagpur",
            "state": "Maharashtra",
            "pincode": NumberInt("441106")
        },
        "paymentDate": ISODate("2018-07-16T11:33:15.881+05:30"),
        "paymentTransactionId": "10000261531720994577"
    }
})