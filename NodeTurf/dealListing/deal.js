var async = require("async");
var _ = require("lodash");
var snapShots = require("./snapshots");

function dealListingSnapshots(params) {
    var productList = params['products'];
    var productIdList = productList.map(el => el.productId);
    productIdList = _.uniq(productIdList);
    var whGroup = _.groupBy(productList, "whId");
    var entityList = [];
    Object.keys(whGroup).map(key => {
         whGroup[key] =  whGroup[key].map(el => el.productId);
    });
    console.log("---group---", whGroup);
}


var payload = {
    "products": [
        {
            "whId": "WMF1",
            "productId": "PR1001"
        },
        {
            "whId": "WMF0",
            "productId": "PR1002"
        }
    ]
}

dealListingSnapshots(payload);