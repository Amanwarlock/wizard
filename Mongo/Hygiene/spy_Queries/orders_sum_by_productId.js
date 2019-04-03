
/* 
    - Method 1 : Considered Snapshots array of suborders;
*/

var productIdList = ["PR13671"];
var invoiced = true;

db.omsmasters.aggregate([
    {
        "$match": {
            "fulfilledBy": "MPS0",
            "orderType": "Wholesale",
            "subOrders": {
                "$elemMatch": {
                    "invoiced": invoiced,
                    //"status": { "$in": ["Processing", "Confirmed"] },
                    "snapshots": { "$elemMatch": { "productId": { "$in": productIdList }, "quantity": { "$gt": 0 } } }
                }
            }
        }
    },
    { "$unwind": "$subOrders" },
    {
        "$match": {
            "subOrders.invoiced": invoiced,
            //"subOrders.status": { "$in": ["Processing", "Confirmed"] },
            "subOrders.snapshots": { "$elemMatch": { "productId": { "$in": productIdList }, "quantity": { "$gt": 0 } } }
        }
    },
    { "$unwind": "$subOrders.snapshots" },
    {
        "$match": {
            "subOrders.snapshots.productId": { "$in": productIdList },
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
            "_id": "$subOrders.snapshots.productId",
            "totalQty": { "$sum": "$subOrders.snapshots.quantity" },
            "snapshots": { "$addToSet": "$subOrders.snapshots.snapShotId" },
            "suborderids": { "$addToSet": "$subOrders._id" },
        }
    }
]);



