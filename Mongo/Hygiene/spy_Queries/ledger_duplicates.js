
var snapShotId  = "WH21828";

db.stockledgers.aggregate([
    {
        $match: {
            snapShotId: snapShotId,
            status: "Committed"
        }
    },
    {
        $group: {
            _id : {
                "subOrderId" : "$reference.subOrderId",
                "productId" : "$productId",
                "referenceType" : "$referenceType"
            },
            count : {$sum: 1}
        }
    },
    {
        $match: {count: {$gt: 1}}
    }
])