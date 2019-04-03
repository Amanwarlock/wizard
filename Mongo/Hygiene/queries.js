/* ############################----QUERIES----############################# */

/* --------------------------------------OMS---------------------------------------------------------- */
db.omsmasters.find({ "_id": { "$in": ["OR2018063022040"] } }, {
    "_id": 1, "paymentStatus": 1, "invoices": 1, "stockAllocation": 1, "status": 1, "createdAt": 1, "gotRequestedProducts": 1, "source":1,
    "subOrders._id": 1, "subOrders.name": 1, "subOrders.mrp": 1, "subOrders.performaInvoiceNo": 1, "subOrders.snapshots": 1, "subOrders.b2bPrice": 1, "b2bPrice.price": 1, "subOrders.quantity": 1, "subOrders.batchId": 1, "subOrders.invoiceNo": 1,
    "subOrders.invoiced": 1, "subOrders.processed": 1, "subOrders.readyForBatching": 1, "subOrders.requestedProducts": 1, "subOrders.blockedProducts": 1,
    "subOrders.status": 1, "subOrders.internalStatus": 1,"typeOfOrder":1
}).sort({ createdAt: -1 });
/* ------------------------------------------WAREHOUSE------------------------------------------------- */
db.warehouses.find({ "_id": { "$in": ["WH16950"] } }, { _id: 1, quantity: 1, onHold: 1, barcode: 1, productId: 1, serialNo: 1 ,whId:1,mrp:1,scannedSerialNo:1 })

db.warehouses.find({ "productId": "", "isGoodStock": true, "$or": [{ "quantity": { "$gt": 0 } }, { "onHold": { "$gt": 0 } }] }, 
{ _id: 1, quantity: 1, onHold: 1, barcode: 1, productId: 1, serialNo: 1,whId:1 , mrp:1 });

db.warehouses.distinct("productId" , {barcode : {$in : ["8901058844450"]}});
//Negative Records finder;
db.warehouses.find({$or: [{quantity : {$lt: 0}} , {onHold: {$lt: 0}}]},{ _id: 1, quantity: 1, onHold: 1, barcode: 1, productId: 1, serialNo: 1,mrp:1,whId:1 });

db.warehouses.findOneAndUpdate({_id : "WH22269"} , {$pull : {serialNo : {$in : serialNoList}} , $push : {scannedSerialNo : {$each : serialNoList}}});
/* ------------------------------------------STOCK LEDGERS------------------------------------------------- */
db.stockledgers.distinct("referenceType");

db.stockledgers.find({"snapShotId"  : "WH18138"});

db.stockledgers.find({"snapShotId"  : "WH26222" , "referenceType" : "Release" , "status" : "Failed"});

db.stockledgers.find({"snapShotId"  : "WH27221" , "status" : "Failed"});

db.stockledgers.find({"snapShotId"  : "WH26759" , "referenceType" : "Stock Correction"});

db.stockledgers.find({"reference.subOrderId" : ""})

db.stockledgers.find({"reference.subOrderId" : "" , status : "Failed"})
db.stockledgers.find({ "reference.performaId": "PR13854" }).skip(0);
db.stockledgers.find({ "snapShotId": { "$in": [] } }).skip(0);
/* ------------------------------------------OMS INVOICES------------------------------------------------- */
db.omsinvoices.find({ "performaInvoiceNo": "" });
/* ------------------------------------------OMS BATCHES------------------------------------------------- */
db.omsbatches.aggregate([
    {
        "$match": {
            "performa": {
                "$elemMatch": {
                    "subOrderId": { "$in": ["OR2018063022155_1"] }
                }
            }
        }
    },
    { "$unwind": "$performa" },
    {
        "$match": {
            "performa.subOrderId": { "$in": ["OR2018063022155_1"] }
        }
    }
]);

var batchId = "BR20180920148B";

var performaId = "PR56182"

db.omsbatches.aggregate([
    {
        $match : {
            _id : batchId
        }
    },
    {$unwind : "$performa"},
    {$match : {
       "performa.performaId"  : performaId
    }}
 ]);

/* ------------------------------------------SNAP SHOT PAYLOAD------------------------------------------------- */

var snapshot = {
    "ledgerId": "10179261531236975154",
    "snapShotId": "WH17964",
    "whId": "WMF0",
    "productId": "PR14470",
    "quantity": 2,
    "mrp": 720,
    "location": "Normal",
    "area": "NormalAR-WMF1-1",
    "rackId": "Rack-1",
    "binId": "Bin-1",
    "type": "Reserved",
    "createdAt": "2018-07-10T21:06:15.187+05:30"
}

/* ------------------------------------------Happiness Box ------------------------------------------------- */
db.warehouses.remove({productId : {"$in" : ["PR10017" , "PR10962","PR10963"]} , _id : {"$nin" : ["WH4711","WH4713","WH4732","WH4733", "WH4450","WH4731"]}})

db.warehouses.remove({productId : "PR10963"})

db.stockledgers.remove({})

//Ponds - hapinees box ["PR10209" , "PR10207","PR10240"] ["WH4879","WH4885","WH4880","WH4886","WH4881"]
db.warehouses.remove({productId : {"$in" : ["PR10207" , "PR10240","PR10209"]} , _id : {"$nin" : ["WH4879","WH4885","WH4880","WH4886","WH4881"]}})

//UPDATE:


/*
   PR10209 -  WH4879,WH4885 - 1
   PR10207 -  WH4880,WH4886 - 1
   PR10240 -  WH4881,WH4887 - 2
*/


//PR10209
db.warehouses.update({"_id" : "WH4879"},{"$set" : {quantity : 1}});
db.warehouses.update({"_id" : "WH4885"},{"$set" : {quantity : 1}});

//PR10207
db.warehouses.update({"_id" : "WH4880"},{"$set" : {quantity : 1}});
db.warehouses.update({"_id" : "WH4886"},{"$set" : {quantity : 1}});

//
db.warehouses.update({"_id" : "WH4881"},{"$set" : {quantity : 2}});



/*------------------------------------------------------------------BARCODE UPDATE------------------------------------------------------------------------*/

db.warehouses.find({barcode: {$in : ["D:8901063017252"]}},{_id : 1, barcode: 1 , whId:1 , productId :1 , quantity:1 , onHold:1});

db.warehouses.distinct("productId", {barcode: {$in : ["8901063017252"]}});


var barcode = "8901063017252"; // Original barcode

var productId = "PR15377" // Already allocated productId

db.warehouses.find({barcode : {$in : [barcode]} , productId: productId}).forEach(w =>{
    
    var _b = "D:" + w.barcode[0];
    
    w.barcode = [_b];
    
    printjson({_id : w._id , barcode : w.barcode});
    
    db.warehouses.findOneAndUpdate({_id : w._id},{$set: {barcode : w.barcode}});
    
});


/*------------------------------------------------------------------GRN ALLOCATION NOT DONE RECORDS------------------------------------------------------------------------*/


db.stockintakes.aggregate([
    {
        $match: {
           // _id: "GRN3545",
            status: "Closed"
        }
    }, 
    /*{
        $unwind: "$productDetails"
    },*/
    {
        $lookup: {
               from: "warehouses",
               localField: "_id",
               foreignField: "ref.grn",
               as: "warehouse"
             }
    },
    {
        $project: {
            grn: "$_id",
            createdAt: 1,
            whId: 1,
            "productDetails.productId": 1,
            warehouse:1
            
        }
    },
    {
        $unwind: "$warehouse"
    },
    {
        $group: {
            _id : {grn: "$_id" , productId: "$warehouse.productId" },
            count: {$sum: 1},
            productName: {$first: "$warehouse.productName"},
            createdAt: {$first : "$createdAt"}
        }
    },
    {
        $match: {
            count: {$lt: 2}
        }
    }
    ])
     