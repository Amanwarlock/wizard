

var _ = require("lodash");

var ids = ["WMF0" , "WMF1"];

function test(whId){
    var whList = [whId].concat(ids);
    whList = _.uniq(whList);
    console.log("Wh list---"  , whList);
}

test("WMF0")