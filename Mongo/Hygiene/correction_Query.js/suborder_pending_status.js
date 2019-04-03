
/* 
    - Query to update suborder status from "Pending" to "Confirmed";
*/

db.omsmasters.find({ _id: "OR2018062921820" }).forEach(it => {
    it.subOrders.forEach(s => {
        if (s.status === "Pending" && it.paymentStatus === "Paid") {
            printjson("Updating suborder status of : " + s._id);
            db.omsmasters.findOneAndUpdate({ "subOrders._id": s._id }, { "$set": { "subOrders.$.status": "Confirmed" } });
        }
    });
})

