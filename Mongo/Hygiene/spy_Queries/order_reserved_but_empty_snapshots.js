db.omsmasters.aggregate([
    {
        "$match": {
            "type": "Physical",
            "fulfilledBy": "MPS0",
            "orderType": "Wholesale",
            "paymentStatus": "Paid",
            "subOrders": {
                "$elemMatch": {
                    "blockedProducts": {"$ne" : [] },
                    "snapshots" : {"$eq" : []}
                }
            }
        }
    },
    {
        "$project" : {
            "_id" : 1,
            "status" : 1,
            "paymentStatus" : 1,
            "fulfilledBy" :1,
            "subOrders._id" : 1,
            "subOrders.status" : 1,
            "subOrders.snapshots": 1,
            "subOrders.blockedProducts" : 1,
            "createdAt" : 1
        }
    }
]);