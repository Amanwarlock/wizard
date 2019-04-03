
db.stockledgers.aggregate([
    {
        $match: {
            "requestQty": { "$gt": 0 },
            "createdAt": {
                "$lte": ISODate("2018-08-31T18:30:00.000Z")
            },
            status: "Committed"
        }
    },
    {
        $project: {
            "snapShotId": 1,
            "warehouseId": 1,
            "productId": 1,
            "requestQty": 1,
            "stockTransaction" : 1,
            "referenceType":1,
            "position" :1,
            "mrp":1,
            "status" :1,
            "reference" : 1,
            "createdAt":1,
            "ledgerGrn": {
                $cond: {
                    if: { "$gt": ["$reference.grn", null] },
                    then: "$reference.grn",
                    else: "$reference.objectId"
                }
            },
        }
    },
    {
        $sort: {
            "createdAt": -1
        }
    },
    {
        $unwind: "$stockTransaction"
    }, {
        $match: {
            "stockTransaction.state": {
                "$eq": "after"
            },
            "position.location": "Normal",
            "status": "Committed"
        }
    },
    {
        $lookup: {
            from: "warehouses",
            localField: "snapShotId",
            foreignField: "_id",
            as: "warehouseData",
        }
    },
   
    {
        $project: {
            "productId": 1,
            "snapShotId": 1,
            "mrp": 1,
            "qty": "$stockTransaction.quantity",
            "ledgerGrn" : 1,
            "referenceType":1,
            "warehouseData": { "$arrayElemAt": ["$warehouseData", 0] },
            "createdAt": 1,

        }
    },
    {
        $project: {
            "productId": 1,
            "snapShotId": 1,
            "mrp": 1,
            "qty": 1,
            "ledgerGrn" :1,
            "referenceType":1,
            "warehouseId": "$warehouseData.whId",
            "purchasePrice": "$warehouseData.purchasePrice",
            "grnId": {
                $cond: {
                    if: { $ne: ["$warehouseData.ref.grn", null] },
                    then: "$warehouseData.ref.grn",
                    else: "$warehouseData.ref.movement"
                }
            },
            "createdAt": 1,
        }
    },
    {
        $group: {
            _id: {
                productId: "$productId",
                warehouseId: "$warehouseId",
                snapShotId: "$snapShotId"
            },
            createdAt: {
                "$first": "$createdAt"
            },
            "data": {
                "$push": "$$ROOT"
            }
        }
    },
    {
        "$project": {
            "productId": "$_id.productId",
            "snapShotId": "$_id.snapShotId",
            "warehouseId": "$_id.warehouseId",
            "entry" : {
                $filter : {
                    input  : "$data",
                    "cond" : {
                        
                        $and : [{"$gt" : ["$$this.ledgerGrn" , null]} , {"$ne":["$$this.referenceType" , "Order Reservation"]}]
                    }
                }
            },
            "ledgerGrn" : {
                "$reduce" : {
                    "input" : "$data",
                    "initialValue" : "",
                    "in":{
                        $concat : ["$$value", {$cond: {
                            if: {"$gt" : ["$$this.ledgerGrn" , null]},
                            then: "$$this.ledgerGrn",
                            else: ""
                        }}]
                    }
                }
            },
            "createdAt": 1,
            "current": {
                "$arrayElemAt": ["$data.qty", 0]
            },
            "grnId": {
                "$arrayElemAt": ["$data.grnId", 0]
            },
            "mrp": {
                "$arrayElemAt": ["$data.mrp", 0]
            },
            "purchasePrice": {
                "$arrayElemAt": ["$data.purchasePrice", 0]
            },
        },
    },

    {
        "$group": {
            "_id": {
                "pId": "$productId",
                "wId": "$warehouseId",
                "snapShotId": "$snapShotId",
            },
            "ledgerGrn" : {$first: {$arrayElemAt: ["$entry" , 0]}},
            "data": {
                $push: {
                    "warehouseId": "$warehouseId",
                    "current": "$current",
                    "createdAt": "$createdAt",
                    "mrp": "$mrp",
                    "purchasePrice": "$purchasePrice",
                    "grnId": "$grnId"
                }
            },
            "totalQty": {
                "$sum": "$current"
            }
        }
    }, {
        $match: {
            totalQty: {
                $gt: 0
            }
        }
    }, {
        "$lookup": {
            from: "products",
            localField: "_id.pId",
            foreignField: "_id",
            as: "productData"
        }
    }, {
        $lookup: {
            from: 'categories',
            localField: 'productData.category',
            foreignField: '_id',
            as: 'catdet'
        }
    }, {
        $unwind: {
            'path': '$catdet',
            preserveNullAndEmptyArrays: true
        }
    }, {
        '$graphLookup': {
            'from': 'categories',
            'startWith': '$catdet.parent',
            'connectFromField': 'parent',
            'connectToField': '_id',
            'as': 'categoryHierarchy'
        }
    }, {
        $unwind: "$categoryHierarchy"
    }, {
        "$lookup": {
            from: "fulfillmentcenters",
            localField: "_id.wId",
            foreignField: "whId",
            as: "fc"
        }
    }, {
        "$project": {
            _id: 0,
            "warehouseId": {
                "$arrayElemAt": ["$data.warehouseId", 0]
            },
            "warehouse name": {
                "$arrayElemAt": ["$fc.name", 0]
            },
            Menu: "$categoryHierarchy.name",
            "grnId": {
                "$arrayElemAt": ["$data.grnId", 0]
            },
            "productId": "$_id.pId",
            "productName": {
                "$arrayElemAt": ["$productData.name", 0]
            },
            "mrp": {
                "$arrayElemAt": ["$data.mrp", 0]
            },
            "purchasePrice": {
                "$arrayElemAt": ["$data.purchasePrice", 0]
            },
            "closing stock": "$totalQty",
            "lastUpdatedOn": {
                "$arrayElemAt": ["$data.createdAt", 0]
            },
            entry:1,
            ledgerGrn: "$ledgerGrn.ledgerGrn",
            fc:1
        }
    }, 
    {
        "$lookup": {
            from: "stockintakes",
            localField: "ledgerGrn",
            foreignField: "_id",
            as: "grnData"
        }
    },{
      $project : {
          "warehouseId" : {
              $cond: {
                  if: {"$ne": ["$warehouseId",null]},
                  then: {$arrayElemAt:["$grnData.whId",0]},
                  else: "$warehouseId"
              }
          },
          "warehouse name" :1,
          "Menu":1,
          "grnId":{
              $cond: {
                  if: {"$ne": ["$grnId",null]},
                  then: {$arrayElemAt:["$grnData._id",0]},
                  else: "$grnId"
              }
          },
          "productId"  :1,
          "productName" :1,
          "mrp" :1,
          "purchasePrice":1,
          "closing stock":1,
          "lastUpdatedOn":1,
          "ledgerGrn":1,
          "purchase_Price": {
               $cond: {
                  if: {"$ne": ["$purchasePrice",null]},
                  then: {
                      $reduce: {
                          input: {$arrayElemAt: ["$grnData.productDetails" , 0]},
                          initialValue: 0,
                          in: {$sum :["$$value" , {
                              $cond: {
                                  if: {$eq: ["$productId" , "$$this.productId"]},
                                  then: "$$this.price.purchasePrice",
                                  else: 0
                              }
                          }]}
                      }
                  },
                  else: "$purchasePrice"
              }
          }
      }  
    },
    {
        $sort: {
            "warehouseId": -1,
            "productName": 1
        }
    } 
],{allowDiskUse: true})