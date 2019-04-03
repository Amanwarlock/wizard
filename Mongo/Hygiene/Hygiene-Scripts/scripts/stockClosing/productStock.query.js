var productId = ""
var whId = ""
db.warehouses.aggregate([
    {
        $match: {
            productId: productId,
            whId: whId,
            $or: [{ quantity: { $gt: 0 } }, { onHold: { $gt: 0 } }]
        }
    },
    {
        $group : {
            _id :  {productId: "$productId" , whId: "$whId"},
            qty : {$sum : "$quantity"},
            onHold: {$sum: "$onHold"}
        }
    },
    {
        $project: {
            _id: 1,
            qty :1,
            onHold: 1,
            current : {$sum: ["$qty" , "$onHold"]}
        }
    }
])