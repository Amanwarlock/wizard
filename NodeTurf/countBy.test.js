var _ = require("lodash");


var performa =  [{
    status : "Cancelled"
},{
    status : "Completed"
}];

var status = "Pending";

var pendingCount = _.countBy(performa , {"status" : "Pending"});
var cancelledCount = _.countBy(performa, { status: "Cancelled" });//Completed
var completedCount = _.countBy(performa, { status: "Completed" })

status = pendingCount.true > 0 ? "Pending" : status;
status = cancelledCount.true === performa.length ? "Cancelled" : status;
status = completedCount.true > 0 && !pendingCount.true ? "Completed" : status;

console.log(`The counts are: Pending count - ${JSON.stringify(pendingCount)} ; cancelled count - ${JSON.stringify(cancelledCount)} ; completedCount - ${JSON.stringify(completedCount)}`);

console.log("Status is: " , status);