//Cancelled
var productId = "PR16711";

db.stockadjustments.aggregate([
    {
        $match: {
            status: {$in: ["Approved"]},
            productId: productId
        }
    },
    {
        $project: {
            productId :1,
            whId:1 ,
            quantity : "$changeQtyBy",
            mrp: 1,
            snapshot: 1,
            status: 1,
            createdAt: 1,
            type: {
                $cond: {
                    if: {$lt: ["$changeQtyBy" , 0]},
                    then: 'OUT',
                    else: 'IN'
                }
            }
        }
    },
    {
        $group : {
            _id:  {productId: "$productId" , whId: "$whId" , type: "$type"},
            total: {$sum: "$quantity"},
            data: {$push  : "$$ROOT"}
        }
    },
    {
        $project : {
            productId :"$_id.productId",
            whId: "$_id.whId",
            type: "$_id.type",
            total: 1,
            data: 1,
        }
    },
    {
        $group : {
            _id: {productId: "$productId" , whId: "$whId"},
            records: {$push: "$$ROOT"}
        }
    },
    {
        $project: {
            _id: 0,
            productId: "$_id.productId",
            whId : "$_id.whId",
            "records.total":1,
            "records.productId" : 1,
            "records.whId" : 1,
            "records.type" : 1,
            net: {
                $reduce: {
                    input: "$records",
                    initialValue: 0,
                    in: {
                        $cond: {
                            if: {$eq: ["$$this.type" , "IN"]},
                            then: {$sum: ["$$value" , "$$this.total"]},
                            else: {$subtract: ["$$value" , "$$this.total"]}
                        }
                    }
                }
            }
            
        }
    }
],{ allowDiskUse: true });