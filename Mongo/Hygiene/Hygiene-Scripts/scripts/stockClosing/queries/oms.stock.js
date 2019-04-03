var productId = "PR16711"

db.omsmasters.aggregate([{
    $match: {
        paymentStatus: "Paid",
        fulfilledBy: "MPS0",
        subOrders: {
            $elemMatch: {
                // status: {$nin : ["Cancelled" , "Pending" , "Returned" , "Confirmed" , "Processing"]},
                invoiced: true,
                readyForBatching: true,
                products: {
                    $elemMatch: {
                        id: productId,

                    }
                }
            }
        }
    },
}, {
    $project: {
        paymentStatus: 1,
        fulfilledBy: 1,
        status: 1,
        source: 1,
        "subOrders.status": 1,
        "subOrders.invoiced": 1,
        "subOrders.readyForBatching": 1,
        "subOrders.products.id": 1,
        "subOrders.products.quantity": 1
    }
},
{
    $unwind: "$subOrders"
},
{
    $match: {
        "subOrders.invoiced": true,
        "subOrders.readyForBatching": true,
        "subOrders.products": {
            $elemMatch: {
                id: productId,

            }
        }
    }
},
{
    $unwind: "$subOrders.products"
},
{
    $match: {
        "subOrders.invoiced": true,
        "subOrders.readyForBatching": true,
        "subOrders.products.id": productId
    }
},
{
    $group: {
        _id: { productId: "$subOrders.products.id", whId: "$source" },
        total: { $sum: "$subOrders.products.quantity" }
    }
},
{
    $project: {
        _id: 0,
        productId: "$_id.productId",
        whId: "$_id.whId",
        total: 1,
        type: "OUT",
    }
}
], { allowDiskUse: true });