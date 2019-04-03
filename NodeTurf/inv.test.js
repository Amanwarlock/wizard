var async = require("async");
var _ = require("lodash");


function testAssociative(){
    var orderWhAllotedList = [];

    orderWhAllotedList["ORD100_1"] = [];
    orderWhAllotedList["ORD100_1"]["PR1001"] = [];
    orderWhAllotedList["ORD100_1"]["PR1001"]["WH100"] = 2;

    orderWhAllotedList["ORD100_2"] = [];
    orderWhAllotedList["ORD100_2"]["PR1002"] = [];
    orderWhAllotedList["ORD100_2"]["PR1002"]["WH102"] = 4;

    console.log("--associative---" , orderWhAllotedList);

    for(var whid in orderWhAllotedList){
        console.log("--whid key--" , whid);
    }
}

testAssociative();