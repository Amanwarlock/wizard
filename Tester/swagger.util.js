/**
 * @author Aman Kareem <aman.kareem@storeking.in>
 * @since March 25th 2019,
 * @description A utility snup for generation swagger data consumed for swagger UI;
 * 
 * const swaggerUi = require('swagger-ui-express');
 * app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
 * http://localhost:10027/api-docs
 */

"use strict;"
var jsyaml = require('js-yaml');
var path = require("path");
var fs = require('fs');
let log4js = require("log4js");
log4js.configure("log4jsConfig.json", {});
let logger = log4js.getLogger("warehouse");

const inputfile = "swagger.yaml";
const outputfile = "swagger.json";

module.exports = function () {

    logger.trace('Swagger API document generation ........');

    try {
        var obj = jsyaml.safeLoad(fs.readFileSync(path.join(__dirname, inputfile), { encoding: 'utf-8' }));
        fs.writeFileSync(path.join(__dirname, outputfile), JSON.stringify(obj, null, 2));
        return require("./" + outputfile);
    } catch (e) {
        logger.error("Error while generating swagger UI documentation : ", e.message);
    }

}


var swaggerDocument = require("./api/swagger/swagger.util.js")();


app.get("/apis", function (req, res) {
    res.status(200).send(swaggerDocument);
});