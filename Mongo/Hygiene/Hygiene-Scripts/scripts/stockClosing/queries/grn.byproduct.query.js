
var productId = "PR16711";
var createdAt = "";

//receivedQuantity

db.stockintakes.aggregate([
    {
        $match: {
            status: { $nin: ["Cancelled", "Rejected"] },
            productDetails: {
                $elemMatch: {
                    productId: productId
                }
            }
        }
    },
    { $unwind: "$productDetails" },
    {
        $match: {
            "productDetails.productId": productId
        }
    },
    {
        $project: {
            _id: 1,
            status: 1,
            whId: 1,
            productId: "$productDetails.productId",
            quantity: "$productDetails.receivedQuantity",
            mrp: "$productDetails.price.mrp",
            purchasePrice: "$productDetails.price.purchasePrice",
            totalPurchasePrice: { $multiply: ["$productDetails.price.purchasePrice", "$productDetails.receivedQuantity"] }

        }
    },
    {
        $group: {
            _id: { productId: "$productId", whId: "$whId" },
            total: { $sum: "$quantity" },
            data: { $push: "$$ROOT" }
        }
    },
    {
        $project: {
            _id: 0,
            productId: "$_id.productId",
            whId: "$_id.whId",
            total: 1,
            avgPrice: {
                $divide: [{
                    $reduce: {
                        input: "$data",
                        initialValue: 0,
                        in: { $sum: ["$$value", "$$this.totalPurchasePrice"] }
                    }
                }, "$total"]
            },

        }
    }
], { allowDiskUse: true })