/* 
"Number_Of_Orders" : {"$size" : "$subOrderIds"}
*/

var snapShotIds = ["WH16331","WH16649","WH16775"];

/*
    - ALL IN ONE - BOTH INVOICED AND UNINVOICED;
 */
db.omsmasters.aggregate([
        {
            "$match": {
                "subOrders": {
                    "$elemMatch": {
                        "snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIds }, "quantity": { "$gt": 0 } } }
                    }
                }
            }
        },
        { "$unwind": "$subOrders" },
        {
            "$match": {
                "subOrders.snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIds }, "quantity": { "$gt": 0 } } }
            }
        },
        { "$unwind": "$subOrders.snapshots" },
        {
            "$match": {
                "subOrders.snapshots.snapShotId": { "$in": snapShotIds },
                "subOrders.snapshots.quantity": { "$gt": 0 }
            }
        },
        {
            "$project": {
                "_id": 1,
                "subOrders._id": 1,
                "subOrders.invoiced": 1,
                "subOrders.performaInvoiceNo": 1,
                "subOrders.batchId": 1,
                "subOrders.snapshots.snapShotId": 1,
                "subOrders.snapshots.productId": 1,
                "subOrders.snapshots.quantity": 1
            }
        },
        {
            "$group": {
                "_id": {
                    "snapShotId": "$subOrders.snapshots.snapShotId",
                    "isInvoiced": "$subOrders.invoiced"
                },
                "stockQty": { "$sum": "$subOrders.snapshots.quantity" },
                "productId": { "$first": "$subOrders.snapshots.productId" },
                "subOrderIds": { "$addToSet": "$subOrders._id" },
            }
        },
        {
            "$project": {
                "_id": 0,
                "snapShotId": "$_id.snapShotId",
                "isInvoiced": "$_id.isInvoiced",
                "stockQty": 1,
                "productId": 1,
                "subOrderIds": 1,
                "Number_Of_Orders" : {"$size" : "$subOrderIds"}
            }
        }
    ]);