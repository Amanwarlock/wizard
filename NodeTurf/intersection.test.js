var _ = require("lodash");
var async = require("async");

//Group -1
var arr_1 = ["AMAN" , "KAREEM"];
var arr_2 = ["AMAN" , "MOHD"];

//Group -2
var arr_3 = [];
var arr_4 = ["AMAN"];

//Group -3
var arr_5 = ["AMAN"];
var arr_6 = ["AMAN"];

console.log("-----Test Group-1----" , _.intersection(arr_1 , arr_2));

console.log("-----Test Group-2----" , _.intersection(arr_3 , arr_4));

console.log("-----Test Group-3----" , _.intersection(arr_5 , arr_6));