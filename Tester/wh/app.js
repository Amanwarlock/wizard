"use strict";

let SwaggerExpress = require("swagger-express-mw");
let app = require("express")();
let config = require("config");
let log4js = require("log4js");
var puttu = require("puttu-redis");
var kue = require("kue");
var kue_ui = require("kue-ui");
puttu.connect();
var http = require("http");
var cuti = require("cuti");
//process.env.DEV_ENV = true;
process.env.INTERFACE = "wlan0";
log4js.configure("log4jsConfig.json", {});
let logger = log4js.getLogger("warehouse");
app.locals.logger = logger;

app.use("/kue-ui", kue.app); //visit : http://localhost:10027/kue-ui/active

if (process.env.TEST_ENV) {
    app.locals.test = true;
    logger.setLevel("FATAL");
    logger.warn("Detected Test environment, Cross service validations disabled");
} else {
    app.locals.test = false;
}
module.exports = app; // for testing
var counter = 0;

var logMiddleware = (req, res, next) => {
    var reqId = counter++;
    if (reqId == Number.MAX_VALUE) {
        reqId = counter = 0;
    }
    logger.info(reqId + " " + req.ip + " " + req.method + " " + req.originalUrl);
    next();
    logger.trace(reqId + " Sending Response");
};

app.use(logMiddleware);
app.use(function (req, res, next) {
    if (req.method == "OPTIONS") next();
    else if (process.env.TEST_ENV) next();
    else if (req.headers["authorization"]) {
        cuti.request.getUrlandMagicKey("user").then(options => {
            options.path = "/validateUser";
            options.headers = {
                "authorization": req.headers["authorization"],
                "content-type": "application/json"
            };
            http.request(options, response => {
                if (response.statusCode == 200) {
                    var data = "";
                    response.on("data", _data => data += _data.toString("utf8"));
                    response.on("end", () => { req.user = JSON.parse(data); next(); });
                }
                else {
                    res.status(401).json("unauthorized");
                }
            }).end();
        });
    }
    else if (req.headers.magickey) {
        puttu.getMagicKey("wh").then(key => key == req.headers.magickey ? next() : res.status(401).json("unauthorized"));
    }
    else {
        res.status(401).json("unauthorized");
    }
});
let Rconfig = {
    appRoot: __dirname // required config
};

let data = {};
SwaggerExpress.create(Rconfig, function (err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    let port = process.env.PORT || 10027;
    app.listen(port, () => {
        logger.trace("Warehouse server started on port number " + port);
        data.port = port;
        data.protocol = "http";
        data.api = "/wh/v1";
        puttu.register("wh", data, process.env.INTERFACE);
    });

    // if (swaggerExpress.runner.swagger.paths['/hello']) {
    //   console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
    // }
});