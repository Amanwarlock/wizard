/* 
    - Stop code by pressing : ctrl + alt + M;
*/
var redis = require('redis');
var host = "127.0.0.1";
var port = "6379";
//var client = redis.createClient(port, host); //creates a new client

var RSMQWorker = require("rsmq-worker");
var options = { "host": host, "port": port };
var worker = new RSMQWorker("myqueue", {
    "host": host,
    "port": port,
    "autostart": true,
    "maxReceiveCount": 1,
    "defaultDelay" : 0,
});
//worker.start(); // Manual start

function pushToQueue(list) {
    var _list = JSON.stringify(list);
    worker.send(_list, function (err, res) {
        //console.log("---errr---" , err);
       // console.log("--result---" , res);
    });

}

/* 
    - Stop code by pressing : ctrl + alt + M;
*/

worker.on("message", function (message, next, msgid) {
    var list = JSON.parse(message);
    // process message ...  
    getResult().then(() => {
        console.log("---processed queue---", list, msgid , list[0]);
        worker.size(false, (err , count) => console.log("---size---", count));
        //console.log("--calling next---");
        //worker.del(msgid , ()=> console.log("-success delete"));//To delete manually
        next()
    });
    // next();
});

worker.on('error', function( err, msg ){
    console.log( "ERROR", err, msg.id );
});

worker.on("deleted", function (msgid) {
    console.log("deleted----" , msgid);
});


function getResult() {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve();
        }, 100);

    });
}

var entities = [["Aman", "Kareem"], ["storeking", "OMS"]];



pushToQueue(entities[0]);

pushToQueue(entities[1]);


/* setTimeout(function () {
    worker.stop();
}, 1000); */