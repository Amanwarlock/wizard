var _ = require("lodash");
var async = require("async");


//_.findIndex(users, { 'user': 'fred', 'active': false });

// _.findIndex(users, function(o) { return o.user == 'barney'; });

//_.findIndex(users, ['active', false]);

var order = {
    "_id": "OR2018041056",
    "paymentStatus": "Paid",
    "invoices": [
        {
            "invoiceNo": "IN17100000763",
            "amount": 197,
            "isCustomerReturn": false,
            "processRefund": false,
            "isRTO": false,
            "isCulled": false,
            "commissionReleased": "Pending",
            "status": "New"
        }
    ],
    "stockAllocation": "Allocated",
    "subOrders": [
        {
            "name": "Engage On Woman Pocket Perfume - Sweet Blossom (18ml)",
            "mrp": 60,
            "b2bPrice": 51,
            "quantity": 4,
            "_id": "OR2018041056_1",
            "batchId": "BR2018041017",
            "invoiced": true,
            "processed": true,
            "readyForBatching": true,
            "snapshots": [
                {
                    "ledgerId": "10001561523383618527",
                    "snapShotId": "WH4584",
                    "productId": "PR10017",
                    "quantity": 1,
                    "mrp": 60,
                    "location": "Normal",
                    "area": "NormalAR-WMF0-1",
                    "rackId": "Rack-1",
                    "binId": "Bin-1",
                    "type": "Reserved",
                    "createdAt": "2018-04-10T23:36:58.754+05:30"
                }
            ],
            "blockedProducts": {
                "productId": "PR10017",
                "quantity": 2
            },
            "requestedProducts": [
                {
                    "productId": "PR10017",
                    "quantity": 4
                }
            ],
            "status": "Invoiced"
        }
    ],
    "status": "Processing"
};

var subOrder = {
    "name": "Engage On Woman Pocket Perfume - Sweet Blossom (18ml)",
    "mrp": 60,
    "b2bPrice": 51,
    "quantity": 4,
    "_id": "OR2018041056_1",
    "batchId": "BR2018041017",
    "invoiced": true,
    "processed": true,
    "readyForBatching": true,
    "snapshots": [
        {
            "ledgerId": "10001561523383618527",
            "snapShotId": "WH4584",
            "productId": "PR10017",
            "quantity": 1,
            "mrp": 60,
            "location": "Normal",
            "area": "NormalAR-WMF0-1",
            "rackId": "Rack-1",
            "binId": "Bin-1",
            "type": "Reserved",
            "createdAt": "2018-04-10T23:36:58.754+05:30"
        }
    ],
    "blockedProducts": {
        "productId": "PR10017",
        "quantity": 2
    },
    "requestedProducts": [
        {
            "productId": "PR10017",
            "quantity": 4
        }
    ],
    "status": "Invoiced"
}

var whIndex = _.findIndex(order, { 'order.subOrders.snapshots.snapShotId': 'WH4584' });

console.log("----wh index----", whIndex);


var whIndex_2 = _.findIndex(subOrder, { 'snapshots.snapShotId': 'WH4584' });

console.log("----wh index----", whIndex_2);

var whIndex_3 = _.findIndex(subOrder.snapshots, function (o) { return o.snapShotId == 'WH4584'; });

console.log("----wh index----", whIndex_3);

var key = `subOrders.$.snapshots.${whIndex_3}`;

var set = { [`subOrders.$.snapshots.${whIndex_3}`]: 0 };
//set[key] = 0
console.log("---set---", set);

var setter = {"subOrders.$.blockedProducts" : 0};

var pusher = {"subOrders.$.snapshots" : {"snapshotid" : "weiuryi"}};

pusher = Object.assign(pusher , {"subOrders.$.blockedProduct" : {"productId" : "PR10017" , "quantity" : 5}});

var updateBuilder = {};

console.log("---is empty---" , _.isEmpty(pusher));

if (pusher && !_.isEmpty(pusher)) {
    updateBuilder = Object.assign({}, { "$set": setter }, { "$push": pusher });
} else {
    updateBuilder = Object.assign({}, { "$set": setter });
}   

console.log("--update builder----" ,updateBuilder );