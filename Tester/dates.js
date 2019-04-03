var _ = require("lodash");
var moment = require("moment");

var dt = new Date();

var d = new Date('2019', '1', 0);

var firstDay = new Date(dt.getFullYear(), dt.getMonth(), 1);
var lastDay = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);

console.log("First Day ---------", firstDay);
console.log("Last Day ----------", lastDay);

console.log("Current month", dt.getMonth(), new Date('2018', '12', 0).getMonth(), new Date().getDate());

console.log(" Date formation ---------", new Date(2019, 0, 14, 23, 59, 59, 999));

console.log("Month name : ", new Date(2019, 0).getMonth());

moment.utc().endOf('day').toDate()

function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

console.log("Days In Month - ", getDaysInMonth(12, 2018));


//console.log("First day of a month: -------" , getFirstDayOfAMonth(0,2019));

console.log("Start of today ", getstartOfDay(2019, 0, 15), " ------", new Date(2019, 0, -1));

var nextDay = getNextDay(2018, 11, 30);
console.log("Next day : -------",nextDay ,`/ month - ${nextDay.getMonth()} - day ${nextDay.getDate()} - year - ${nextDay.getFullYear()}` );

function getLastDayOfAMonth(month, year) {
    var dt = new Date();
    dt.setFullYear(year);
    dt.setMonth(month);

    return new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
}


function getFirstDayOfAMonth(month, year) {
    var dt = new Date();
    dt.setFullYear(year);
    dt.setMonth(month);

    return new Date(dt.getFullYear(), dt.getMonth(), 1);
}

function getstartOfDay(year, month, day) {
    return new Date(year, month, day, 00, 00, 00, 000);
}

function getEndOfDay(year, month, day) {
    return new Date(year, month, day, 23, 59, 59, 999);
}

function getNextDay(year, month, day) {
    let d = new Date(year, month, day);

    return new Date(year, month, day+1);
}