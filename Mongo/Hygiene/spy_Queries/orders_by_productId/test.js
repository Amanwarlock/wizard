/* 
    - Method 2: Considered products array of subOrders;
*/

var productIdList = ["PR13671"];
var invoiced = true;
var date = ""; 

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
    { "$unwind": "$subOrders.products" },
    {
        "$match": {
            "subOrders.invoiced": invoiced,
            "subOrders.products.id": { "$in": productIdList }
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
            "subOrders.snapshots.quantity": 1,
            "subOrders.products.id": 1,
            "subOrders.products.quantity": 1
        }
    },
    {
        "$group": {
            "_id": "$subOrders.products.id",
            "stockQty": { "$sum": "$subOrders.products.quantity" },
            "snapshots": { "$addToSet": "$subOrders.snapshots.snapShotId" },
            "suborderids": { "$addToSet": "$subOrders._id" },
        }
    }
])
