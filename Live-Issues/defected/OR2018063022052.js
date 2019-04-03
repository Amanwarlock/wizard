var order = {
    "_id": "OR2018063022052",
    "name": "StoreKing",
    "logistics": 0,
    "orderAmount": 706.74,
    "paymentStatus": "Paid",
    "type": "Physical",
    "fulfilledBy": "MPS0",
    "orderType": "Wholesale",
    "isExclusiveType": false,
    "transactionId": "10027021530338158633",
    "remarks": "Checkout for cart scope.cartId",
    "exclusivetype": [],
    "releaseOnHoldAmount": false,
    "logs": [],
    "needOrderIdCorrection": false,
    "partnerOrderDetails": {
        "otherCharges": 0,
        "shippingCharges": 0
    },
    "mpsShipped": false,
    "commissionUpdated": false,
    "descriptiveCommission": {
        "imeiCommission": {
            "amount": 0,
            "paid": false
        },
        "physicalCommission": {
            "amount": 0,
            "paid": false
        },
        "skCommission": {
            "amount": 0,
            "paid": false
        },
        "logistics": {
            "amount": 0,
            "paid": false
        }
    },
    "skApp": true,
    "payoutHappened": false,
    "lastUpdated": ISODate("2018-07-02T09:38:33.805+05:30"),
    "createdAt": ISODate("2018-06-30T11:25:58.645+05:30"),
    "batchEnabled": true,
    "returns": [],
    "deleted": false,
    "subOrdersCreated": true,
    "deals": [
        {
            "quantity": 12,
            "id": "D0592815784",
            "_id": ObjectId("5b371ac73ac0d44f685464b2"),
            "price": 23.15
        },
        {
            "quantity": 12,
            "id": "D3699342737",
            "_id": ObjectId("5b371afa0dd3ed4f2f5e8c0e"),
            "price": 13.95
        },
        {
            "quantity": 9,
            "id": "D10393",
            "_id": ObjectId("5b371b2e29225c4f29c7306e"),
            "price": 9.3
        },
        {
            "quantity": 12,
            "id": "D9532845177",
            "_id": ObjectId("5b371b4e3ac0d44f685464be"),
            "price": 14.82
        }
    ],
    "invoices": [],
    "franchise": {
        "name": "Meenakshi Public Services",
        "city": "Sankarankovil",
        "state": "TamilNadu",
        "district": "Tirunelveli",
        "town": "Sankarankovil",
        "pincode": "627756",
        "accountId": "10000035319",
        "type": "RF",
        "parent": "F104794",
        "id": "F142882",
        "mobile": "7373745858",
        "code": "31234492",
        "address": {
            "door_no": "Shop No.1-18, Master Weaver Association Complex",
            "street": "Gomathiyapuram New 1st Street, Near Prabath Kalyana Mahal",
            "landmark": "Sankarankoil",
            "full_address": ""
        }
    },
    "date": ISODate("2018-06-30T11:25:58.643+05:30"),
    "readyForBatching": false,
    "stockAllocation": "Allocated",
    "subOrders": [
        {
            "id": "D0592815784",
            "name": "Surf Excel Detergent Bar (250g)",
            "shipsIn": "4-5 days",
            "mrp": 25,
            "memberPrice": 0,
            "b2bPrice": 23.15,
            "orgPrice": 23.15,
            "invoice_seperately": false,
            "quantity": 12,
            "price": 23.15,
            "kingsale": "",
            "_id": "OR2018063022052_1",
            "logs": [
                {
                    "status": "Order Placed",
                    "createdAt": ISODate("2018-06-30T11:25:57.447+05:30"),
                    "_id": ObjectId("5b371b6e29225c4f29c7307c")
                },
                {
                    "status": "Order Confirmed",
                    "createdAt": ISODate("2018-06-30T11:35:34.922+05:30"),
                    "_id": ObjectId("5b371dae29225c4f29c730bf")
                }
            ],
            "batchId": "BR20180702721",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": true,
            "readyForBatching": true,
            "gotRequestedProducts": false,
            "snapshots": [],
            "blockedProducts": [
                {
                    "productId": "PR11423",
                    "quantity": 12
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR11423",
                    "quantity": 24,
                    "_id": ObjectId("5b371b910dd3ed4f2f5e8c1c")
                }
            ],
            "internalStatus": "BatchEnabled",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Processing",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "Surf Excel Detergent Bar (250g)",
                    "mrp": 26,
                    "skuCode": "452680",
                    "barcode": "8901030590009",
                    "HSNNumber": "3401.19.30",
                    "brand": "BR19491",
                    "category": "C4100",
                    "quantity": 12,
                    "id": "PR11423",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": ObjectId("5b371b6e29225c4f29c7307d"),
                    "taxInfo": {
                        "tax": 18,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "Surf Excel",
                "id": "BR19491"
            },
            "category": {
                "name": "Laundry Detergent Bar",
                "id": "C4100"
            },
            "shippingCharges": 0,
            "images": [
                "06132268701638228837"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0,
            "performaInvoiceNo": "PR12528"
        },
        {
            "id": "D3699342737",
            "name": "Surf Excel Detergent Bar (150g)",
            "shipsIn": "4-5 days",
            "mrp": 15,
            "memberPrice": 0,
            "b2bPrice": 13.95,
            "orgPrice": 13.95,
            "invoice_seperately": false,
            "quantity": 12,
            "price": 13.95,
            "kingsale": "",
            "_id": "OR2018063022052_2",
            "logs": [
                {
                    "status": "Order Placed",
                    "createdAt": ISODate("2018-06-30T11:25:57.445+05:30"),
                    "_id": ObjectId("5b371b6e29225c4f29c7307a")
                },
                {
                    "status": "Order Confirmed",
                    "createdAt": ISODate("2018-06-30T11:35:34.923+05:30"),
                    "_id": ObjectId("5b371dae29225c4f29c730c0")
                }
            ],
            "batchId": "BR20180702721",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": true,
            "readyForBatching": true,
            "gotRequestedProducts": false,
            "snapshots": [],
            "blockedProducts": [
                {
                    "productId": "PR11421",
                    "quantity": 12
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR11421",
                    "quantity": 24,
                    "_id": ObjectId("5b371b910dd3ed4f2f5e8c1d")
                }
            ],
            "internalStatus": "BatchEnabled",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Processing",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "Surf Excel Detergent Bar (150g)",
                    "mrp": 15,
                    "skuCode": "453306",
                    "barcode": "8901030420719",
                    "HSNNumber": "3401.19.30",
                    "brand": "BR19491",
                    "category": "C4100",
                    "quantity": 12,
                    "id": "PR11421",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": ObjectId("5b371b6e29225c4f29c7307b"),
                    "taxInfo": {
                        "tax": 18,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "Surf Excel",
                "id": "BR19491"
            },
            "category": {
                "name": "Laundry Detergent Bar",
                "id": "C4100"
            },
            "shippingCharges": 0,
            "images": [
                "00059163532398211388"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0,
            "performaInvoiceNo": "PR12528"
        },
        {
            "id": "D10393",
            "name": "Vim Dishwash Bar (125g)",
            "shipsIn": "4-5 days",
            "mrp": 10,
            "memberPrice": 0,
            "b2bPrice": 9.3,
            "orgPrice": 9.3,
            "invoice_seperately": false,
            "quantity": 9,
            "price": 9.3,
            "kingsale": "",
            "_id": "OR2018063022052_3",
            "logs": [
                {
                    "status": "Order Placed",
                    "createdAt": ISODate("2018-06-30T11:25:57.422+05:30"),
                    "_id": ObjectId("5b371b6e29225c4f29c73078")
                },
                {
                    "status": "Order Confirmed",
                    "createdAt": ISODate("2018-06-30T11:35:34.924+05:30"),
                    "_id": ObjectId("5b371dae29225c4f29c730c1")
                }
            ],
            "batchId": "BR20180702721",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": true,
            "readyForBatching": true,
            "gotRequestedProducts": false,
            "snapshots": [],
            "blockedProducts": [
                {
                    "productId": "PR10391",
                    "quantity": 9
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR10391",
                    "quantity": 18,
                    "_id": ObjectId("5b371b910dd3ed4f2f5e8c1e")
                }
            ],
            "internalStatus": "BatchEnabled",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Processing",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "Vim Dishwash Bar (125g)",
                    "mrp": 10,
                    "barcode": "8901030543753",
                    "skuCode": "13016",
                    "HSNNumber": "3405.40.00",
                    "brand": "BR14976",
                    "category": "C4113",
                    "quantity": 9,
                    "id": "PR10391",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": ObjectId("5b371b6e29225c4f29c73079"),
                    "taxInfo": {
                        "tax": 18,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "Vim",
                "id": "BR14976"
            },
            "category": {
                "name": "Dishwash Bar",
                "id": "C4113"
            },
            "shippingCharges": 0,
            "images": [
                "16583072323745348249"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0,
            "performaInvoiceNo": "PR12528"
        },
        {
            "id": "D9532845177",
            "name": "Rin Detergent Bar (250g)",
            "shipsIn": "4-5 days",
            "mrp": 16,
            "memberPrice": 0,
            "b2bPrice": 14.82,
            "orgPrice": 14.82,
            "invoice_seperately": false,
            "quantity": 12,
            "price": 14.82,
            "kingsale": "",
            "_id": "OR2018063022052_4",
            "logs": [
                {
                    "status": "Order Placed",
                    "createdAt": ISODate("2018-06-30T11:25:57.400+05:30"),
                    "_id": ObjectId("5b371b6e29225c4f29c73076")
                },
                {
                    "status": "Order Confirmed",
                    "createdAt": ISODate("2018-06-30T11:35:34.924+05:30"),
                    "_id": ObjectId("5b371dae29225c4f29c730c2")
                }
            ],
            "batchId": "BR20180702721",
            "invoiced": false,
            "readyToShip": false,
            "inwardScan": false,
            "processed": true,
            "readyForBatching": true,
            "gotRequestedProducts": false,
            "snapshots": [],
            "blockedProducts": [
                {
                    "productId": "PR11430",
                    "quantity": 12
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR11430",
                    "quantity": 24,
                    "_id": ObjectId("5b371b910dd3ed4f2f5e8c1f")
                }
            ],
            "internalStatus": "BatchEnabled",
            "commission": {
                "paid": false,
                "perc": 0,
                "amount": 0
            },
            "status": "Processing",
            "kingsaleDisc": 0,
            "couponDisc": 0,
            "products": [
                {
                    "name": "Rin Detergent Bar (250g)",
                    "mrp": 16,
                    "skuCode": "452670",
                    "barcode": "8901030662140",
                    "HSNNumber": "3402.20.10",
                    "brand": "BR15841",
                    "category": "C4100",
                    "quantity": 12,
                    "id": "PR11430",
                    "barcodeScanned": false,
                    "imeiCommAvailable": false,
                    "stickyOrderPrice": false,
                    "collectSerialNumber": false,
                    "_id": ObjectId("5b371b6e29225c4f29c73077"),
                    "taxInfo": {
                        "tax": 18,
                        "isDefaultHSN": true,
                        "spMargin": 100
                    },
                    "snapShot": [],
                    "images": [],
                    "returnedQuantity": 0
                }
            ],
            "claimed": 0,
            "brand": {
                "name": "Rin",
                "id": "BR15841"
            },
            "category": {
                "name": "Laundry Detergent Bar",
                "id": "C4100"
            },
            "shippingCharges": 0,
            "images": [
                "00164998883321777652"
            ],
            "encryptedShipmentId": "0",
            "cashOnDeliveryCharge": 0,
            "performaInvoiceNo": "PR12528"
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
    "discount": 0,
    "notification": {
        "Delivered": true,
        "Partially Delivered": true,
        "Closed": true,
        "Shipped": true,
        "Partially Shipped": true,
        "Processing": false,
        "Cancelled": true,
        "Invoiced": true,
        "Confirmed": true,
        "Payment Initiated": true,
        "Created": false
    },
    "status": "Processing",
    "kingsale": [],
    "kingsaleDisc": 0,
    "couponDisc": 0,
    "coupon": {
        "isCouponUpdated": false,
        "isCouponUsed": false,
        "couponDiscPerDeal": [],
        "discount": 0
    },
    "useWallet": true,
    "vatFixed": false,
    "autoConfirm": true,
    "autoCancel": true,
    "isOffline": false,
    "typeOfOrder": "SK",
    "__v": 3,
    "commission": {

    },
    "billingAddress": {
        "pincode": 627756,
        "state": "TamilNadu",
        "district": "Tirunelveli",
        "city": "Sankarankovil",
        "landmark": "Sankarankoil",
        "line2": "",
        "line1": "Shop No.1-18, Master Weaver Association Complex"
    },
    "paymentMode": "Cash",
    "shippingAddress": {
        "line1": null,
        "line2": null,
        "landmark": "Sankarankoil",
        "city": "Sankarankovil",
        "district": "Tirunelveli",
        "state": "TamilNadu",
        "pincode": 627756
    },
    "paymentDate": ISODate("2018-06-30T11:35:34.921+05:30"),
    "paymentTransactionId": "10000091530338734753"
}