

var d = new Date();
d.setDate("31");
d.setMonth("12");
d.setFullYear("2018");
d.setHours("23");
d.setMinutes("59");
d.setMilliseconds("999")

 console.log("Date" , d.toISOString());


 var d = new Date("2018-12-31T17:54:21.864+05:30");

 console.log("Local " , d.toLocaleTimeString());