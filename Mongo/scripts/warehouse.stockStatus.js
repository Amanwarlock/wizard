
var cursor = db.warehouses.find({});
while (cursor.hasNext()) {
    var wh = cursor.next();
    var areaData = db.areas.findOne({ "_id": wh.area, "location": wh.location });
    db.warehouses.findOneAndUpdate({ "_id": wh._id }, { "$set": { "status": areaData.status } });
    printjson("Inventory : ", wh._id);
    printjson("Area : ", areaData._id);
}



var cursor = db.areas.find({});
while (cursor.hasNext()) {
    var area = cursor.next();
    var status = null;
    if(area.location === "Normal"){
        status = "Available";
    }
    else if(area.location === "Damage"){
        status = "Damage";
    }else{
        status = "NotAvailable"
    }
    db.areas.findOneAndUpdate({"_id" : area._id} , {"$set" : {"status" : status}});
}