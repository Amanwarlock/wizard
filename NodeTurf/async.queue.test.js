"use strict;"
var async = require("async");
var _ = require("lodash");

var arr = [[{
    whId : 'WMFO',
    snapShot : "WH123",
    productId : "PR1024"
}]];

function process(){
    var queue = async.queue(processor);

    _.each(arr , el =>{
        console.log("---element----" , el);
        queue.push(el , function(err){
            if(err) console.log("----err----",err);
        });
    });
}

function processor(el , callback){
    console.log("---processor----" , el);
    callback(null , el);
};

/* ----------------------------------------------------------------------------------------------------------- */
var ledger = [{
    "snapShotId": "WH4552",
    "warehouseId": "WMF0",
    "productId": "PR10960",
    "reference": { "subOrderId": "ORD6769" },
    "referenceType": "Stock Reservation",
    "requestQty": 4,
    "log" : ""
},
{
    "snapShotId": "WH4554",
    "warehouseId": "WMF0",
    "productId": "PR10960",
    "reference": { "subOrderId": "ORD6770" },
    "referenceType": "Invoiced",
    "requestQty": 100,
    "log" : ""
}]


function updateSnap(ledgerList){
    var successList = [];
    var failedList = [];
    var queue = async.queue(function(entity , callback){
        referenceTypeTrigger(entity.referenceType , entity )
            .then(result =>{
                entity.status = "Committed";
                entity.log = "Success";
                callback(null , entity);
            })
            .catch(e =>{
                entity.status = "Failed";
                entity.log = e.message;
                callback(entity , null);
            });
    });
    _.each(ledgerList , doc => {
        queue.push( doc , function(err , doc){
            if(err){
                failedList.push(err);
            }else if(doc){
                successList.push(doc);
            }
        });
    });

    queue.drain = function(){
        console.log("---success list----" ,successList );
        console.log("------Failed List----" , failedList);
    };

}

function referenceTypeTrigger(referenceType , entity){
    switch(referenceType){
        case "Stock Reservation" : return Promise.resolve();
        case "Invoiced" : return Promise.reject(new Error(`Invalid quantity`));
    }
}


updateSnap(ledger);