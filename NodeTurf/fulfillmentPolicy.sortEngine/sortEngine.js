var _ = require("lodash");

const policies = [
    "FIFO",
    "LILO",
    "Expiry First",
    "Expiry Last",
    "Expiry date",
    "Highest MRP",
    "Lowest MRP",
    "Highest Cost",
    "Lowest Cost",
    "Offer First",
    "Offer Last"
];

/*
    - This returns the sort object based on the policy key words;
 */
function sortCustomizer(policyList) {
    var sort = {};
    policyList.map(policy => {
        switch (policy) {
            case "FIFO": sort["createdAt"] = "asc"; break; //1;
            case "LILO": sort["createdAt"] = "desc"; break;// -1
            case "Expiry First": sort["shelfLife"] = "asc"; break; // 1
            case "Expiry Last": sort["shelfLife"] = "desc"; break; // -1
            case "Expiry date": sort["shelfLife"] = "asc"; break; // 1
            case "Highest MRP": sort["mrp"] = "desc"; break; // -1
            case "Lowest MRP": sort["mrp"] = "asc"; break; // 1
            case "Highest Cost": sort["purchasePrice"] = "desc"; break; // -1
            case "Lowest Cost": sort["purchasePrice"] = "asc"; break; // 1
            case "Offer First": sort["offer"] = "desc"; break; // -1
            case "Offer Last": sort["offer"] = "asc"; break; // 1
            default: break;
        }
    });
    return sort;
}


/*
    - Main function which sorts inventories based on the given fulfillment policies;
    - calls sortCustomizer to get the sort object;
    - Then feeds to the engine and gets the desired result;
 */
function runEngine(inventoryList, policyList) {
    var sorter = sortCustomizer(policyList);
    console.log("Sorted object : ", sorter);

    var _sortKeys = [];
    var _sortValues = [];

    Object.keys(sorter).map(key => {
        _sortKeys.push(key);
        _sortValues.push(sorter[key]);
    });
    console.log("Sort keys : " , _sortKeys);
    console.log("Sort values : " , _sortValues);

    var result = _.orderBy(inventoryList, _sortKeys, _sortValues);

    return result;
}

/* 
    - [WH100 , WH200 ] - different createdAt;
    - [WH300 , WH400] - same createdAt but different expiry dates;
    - [WH500 , WH600] - same createdAt & shell life but different mrp's;
    Scenario 1 : ["FIFO", "Expiry First", "Lowest MRP"] ;  Result = [WH200 , WH100 ,WH400 , WH300 , WH600 , WH500];
*/
var inventoryList = [
    {
        "_id": "WH100",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-25T12:05:52.800Z"),//sort fields
        "shelfLife": new Date("2018-04-05T18:30:00.000Z"),//sort fields
        "mrp": 60,//sort fields
        "purchasePrice": 42.12,//sort fields
        "offer": "",//sort fields
    },
    {
        "_id": "WH200",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-20T12:05:53.274Z"),//sort fields
        "shelfLife": new Date("2018-04-04T18:30:00.000Z"),//sort fields
        "mrp": 50,//sort fields
        "purchasePrice": 35.1,//sort fields
        "offer": "",//sort fields
    },
    {
        "_id": "WH300",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-26T12:05:53.274Z"),//sort fields
        "shelfLife": new Date("2018-04-10T18:30:00.000Z"),//sort fields
        "mrp": 50,//sort fields
        "purchasePrice": 35.1,//sort fields
        "offer": "",//sort fields
    },
    {
        "_id": "WH400",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-26T12:05:53.274Z"),//sort fields
        "shelfLife": new Date("2018-04-04T18:30:00.000Z"),//sort fields
        "mrp": 50,//sort fields
        "purchasePrice": 35.1,//sort fields
        "offer": "",//sort fields
    },
    {
        "_id": "WH500",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-28T12:05:53.274Z"),//sort fields
        "shelfLife": new Date("2018-04-15T18:30:00.000Z"),//sort fields
        "mrp": 50,//sort fields
        "purchasePrice": 35.1,//sort fields
        "offer": "",//sort fields
    },
    {
        "_id": "WH600",
        "productId": "PR10017",
        "quantity": 3,
        "onHold": 0,
        "isGoodStock": true,
        "productType": "Normal Product",
        "createdAt": new Date("2018-03-28T12:05:53.274Z"),//sort fields
        "shelfLife": new Date("2018-04-15T18:30:00.000Z"),//sort fields
        "mrp": 40,//sort fields
        "purchasePrice": 35.1,//sort fields
        "offer": "",//sort fields
    }
];


/*
    - Invoked here;
 */
var result = runEngine(inventoryList, ["FIFO", "Expiry First", "Lowest MRP"]);
console.log("Sorted Result :", result);