
/* 
    - Query to get all inventory ids by date from stock ledger;
    - All inventories belonging to normal location only;
*/

db.stockledgers.aggregate([
    {
        "$match": {
            "referenceType": "GRN", 
            "createdAt": { "$gt": ISODate("2018-04-30T18:30:00.000+05:30") },
            "position.location" : {"$eq" : "Normal"}
        }
    },
    {
        "$group" : {"_id" : "$snapShotId"}
    }
]);