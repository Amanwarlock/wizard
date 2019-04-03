
var _ = require("lodash");

var wh_1 = [
    {
        "_id": "WH4584",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-04-05T18:30:00.000Z",
        "mrp": 60,
        "purchasePrice": 42.12,
        "offer": "",
        "createdAt": "2018-03-20T12:05:52.800Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH4585",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-04-04T18:30:00.000Z",
        "mrp": 50,
        "purchasePrice": 35.1,
        "offer": "",
        "createdAt": "2018-03-25T12:05:53.274Z",
        "productType": "Normal Product"
    }
];


function applyFulfillmentPolicy(snapShotList, policyList) {
    var sortedList = [];
    var customizer = function (_list, _prop, isReverse) {
        if (isReverse) {
            //sorts in ascending and then reverses the array to get descending;
            _list = _.reverse(_.sortBy(_list, [_prop]));
        }
        else {
            _list = _.sortBy(_list, [_prop]);
        }
        return _list;
    };
    policyList.map(policy => {
        var param = null;
        var groupBy = null;
        switch (policy) {
            case "FIFO": param = "createdAt:1"; groupBy = "createdAt"; break;
            case "LILO": param = "createdAt:-1"; groupBy = "createdAt"; break;
            case "Expiry First": param = "shelfLife:1"; break;
            case "Expiry Last": param = "shelfLife:-1"; break;
            case "Expiry date": param = "shelfLife:1"; break;
            case "Highest MRP": param = "mrp:-1"; groupBy = "mrp"; break;
            case "Lowest MRP": param = "mrp:1"; groupBy = "mrp"; break;
            case "Highest Cost": param = "purchasePrice:-1"; break;
            case "Lowest Cost": param = "purchasePrice:1"; break;
            case "Offer First": param = "offer:-1"; break;
            case "Offer Last": param = "offer:1"; break;
        }
        var property = param.split(":")[0];
        var order = parseInt(param.split(":")[1]);
        var isReverse = order === 1 ? false : true;
        sortedList = customizer(snapShotList, property, isReverse);
        console.log("---group---" , groupBy);
    });
    return sortedList;
}

var policy_LILO = ["LILO"];
var policy_FIFO = ["FIFO"];

//var result = applyFulfillmentPolicy(wh_1, policy_LILO);

//console.log("----result----", result);

function sortCustomizer(policyList) {
    var sort = {};
    policyList.map(policy => {
        switch (policy) {
            case "FIFO": sort["createdAt"] = 1; break;
            case "LILO": sort["createdAt"] = -1; break;
            case "Expiry First": sort["shelfLife"] = 1; break;
            case "Expiry Last": sort["shelfLife"] = -1; break;
            case "Expiry date": sort["shelfLife"] = 1; break;
            case "Highest MRP": sort["mrp"] = -1; break;
            case "Lowest MRP": sort["mrp"] = 1; break;
            case "Highest Cost": sort["purchasePrice"] = -1; break;
            case "Lowest Cost": sort["purchasePrice"] = 1; break;
            case "Offer First": sort["offer"] = -1; break;
            case "Offer Last": sort["offer"] = 1; break;
            default: break;
        }
    });
    return sort;
}

var result = sortCustomizer([]);

console.log("---result----" , result);