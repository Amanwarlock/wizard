var kue = require('kue');


var kueWorker = kue.createQueue({
    redis: {
        host: "35.154.48.174",
        port: "6379"
    }
});

kueWorker.inactive(function (err, ids) {

});