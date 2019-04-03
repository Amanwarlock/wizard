var async = require("async");
var _ = require("lodash");



var ledgers = [{ _id: "10001234" }, { _id: "10009876" }];


function findOrder() {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            console.log("--resolveing order----");
            return resolve();
        }, 5000);
    });
}


function testOnReservationChange(stockLedgers) {
    var errlist = [];
    var updated = [];

    var queue = async.queue(function (_ledger, queueCB) {
        console.log("---ledger in queue---", _ledger);
        findOrder().then(() => {
            queueCB(null, _ledger);
        }).catch(e => queueCB(new Error()));
    });

    queue.drain = function () {
        console.log("---queue ended-----" , updated);
    };

    /*  _.each(stockLedgers, _ledger => {
         queue.push(_ledger, function (err, doc) {
             if (err)
                 errlist.push(err);
             else
                 updated.push(doc);
                 console.log("---updated list---" , updated);
         });
     }); */


    queue.push(stockLedgers, function (err, doc) {
        if (err)
            errlist.push(err);
        else
            updated.push(doc);
       // console.log("---updated list---", updated);
    });
}


testOnReservationChange(ledgers);