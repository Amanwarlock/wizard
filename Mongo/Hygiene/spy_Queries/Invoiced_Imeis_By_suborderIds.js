
var subOrderIds = ['OR2018073131296_6']

db.stockledgers.aggregate([
    {
        $match: {
            "reference.subOrderId": { $in: subOrderIds },
            "status": "Committed",
            "referenceType": "Release"
        }
    },
    {
        $group: {
            _id: "$productId",
            serialNos: { $addToSet: "$serialNo" }
        }
    },

    {
        $project: {
            serialNos: {
                $reduce: {
                    input: "$serialNos",
                    initialValue: [],
                    in: { $concatArrays: ["$$value", "$$this"] }
                }
            }
        }
    },
    {
        $project: {
            "_id": 0,
            "productId": "$_id",
            "InvoicedSerialNos": "$serialNos",
            "totalInvoiced": { $size: "$serialNos" }
        }
    }
])