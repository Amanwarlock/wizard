var orders = [{
    "_id": "ORD1001",
    "createdAt": "2018-03-25T18:04:32.118+05:30",
    "batchEnabled": true,
    "stockAllocation": "Allocated",
    "subOrders": [
        {
            "_id": "ORD1001_1",
            "quantity": 4,
            "batchId": "BR20181001",
            "readyForBatching": true,
            "snapshots": [
                {
                    "ledgerId": "10000041521981272750",
                    "snapShotId": "WH100",
                    "productId": "PR10017",
                    "quantity": 4,
                    "type": "Reserved",
                    "createdAt": "2018-03-25T18:04:33.055+05:30"
                }
            ],
            "blockedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 4
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 4,
                    "_id": "5ab79758e248676c297ab403"
                }
            ],
            "status": "Invoiced",
            "performaInvoiceNo": "PR1054",
            "invoiceNo": "IN10001"
        }
    ],
    "status": "Processing"
},
{
    "_id": "ORD1002",
    "createdAt": "2018-03-26T18:04:32.118+05:30",
    "batchEnabled": true,
    "stockAllocation": "Allocated",
    "subOrders": [
        {
            "_id": "ORD1002_1",
            "quantity": 4,
            "batchId": "BR20181002",
            "readyForBatching": true,
            "snapshots": [
                {
                    "ledgerId": "10000041521981272750",
                    "snapShotId": "WH100",
                    "productId": "PR10017",
                    "quantity": 2,
                    "type": "Reserved",
                    "createdAt": "2018-03-25T18:04:33.055+05:30"
                },
                {
                    "ledgerId": "10000041521981272750",
                    "snapShotId": "WH200",
                    "productId": "PR10017",
                    "quantity": 2,
                    "type": "Reserved",
                    "createdAt": "2018-03-25T18:04:33.055+05:30"
                }
            ],
            "blockedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 4
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 4,
                    "_id": "5ab79758e248676c297ab403"
                }
            ],
            "status": "Invoiced",
            "performaInvoiceNo": "PR1055",
            "invoiceNo": "IN10002"
        }
    ],
    "status": "Processing"
}];

var wareHouse_1 = {
    "_id": "WH100",
    "quantity": 4,
    "mrp": 60,
    "isGoodStock": true,
    "scannedSerialNo": [],
    "serialNo": [],
    "onHold": 0,
    "barcode": [
        "BARENGAGE8346583468"
    ],
    "productId": "PR10017"
};

var wareHouse_2 = {
    "_id": "WH100",
    "quantity": 3,
    "mrp": 60,
    "isGoodStock": true,
    "scannedSerialNo": [],
    "serialNo": [],
    "onHold": 0,
    "barcode": [
        "BARENGAGE8346583468"
    ],
    "productId": "PR10017"
};

var wareHouse_3 = {
    "_id": "WH200",
    "quantity": 4,
    "mrp": 60,
    "isGoodStock": true,
    "scannedSerialNo": [],
    "serialNo": [],
    "onHold": 0,
    "barcode": [
        "BARENGO9TRTO"
    ],
    "productId": "PR10017"
};

var wareHouse_4 = {
    "_id": "WH200",
    "quantity": 1,
    "mrp": 60,
    "isGoodStock": true,
    "scannedSerialNo": [],
    "serialNo": [],
    "onHold": 0,
    "barcode": [
        "BARENGO9TRTO"
    ],
    "productId": "PR10017"
};

var scannedPayload_1 = {
    "performaInvoice": "PR1053",
    "orderId": "ORD1001",
    "subOrderList": [
      {
        "_id": "ORD1001_1",
        "dealId": "D10021",
        "scan": [
          {
            "inventoryids": [
              "WH200"
            ],
            "quantity": 4,
            "productId": "PR10017",
            "mrp": 50
          }
        ]
      }
    ]
  };

  var scannedPayload_2 = {
    "performaInvoice": "PR1053",
    "orderId": "ORD1001",
    "subOrderList": [
      {
        "_id": "ORD1001_1",
        "dealId": "D10021",
        "scan": [
          {
            "inventoryids": [
              "WH100"
            ],
            "quantity": 4,
            "productId": "PR10017",
            "mrp": 50
          }
        ]
      }
    ]
  }

var scannedPayload_3 = {
    "performaInvoice": "PR1053",
    "orderId": "ORD1001",
    "subOrderList": [
      {
        "_id": "ORD1001_1",
        "dealId": "D10021",
        "scan": [
          {
            "inventoryids": [
              "WH100"
            ],
            "quantity": 3,
            "productId": "PR10017",
            "mrp": 50
          },
          {
            "inventoryids": [
              "WH200"
            ],
            "quantity": 1,
            "productId": "PR10017",
            "mrp": 50
          }
        ]
      }
    ]
  }

module.exports = {
    orders: orders,
    wareHouse_1: wareHouse_1,
    wareHouse_2: wareHouse_2,
    wareHouse_3: wareHouse_3,
    wareHouse_4 : wareHouse_4
}