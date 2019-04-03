var _ = require("lodash");

var subOrders = [{_id : "ORD100_1" , "invoice_seperately" : true},
{"_id" : "ORD100_2" , "invoice_seperately" : false}
]


var result = _.groupBy(subOrders , "invoice_seperately");


console.log("Result of group by : " , result);

var invoiceSeparately = result["true"];

console.log("Separate invoices---: " , invoiceSeparately);