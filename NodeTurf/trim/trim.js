var _ = require("lodash");

var name = "";



function trimName(name) {
    var _name = _.trim(name) ? name : null
    return _name; 
}

var result = trimName(" ");

console.log("result of string trim : " ,result);