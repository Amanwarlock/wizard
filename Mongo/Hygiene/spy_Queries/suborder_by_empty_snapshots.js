var subOrderIds = []

db.omsmasters.aggregate([
    {
        $match: {
            "paymentStatus": "Paid",
            "status": "Confirmed",
            "subOrders" : {
                $elemMatch : {
                    _id : {$in : subOrderIds},
                    status : "Confirmed",
                    readyForBatching : true,
                    snapshots: {$eq : []}
                }
            }
        }
    }

])