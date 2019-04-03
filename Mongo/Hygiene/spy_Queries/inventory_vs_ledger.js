
/* 
    The latest entry in ledger must be same as warehouse at that point of time in terms of quantity and onHold
*/

db.stockledgers.aggregate([{
    $match: {
        status: "Committed"
    }
},
{ $sort: { createdAt: -1 } },
{ $unwind: "$stockTransaction" },
{
    $match: {
        "stockTransaction.state": "after"
    }
},
{
    $group: {
        _id: "$snapShotId",
        "data": { "$push": { "snapShotId": "$snapShotId", "whId": "$warehouseId", "productId": "$productId", "createdAt": "$createdAt", "quantity": "$stockTransaction.quantity", "onHold": "$stockTransaction.onHold" } }
    }
},
{
    $lookup: {
        from: "warehouses",
        localField: "_id",
        foreignField: "_id",
        as: "warehouseData",
    }
},
{
    $project: {
        _id: 0,
        "snapShotId": "$_id",
        "whId": { $arrayElemAt: ["$data.whId", 0] },
        "productId": { $arrayElemAt: ["$data.productId", 0] },
        "createdAt": { $arrayElemAt: ["$data.createdAt", 0] },
        "ledger_quantity": { $arrayElemAt: ["$data.quantity", 0] },
        "ledger_onHold": { $arrayElemAt: ["$data.onHold", 0] },
        "warehouse_quantity" :  { $arrayElemAt: ["$warehouseData.quantity", 0] },
        "warehouse_onHold" : { $arrayElemAt: ["$warehouseData.onHold", 0] }
    }
},
{ $sort: { createdAt: -1 } },
])