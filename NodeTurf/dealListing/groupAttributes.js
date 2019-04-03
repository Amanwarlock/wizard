var _ = require("lodash");
var async = require("async");

var snapShots = [
    {
        "_id": "WH4450",
        "quantity": 2,
        "mrp": 60,
        "whId": "WMF0",
        "createdAt": "2017-12-30T07:02:16.164Z",
        "onHold": 0,
        "offer": "TEST",
        "groupKey": "60_TEST"
    },
    {
        "_id": "WH4452",
        "quantity": 4,
        "mrp": 60,
        "whId": "WMF0",
        "createdAt": "2017-12-30T07:10:41.165Z",
        "onHold": 0,
        "offer": "",
        "groupKey": "60_"
    },
    {
        "_id": "WH4454",
        "quantity": 6,
        "mrp": 40,
        "whId": "WMF0",
        "createdAt": "2017-12-30T09:09:18.476Z",
        "onHold": 0,
        "offer": "",
        "groupKey": "40_"
    },
    {
        "_id": "WH4566",
        "quantity": 8,
        "mrp": 60,
        "whId": "WMF0",
        "createdAt": "2018-04-27T06:57:05.765Z",
        "onHold": 2,
        "offer": "TEST",
        "groupKey": "60_TEST"
    }
];


var group = _.groupBy(snapShots , "groupKey");

console.log("--attribute- group-----" , group);