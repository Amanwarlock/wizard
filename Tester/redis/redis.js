/* 
    - Stop code by pressing : ctrl + alt + M;
*/
var redis = require('redis');
var host = "127.0.0.1";
var port = "6379";
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

var RSMQWorker = require("rsmq-worker");
var options = { "host": host, "port": port };
var worker = new RSMQWorker("myQueue", {
    "host": host,
    "port": port,
    "autostart": true,
    "maxReceiveCount": 1,
    "defaultDelay": 0,
    "interval": 0.1,
    "timeout": 180000 // in ms - 3 min  
});


/* 
    - Stop code by pressing : ctrl + alt + M;
*/

worker.on("message", function (message, next, msgid) {
    console.log(chalker.blue(`RECEIVED ITEM - ${message}: ${new Date().toISOString()}`));
    queryResult().then(() => {
        console.log(chalker.yellow("RESOLVED: Returning Query result ...", new Date().toISOString()));
        next()
    });
});


function queryResult() {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            if (itr) {
                itr--;
                pushToQueue(6);
            }
            resolve();
        }, timeOut);

    });
}


function pushToQueue(list) {
    var _list = JSON.stringify(list);
    worker.send(_list, function (err, res) {
        console.log(`-----PUSHED TO QUEUE - [${_list}]-----`, new Date().toISOString());
    });

}

var entities = [1, 2, 3, 4, 5];

const timeOut = 4000//60000;// 1 minute in ms //ms

var itr = 1;

pushToQueue(entities[0]);
pushToQueue(entities[1]);
pushToQueue(entities[2]);
pushToQueue(entities[3]);
pushToQueue(entities[4]);
