
var _ = require("lodash");

var snapShot_one = [
    {
        "_id": "WH4552",
        "productId": "PR10960",
        "quantity": 10,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-10-04T18:30:00.000Z",
        "mrp": 101,
        "purchasePrice": 81.81,
        "offer": "",
        "createdAt": "2018-03-05T06:01:08.481Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH4556",
        "productId": "PR10960",
        "quantity": 2,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-04-05T18:30:00.000Z",
        "mrp": 101,
        "purchasePrice": 81.81,
        "offer": "",
        "createdAt": "2018-03-06T05:29:16.908Z",
        "productType": "Normal Product"
    }
];

var snapShot_two = [
    {
        "_id": "WH3601",
        "productId": "PR10462",
        "quantity": 994,
        "onHold": 6,
        "isGoodStock": true,
        "shelfLife": "2017-12-08T18:30:00.000Z",
        "mrp": 300,
        "purchasePrice": 288,
        "offer": "",
        "createdAt": "2017-08-30T09:46:41.071Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH3982",
        "productId": "PR10462",
        "quantity": 453,
        "onHold": -153,
        "isGoodStock": true,
        "shelfLife": "2018-01-05T18:30:00.000Z",
        "mrp": 300,
        "purchasePrice": 270,
        "offer": "",
        "createdAt": "2017-11-30T12:44:04.213Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH3983",
        "productId": "PR10462",
        "quantity": 2,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-01-05T18:30:00.000Z",
        "mrp": 300,
        "purchasePrice": 270,
        "offer": "",
        "createdAt": "2017-11-30T12:44:04.725Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH3984",
        "productId": "PR10462",
        "quantity": 2,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-01-05T18:30:00.000Z",
        "mrp": 302,
        "purchasePrice": 271.8,
        "offer": "",
        "createdAt": "2017-11-30T12:44:05.060Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH3985",
        "productId": "PR10462",
        "quantity": 1,
        "onHold": 0,
        "isGoodStock": true,
        "shelfLife": "2018-01-05T18:30:00.000Z",
        "mrp": 305,
        "purchasePrice": 274.5,
        "offer": "",
        "createdAt": "2017-11-30T12:44:05.661Z",
        "productType": "Normal Product"
    },
    {
        "_id": "WH3986",
        "productId": "PR10462",
        "quantity": 1,
        "onHold": 1,
        "isGoodStock": true,
        "shelfLife": "2018-01-05T18:30:00.000Z",
        "mrp": 300,
        "purchasePrice": 270,
        "offer": "",
        "createdAt": "2017-11-30T12:44:06.042Z",
        "productType": "Normal Product"
    }
];

var policy_one = ["FIFO"];
var policy_two = ["Lowest MRP"];
var policy_three = ["FIFO" , "Lowest MRP"];
var policy_four = ["LILO"];
var policy_five = ["FIFO" , "Expiry First"];

//oldest  = 1 , latest = -1 ; highest = -1 ; lowest = 1
function sortBy( list,policyList ){
    var customizer = function(list , property, isReverse){
        if(isReverse){
            //sorts in ascending and then reverses the array to get descending;
            list = _.reverse(_.sortBy(list , [property]));
        }
        else{
            //sorts in ascending;
            list = _.sortBy(list , [property]);
        }
        return list;
    }
    
    policyList.map(policy =>{
        var param = null;
        switch(policy){
            case "FIFO" : param = "createdAt:1" ; break;
            case "LILO" : param = "createdAt:-1" ; break;
            case "Expiry First" : param = "shelfLife:1"; break;
            case "Expiry Last" : param = "shelfLife:-1"; break;
            case "Expiry date" : param = "shelfLife:1"; break;
            case "Highest MRP" : param = "mrp:-1";break;
            case "Lowest MRP" : param = "mrp:1";break;
            case "Highest Cost" : param = "purchasePrice:-1";break;
            case "Lowest Cost" : param = "purchasePrice:1" ; break;
            case "Offer First" : param = "offer:-1";break;
            case "Offer Last" : param = "offer:1";break;
        }
        var property = param.split(":")[0];
        var order = parseInt(param.split(":")[1]);
        var isReverse = order === 1 ? false : true;
        console.log("---property---" ,property , "-----order---" , order , "----isReverse---" , isReverse );
        var result = customizer(list , property , isReverse);
        console.log("---result---" , result);
    });
    
};

sortBy(snapShot_two , policy_five);