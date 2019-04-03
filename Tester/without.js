

const _ = require("lodash");

var whIds = ["WMF1" , "WMF2" , "WMF3"]; //in DB


function getDiff(mapped){
    return _.without(whIds , ...mapped);
}


console.log("Result : ----------------" , getDiff(["WMF4"]));