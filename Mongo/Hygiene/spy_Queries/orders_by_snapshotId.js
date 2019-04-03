
/* 
    - Query to find orders against this snapshot
    - can be invoiced / not - can be controlled by variable
*/


var snapShotIdList = [""];
var invoiced = true;

db.omsmasters.aggregate([
    {
        "$match": {
            "subOrders": {
                "$elemMatch": {
                    "invoiced": invoiced,
                    // "status": { "$in": ["Processing", "Confirmed"] },
                    "snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIdList }, "quantity": { "$gt": 0 } } }
                }
            }
        }
    },
    { "$unwind": "$subOrders" },
    {
        "$match": {
            "subOrders.invoiced": invoiced,
            //"subOrders.status": { "$in": ["Processing", "Confirmed"] },
            "subOrders.snapshots": { "$elemMatch": { "snapShotId": { "$in": snapShotIdList }, "quantity": { "$gt": 0 } } }
        }
    },
    { "$unwind": "$subOrders.snapshots" },
    {
        "$match": {
            "subOrders.snapshots.snapShotId": { "$in": snapShotIdList },
            "subOrders.snapshots.quantity": { "$gt": 0 }
        }
    },
    {
        "$project": {
            "_id": 1,
            "subOrders._id": 1,
            "subOrders.invoiced" : 1,
            "subOrders.performaInvoiceNo": 1,
            "subOrders.batchId": 1,
            "subOrders.snapshots.snapShotId": 1,
            "subOrders.snapshots.productId": 1,
            "subOrders.snapshots.quantity": 1
        }
    }
])