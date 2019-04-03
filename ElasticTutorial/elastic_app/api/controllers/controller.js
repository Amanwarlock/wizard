"use strict";
var http = require("http");
const bulkIndexCtrl = require("./bulk.index");

module.exports = {
    v1_bulkIndex: bulkIndexCtrl.bulkIndex
}