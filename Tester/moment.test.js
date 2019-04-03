var moment = require("moment");

var date = "01-05-18"; //DD MM YYYY

var converted = moment(new Date(date)).format("MMM-DD-YYYY");

console.log("Moment date format---" , converted);