
//GRN1385
db.stockledgers.aggregate([
    { $match: { "reference.grn": "GRN1385", "referenceType": "GRN" } },
    { $group: { "_id": "$productId", Imeis: { "$addToSet": "$serialNo" } , inTakenQty : {"$first" : "$requestQty"}} },
    {
        "$project": {
            "_id": 0,
            "productId": "$_id",
            "inTakenQty" : 1,
            "Imei's" : {
                "$reduce"  : {
                    "input" : "$Imeis",
                    "initialValue" : [],
                    "in" : {"$concatArrays": ["$$value" , "$$this"]}
                }
            }
        }
    },
    {
        "$project" : {
            "productId"  :1,
            "inTakenQty" :1,
            "Imei's" : 1,
            "Total Imeis" : {"$size" : "$Imei's"}
        }
    }
])