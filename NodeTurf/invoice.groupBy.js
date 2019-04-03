var async = require("async");
var _ = require("lodash");
var invData = require("./invoice.data");



var orderMatrix = [{
    "subOrderId": "ORD1001_1",
    "productId": "PR10001",
    "snapShotId": "WH100",
    "inventoryQty": 4,
    "inventoryKeeper": { "allotedQty": 4, "differentialQty": 4, "changedQty": 4, "type": "unreserve" }
},
{
    "subOrderId": "ORD1001_3",
    "productId": "PR10001",
    "snapShotId": "WH101",
    "inventoryQty": 2,
    "inventoryKeeper": { "allotedQty": 2, "differentialQty": 1, "changedQty": 2, "type": "reserve" }
},
{
    "subOrderId": "ORD1001_2",
    "productId": "PR10001",
    "snapShotId": "WH102",
    "inventoryQty": 4,
    "inventoryKeeper": { "allotedQty": 4, "differentialQty": 0, "changedQty": 4, "type": "noChange" }
}
]

var test = [
    {
        "subOrderId": "OR201803264_1",
        "inventorykeeper": {
            "type": "unreserve"
        }
    },
    {
        "subOrderId": "OR201803264_2",
        "inventorykeeper": {
            "type": "noChange"
        }
    },
    {
        "subOrderId": "ORD1001_1",
        "inventoryKeeper": { "type": "unreserve" }
    }
]

var result = _.groupBy(orderMatrix, 'inventoryKeeper.type');
console.log("----grouped matrix----", result);

function formatList(_list) {
    var formattedList = [];
}

//TEST to.Fixed;
var value = 14.166666666666668;
parsed = value.toFixed(2);
parseFloat = parseFloat(value);

console.log("-----tpye of value----" , typeof parsed , parsed);
console.log("----float parse-----" , typeof parseFloat , parseFloat);