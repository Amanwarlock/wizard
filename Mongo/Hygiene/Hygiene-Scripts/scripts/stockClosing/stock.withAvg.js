/* 

FINAL REPORT QUERY WORKING;


*/
var productId = "PR16711"; //"PR16711";
var createdAt = ISODate("2018-12-31T18:59:59.999+05:30")
/*
STFR15049 , 10190961542191619813
In = Grn , Stock Correction +ve , Stock Movement +ve , Return , Invoice Cancellation
Out = Release , Stock Correction , Stock Movement;
*/
db.stockledgers.aggregate([
    {
        $match: {
            productId: productId,
            status: "Committed",
            referenceType: { $in: ["GRN", "Invoice Cancellation", "Stock Correction", "Stock Movement", "Release"] }, // IN
        }
    },
    {
        $project: {
            _productId: "$productId",
            _whId: "$warehouseId",
            _snapShotId: "$snapShotId",
            _referenceType: "$referenceType",
            _requestQty: "$requestQty",
            _type: {
                $cond: {
                    if: { $lt: [{ $subtract: [{ $arrayElemAt: ["$stockTransaction.quantity", 0] }, { $arrayElemAt: ["$stockTransaction.quantity", 1] }] }, 0] },
                    then: 'IN',
                    else: 'OUT'
                }
            },
            _before: { $add: [{ $arrayElemAt: ["$stockTransaction.quantity", 0] }, { $arrayElemAt: ["$stockTransaction.onHold", 0] }] },
            _after: { $add: [{ $arrayElemAt: ["$stockTransaction.quantity", 1] }, { $arrayElemAt: ["$stockTransaction.onHold", 1] }] },
            _mrp: "$mrp",
            _createdAt: "$createdAt",
            _reference: "$reference",
            _stockTransaction: "$stockTransaction",
            _position: "$position",
            _status: "$status",

        }
    },
    {
        "$lookup": {
            from: "warehouses",
            localField: "_snapShotId",
            foreignField: "_id",
            as: "inventory"
        }
    },
    {
        $project: {
            _productId: 1,
            _whId: 1,
            _snapShotId: 1,
            _type: 1,
            _referenceType: 1,
            _quantity: {
                $cond: {
                    if: { $lt: [{ $subtract: ["$_before", "$_after"] }, 0] },
                    then: { $multiply: [{ $subtract: ["$_before", "$_after"] }, -1] },
                    else: { $subtract: ["$_before", "$_after"] }
                }
            },
            _mrp: 1,
            _purchasePrice: { $arrayElemAt: ["$inventory.purchasePrice", 0] },
            _createdAt: 1,
            _reference: 1
        }
    }, {
        $group: {
            _id: { productId: "$_productId", "whId": "$_whId", "type": "$_type",/* snapShotId: "$_snapShotId"*/ },
            data: { $push: "$$ROOT" },
            total: { $sum: "$_quantity" },
            totalPrice: { $sum: { $multiply: ["$_quantity", "$_purchasePrice"] } },
            totalMrp: { $sum: { $multiply: ["$_quantity", "$_mrp"] } }
        }
    },
    {
         $group: {
             _id: {
                 productId: "$_id.productId",
                 whId: "$_id.whId",
             },
             records: { $push: "$$ROOT" }
         }
     },
     
     {
         $project: {
             _id: 0,
             productId: "$_id.productId",
             whId: "$_id.whId",
             snapShotId: "$_id.snapShotId",
             currentStock: {
                 $reduce: {
                     input: "$records",
                     initialValue: 0,
                     in: {
                         $cond: {
                             if: { $eq: ["$$this._id.type", "IN"] },
                             then: { $sum: ["$$value", "$$this.total"] },
                             else: { $subtract: ["$$value", "$$this.total"] }
                         }
                     }
                 }
             },
             records: {
                 $map: {
                     input: "$records",
                     in: {
                         "type" : "$$this._id.type",
                         "total" : "$$this.total",
                         "totalPrice" : "$$this.totalPrice",
                         totalMrp: "$$this.totalMrp"
                     }
                 }
             }
         }
     },
    {
        $project: {
            productId: 1,
            whId: 1,
            closingStock: "$currentStock",
            records: 1,
            avgPrice : {$divide: [ {$add: [{$arrayElemAt: ["$records.totalPrice",0]} ,{$arrayElemAt: ["$records.totalPrice",1]} ]}, {$add: [{$arrayElemAt: ["$records.total",0]} ,{$arrayElemAt: ["$records.total",1]} ]} ]},
            avgMrp: {$divide: [ {$add: [{$arrayElemAt: ["$records.totalMrp",0]} ,{$arrayElemAt: ["$records.totalMrp",1]} ]}, {$add: [{$arrayElemAt: ["$records.total",0]} ,{$arrayElemAt: ["$records.total",1]} ]} ]}
        }
    }

], { allowDiskUse: true })