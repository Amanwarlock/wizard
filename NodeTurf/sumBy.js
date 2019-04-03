
var _ = require("lodash");
var async = require("async");

var subOrder = {
    blockedProducts: [
        { "productId": "PR10001", "quantity": 2 },
        { "productId": "PR10002", "quantity": 2 }
    ]
}


var total = _.sumBy(subOrder.blockedProducts, el => (el && el.quantity) ? el.quantity : 0);
console.log("Total quantity is :" , total);



var result = _.sumBy(subOrder.blockedProducts, "quantity");
console.log("Method 2 Total quantity is :" , result);

var embedded = [{
    "_id" : "ORD100",
    "subOrders" : {
        "quantity" : 2
    }
},{
    "_id" : "ORD200",
    "subOrders" : {
        "quantity" : 1
    }
}];

var result2 = _.sumBy(embedded , "subOrders.quantity");
console.log("Embedded sum : " , result2);