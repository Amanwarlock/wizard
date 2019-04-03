var order = {
    "_id": "OR2018063022040",
    "paymentStatus": "Paid",
    "createdAt": ISODate("2018-06-30T09:50:31.075+05:30"),
    "invoices": [],
    "stockAllocation": "PartialAllocated",
    "subOrders": [
        {
            "name": "Colgate Red Gel Max Fresh Spicy Fresh Toothpaste (80g) Case (96pcs)",
            "mrp": 4608,
            "b2bPrice": 4189,
            "quantity": 1,
            "_id": "OR2018063022040_1",
            "batchId": "BR20180702721",
            "invoiced": false,
            "processed": true,
            "readyForBatching": true,
            "snapshots": [
                {
                    "ledgerId": "10010191530332437349",
                    "snapShotId": "WH15609",
                    "productId": "PR10965",
                    "quantity": 96,
                    "mrp": 48,
                    "location": "Normal",
                    "area": "NormalAR-WMF0-1",
                    "rackId": "Rack-1",
                    "binId": "Bin-1",
                    "type": "Reserved",
                    "createdAt": ISODate("2018-06-30T09:50:40.235+05:30")
                }
            ],
            "blockedProducts": [
                {
                    "productId": "PR10965",
                    "quantity": 96
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR10965",
                    "quantity": 96,
                    "_id": ObjectId("5b3705150dd3ed4f2f5e8b6f")
                }
            ],
            "internalStatus": "BatchEnabled",
            "status": "Processing",
            "performaInvoiceNo": "PR12520"
        },
        {
            "name": "Dairy Milk (Rs. 2) Shots (3.6g) (1 POUCH x 56pcs)",
            "mrp": 112,
            "b2bPrice": 100.8,
            "quantity": 10,
            "_id": "OR2018063022040_2",
            "batchId": "BR20180702721",
            "invoiced": false,
            "processed": true,
            "readyForBatching": false,
            "snapshots": [
                {
                    "ledgerId": "10010201530332437355",
                    "snapShotId": "WH16950",
                    "productId": "PR13228",
                    "quantity": 3,
                    "mrp": 112,
                    "location": "Normal",
                    "area": "NormalAR-WMF0-4",
                    "rackId": "Rack-1",
                    "binId": "Bin-1",
                    "type": "Reserved",
                    "createdAt": ISODate("2018-06-30T09:50:40.235+05:30")
                },
                {
                    "type": "Reserved",
                    "binId": "Bin-1",
                    "rackId": "Rack-1",
                    "area": "NormalAR-WMF0-4",
                    "location": "Normal",
                    "mrp": 112,
                    "quantity": 4,
                    "productId": "PR13228",
                    "snapShotId": "WH15778",
                    "ledgerId": "10014301530593399770",
                    "_id": ObjectId("5b3b007ff486a0495fd40253"),
                    "serialNo": [],
                    "barcode": []
                }
            ],
            "blockedProducts": [
                {
                    "productId": "PR13228",
                    "quantity": 7
                }
            ],
            "requestedProducts": [
                {
                    "productId": "PR13228",
                    "quantity": 10,
                    "_id": ObjectId("5b3705150dd3ed4f2f5e8b70")
                }
            ],
            "internalStatus": "BatchEnabled",
            "status": "Processing",
            "performaInvoiceNo": "PR12520"
        }
    ],
    "gotRequestedProducts": false,
    "status": "Processing"
}