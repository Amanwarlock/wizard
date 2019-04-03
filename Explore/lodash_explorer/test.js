var _ = require("lodash");

var personList = [
    {
        name: "aman",
        gender: "male"
    },
    {
        name : "nagu",
        gender : "female"
    }
];


var result = _.find(personList , {"name" : "aman"});

console.log("----result--" , result);