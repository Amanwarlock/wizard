
var redisSMQ = require("rsmq");
var host = "127.0.0.1";
var port = "6379";
var rsmq = new redisSMQ({ port: port, host: host, ns: "rsmq-test" });//ns - string to prefix for all keys created by rsmq;

rsmq.createQueue({ qname: "myqueue" }, function (err, resp) {
    if (resp === 1) {
        console.log("queue created")
    }
});


rsmq.sendMessage({ qname: "myqueue", message: "Hello World" }, function (err, resp) {
    if (resp) {
        console.log("Message sent. ID:", resp);
    }
});

rsmq.receiveMessage({ qname: "myqueue" }, function (err, resp) {
    if (resp.id) {
        console.log("Message received.", resp)
    }
    else {
        console.log("No messages for me...")
    }
});

rsmq.listQueues(function (err, queues) {
    if (err) {
        console.error(err)
        return
    }
    console.log("Active queues: " + queues.join(","))
});

