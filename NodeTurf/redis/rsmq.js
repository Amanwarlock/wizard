
var redisSMQ = require("rsmq");
var host = process.env.REDIS_CON.split(":")[0];
var port = process.env.REDIS_CON.split(":")[1];
var rsmq = new redisSMQ({ port: port, host: host, ns: "STKLED" });//ns - string to prefix for all keys created by rsmq;


rsmq.createQueue({ qname: "stock_ledgers" }, (err, resp) => {
    if (resp === 1)
        logger.log("Queue creation successful")
});

rsmq.sendMessage({ qname: "stock_ledgers", message: entity }, function (err, resp) {
    if (resp)
        logger.info("Request in queued..");
    else
        logger.error(err.message);
});


function init(_worker, _crudder) {
    worker = _worker;
    crudder = _crudder;
    setInterval(function () {
        rsmq.popMessage({ qname: "stock_ledgers" }, function (err, resp) {
            if (resp && resp.id && resp.message) {
                logger.trace("Processing rsmq queue..", resp.message);
                var payload = resp.message;
                try {
                    payload = JSON.parse(payload);
                    processStockLedgers(payload);
                } catch (e) { logger.error(e.message) }
            }
        });
    }, 100);
}