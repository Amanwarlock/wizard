var _ = require("lodash");
var async = require("async");

/* 
    - Javascript has two loop labels - continue and break;
*/

var productList = [{
    "productId": "PR100",
    "qty": 2
}, {
    "productId": "PR200",
    "qty": 0
}, {
    "productId": "PR300",
    "qty": 10
}];

var inventoryList = [
    {
        "_id": "WH100",
        "productId": "PR100",
        "qty": 2
    },
    {
        "_id": "WH200",
        "productId": "PR200",
        "qty": 1
    },
    {
        "_id": "WH300",
        "productId": "PR300",
        "qty": 5
    },
]

/*
    - continue loop example
 */

function iterator(productList, invetoryList) {
    top:
    for (var i = 0; i < productList.length; i++) {
        var product = productList[i];
        if (!product || product.qty <= 0) {
            continue top;
        }
        inner:
        for (var j = 0; j < invetoryList.length; j++) {
            var inventory = invetoryList[j];
            break top;
        }
    }
    console.log("Iteration completed...");
}

iterator(productList, inventoryList);