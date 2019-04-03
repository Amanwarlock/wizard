

/* 1. Order Status update; 
    - Run order.status.script.js script to modify order status to Processing;
    - Then db.omsmasters.find({ "subOrders.processed": true,  status: { "$eq": "Confirmed" } }).count();
    - Then db.omsmasters.find({status: { "$eq": "Confirmed" } ,  "subOrders.processed": true} , {"_id" : 1 , "status" : 1 });
*/

/*2. Batch sync.js - This will keep the batch and performa status in sync with the order - from Pending to either Completed / Cancelled;
    Before: db.omsbatches.find({"performa.status" : "Completed"}).count(); db.omsbatches.find({"performa.status" : "Cancelled"}).count();
    completed = 2443;2449
    cancelled = 290;
*/

/*3.Batch.cancel.js - This cancels all open performas  
    - db.omsbatches.find({"status" : "Pending"}).count();
    - db.omsbatches.find({"performa.status" : "Pending"}).count();
    - db.omsbatches.find({"$or" : [{"status" : "Pending"} , {"performa.status" : "Pending"}]},{"_id" : 1 , "status" : 1 , "subOrderId" : 1 , "performa.status" : 1 , "performa.performaId" : 1})
*/

/*4. order.stock.release.js = Run script to unreserve all open orders;
    - Then db.omsmasters.find({"stockAllocation" : {"$in" : ["Allocated" , "PartialAllocated"]}}).count()
    - db.omsmasters.find({"stockAllocation" : {"$in" : ["Allocated" , "PartialAllocated"]}}).count()
 */

 /*5. order.reset = last resort; 
  */

  /*6. Warehouse.reset.js 
   */