
/*  
    - Query to get all invetories with isGoodStock flag by date;
*/
db.warehouses.aggregate([
    {
        "$match" : {
            "isGoodStock" : true,
            "createdAt" : {"$gt" : ISODate("2018-04-30T18:30:00.000+05:30")}//April 30 at 12:00 midninght
        }
    },
    {
        "$project"  : {
            "_id" :1,
            "createdAt" : 1,
            "quantity" : 1,
            "onHold" : 1,
            "productId" : 1
        }
    }
])