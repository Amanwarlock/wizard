var productId = "PR16711";

db.stocktransfers.aggregate([
    {
        $match: {
            productId: productId,
            status: "Approved"
        }
    },
    {
        $project: {
            productId: 1,
            whId: 1,
            towhId: 1,
            quantity: 1,
            status: 1
        }
    },
    {
        $lookup: {
            from: "stockledgers",
            localField: "_id",
            foreignField: "reference.objectId",
            as: 'ledgers'
        }
    },
    { $unwind: "$ledgers" },
    { $match: { "ledgers.status": "Committed" } },
    {
        $project: {
            productId: 1,
            whId: 1,
            towhId: 1,
            quantity: 1,
            status: 1,
            "ledgers._id": 1,
            "ledgers.productId": 1,
            "ledgers.whId": "$ledgers.warehouseId",
            "ledgers.before": { $add: [{ $arrayElemAt: ["$ledgers.stockTransaction.quantity", 0] }, { $arrayElemAt: ["$ledgers.stockTransaction.onHold", 0] }] },
            "ledgers.after": { $add: [{ $arrayElemAt: ["$ledgers.stockTransaction.quantity", 1] }, { $arrayElemAt: ["$ledgers.stockTransaction.onHold", 1] }] },
        }
    },
    {
        $project: {
            productId: 1,
            whId: 1,
            towhId: 1,
            quantity: 1,
            status: 1,
            ledgers: 1,
            type: {
                $cond: {
                    if: { $lt: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, 0] },
                    then: 'IN',
                    else: 'OUT'
                }
            },
            changeQty: {
                $cond: {
                    if: { $lt: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, 0] },
                    then: { $multiply: [{ $subtract: ["$ledgers.before", "$ledgers.after"] }, -1] },
                    else: { $subtract: ["$ledgers.before", "$ledgers.after"] }
                }
            },

        }
    },
    {
        $group: {
            _id: { productId: "$productId", type: "$type", whId: "$ledgers.whId" },
            total: { $sum: "$changeQty" }
        }
    },
    {
        $project: {
            _id: 0,
            productId: "$_id.productId",
            type: "$_id.type",
            whId: "$_id.whId",
            total: 1
        }
    },
    {
        $group: {
            _id: { productId: "$productId", whId: "$whId" },
            records: { $push: "$$ROOT" }
        }
    },
    {
        $project: {
            _id : 0,
            productId: "$_id.productId",
            whId: "$_id.whId",
            records: 1,
            net: {
                $reduce: {
                    input: "$records",
                    initialValue: 0,
                    in: {
                        $cond: {
                            if: { $eq: ["$$this.type", "IN"] },
                            then: { $sum: ["$$value", "$$this.total"] },
                            else: { $subtract: ["$$value", "$$this.total"] }
                        }
                    }
                }
            }
        }
    }
]);