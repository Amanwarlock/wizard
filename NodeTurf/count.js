
var _ = require("lodash");

var arr = [{
    _id: "ORD2321",
    status: "Confirmed"
}, {
    _id: "ORD325",
    status: "Processing"
}];

var count = _.countBy(arr, { status: "Processing" });
console.log("--count is ", count);

var exampleList = [
    {
        "subOrderId": "OR201804034_1",
        "productId": "PR10145",
        "requestedQty": 2,
        "blockedQty": 0,
        "keeper": {
            "remainingQty": 1,
            "type": "reserve"
        }
    }
]

var exampleResult = _.countBy(exampleList ,  ex => ex.keeper.remainingQty > 0);
console.log("---example count result---" , exampleResult);