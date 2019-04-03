
"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

/* ######################################## */
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();
/* -------------------------------------------------------------------------------------------- */

/* Mongo URL */
//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
const url ="mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@localhost:6161/skstaging"; // SSH TUNNEL TO LIVE

/* --------MONGO CONNECT------ */
var options = { "useNewUrlParser": true };
Mongoose.connect(url, options);
var db = Mongoose.connection;

/* -----LISTENERS------ */
db.on('error', function () {
  console.log("Connection Error....");
  process.exit();
});

db.once('open', function callback() {
  console.log("Connection established to : ", url);
  runScript();
});
/********************************************************************************************************************************************/


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const payload = {
  "asCancelled": true,
  "isBatchRetained": true,
  "performaInvoice": "PR220107",
  "orderId": "OR20190315283819",
  "subOrderList": [
    {
      "_id": "OR20190315283819_1",
      "dealId": "D0044685498",
      "scan": [
        {
          "inventoryids": [
            "WH53722"
          ],
          "quantity": 4,
          "productId": "PR14953",
          "mrp": 599,
          "serialNo": [
            "16641/01467899"
          ]
        }
      ]
    },
    {
      "_id": "OR20190315283819_2",
      "dealId": "D0531679491",
      "scan": [
        {
          "inventoryids": [
            "WH53722"
          ],
          "quantity": 2,
          "productId": "PR14953",
          "mrp": 599,
          "serialNo": [
            "16641/01467899"
          ]
        },
        {
          "inventoryids": [
            "WH53740"
          ],
          "quantity": 11,
          "productId": "PR14956",
          "mrp": 599,
          "serialNo": []
        },
        {
          "inventoryids": [
            "WH52727"
          ],
          "quantity": 2,
          "productId": "PR14956",
          "mrp": 599,
          "serialNo": []
        }
      ]
    }
  ]
}

const token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE5LTAzLTE0VDE5OjAxOjMyLjc2OFoiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOS0wMy0wNFQwNzowNDowOS42NzZaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMyIsIldNRjQiLCJXTUYyIiwiV01GMSIsIldNRjAiLCJXTUY1IiwiV01GNiIsIldNRjciXSwiZGVmYXVsdFdoSWQiOiJXTUYwIn0sInJvbGVJZCI6IlJPTEUxIiwiaWF0IjoxNTUyODg2MjM1LCJleHAiOjE1NTI5NzI2MzV9.LcEcbQItcroZ4DwyS6psocTFmB96zNMzr9DPHbt08sE";

function runScript() {
  /*  rl.question('Enter Invoice payload : \n', (payload) => {
       // TODO: Log the answer in a database
       console.log(`Thank you ....:`, typeof payload);
       _inputsValidation(JSON.parse(payload))
           .then(result => {
               console.log("Result : ", result);
           })
           .catch(e => console.log("Invoice Validation error : ", e))
       rl.close();
   }); */

  _inputsValidation(JSON.parse(JSON.stringify(payload)))
    .then(result => {
      console.log("Result : ", result);
      process.exit();
    })
    .catch(e => {
      console.log("Invoice Validation error : ", e);
      process.exit();
    })
}


function _inputsValidation(payload) {
  return new Promise((resolve, reject) => {
    async.waterfall([
      _inputsQuantityCheck(payload),
      _serialNumberCheck,
      _orderProductInputQuantityCheck
    ], function (err, success) {
      if (err)
        reject(err);
      else if (success)
        resolve(payload);
    });
  });
}

function _inputsQuantityCheck(payload) {
  return function (callback) {
    var errHandling = [];
    var ordersQueue = async.queue(function (subOrder, callbacksubOrder) {
      async.each(subOrder.scan, function (scanList, callbackscanList) {
        var invs = [];
        //Hey Dont Get Confuse .... As per Discussion we won't get multiple inventoryIds
        scanList.inventoryids.forEach(i => invs.push(JSON.stringify(i)));
        var input = "filter={\"_id\":{\"$in\":[" + invs + "]}}&select=_id,quantity,onHold,serialNo,productId";
        //_requestHttp("wh", "snapshot", "GET", input, function (err, whData) {
        ////"/api/wh/v1" + _path;
        var path = `/api/wh/v1/snapshot?${input}`;
        _fire(path, "GET", null).then((whData, err) => {
          if (err) {
            errHandling.push({
              "Error": err
            });
            callbackscanList(errHandling, scanList);
          } else {
            var whqty = 0;
            var AvailbleSerialNosInventory = [];
            whData.forEach(w => {
              whqty = whqty + (w.quantity + w.onHold);
              w.serialNo.forEach(s => AvailbleSerialNosInventory.push(s));
            });

            if (whqty < scanList.quantity) {
              console.log(`Stock Details : Warehouse-qty = ${whqty} / Scanned = ${scanList.quantity} / Suborder = ${subOrder._id} / ProductId = ${scanList.productId}`);
              errHandling.push({
                "Error": "Stock not Available to process order - " + subOrder._id
              });
              callbackscanList(null, scanList);
            } else {
              if (scanList.serialNo != undefined && scanList.serialNo.length > 0) {
                if (scanList.serialNo.length != scanList.quantity) {
                  errHandling.push({
                    "Error": "serialNumber/Quantity Mismatch - " + subOrder._id
                  });
                  callbackscanList(null, scanList);
                } else {
                  if (scanList.serialNo && scanList.serialNo.length > 0) {
                    scanList.serialNo.forEach(sno => {
                      if (!_.includes(AvailbleSerialNosInventory, sno))
                        errHandling.push({
                          "Error": " Invalid serialNumber - " + sno
                        });
                    });

                    callbackscanList(null, scanList);
                  } else
                    callbackscanList(null, scanList);
                }

              } else
                callbackscanList(null, scanList);
            }

          }
        }).catch(e => console.log("Error : ", e));
      }, function (err, success) {
        callbacksubOrder(null, subOrder);
      });
    }, 1);

    ordersQueue.drain = function () {
      if (errHandling.length > 0) {
        callback(errHandling, payload);
      } else {
        callback(null, payload);
      }
    };

    _.each(payload.subOrderList, function (suborder) {
      ordersQueue.push(suborder, function (err, resp) {
        if (err) console.log(err.message);
      });
    });
  };
}

function _serialNumberCheck(payload, callback) {
  // console.log("_serialNumberCheck");
  var errHandling = [];
  var serialNosArr = [];
  var ordersQueue = async.queue(function (subOrder, callbacksubOrder) {
    async.each(subOrder.scan, function (scanList, callbackscanList) {
      if (scanList.serialNo != undefined && scanList.serialNo.length > 0) {
        scanList.serialNo.forEach(slno => {
          serialNosArr.push(slno);
        });
        if (_.uniq(serialNosArr).length !== serialNosArr.length) {
          errHandling.push({
            "ERROR": "Error....Duplicate Serial Numbers Scanned"
          });
          callbackscanList("ERROR....Duplicate Serial Numbers Scanned");
        } else
          callbackscanList(null, scanList);
      } else
        callbackscanList(null, scanList);

    }, function (err, success) {
      if (err) {
        callbacksubOrder(err, "");
      } else {
        callbacksubOrder(err, subOrder);
      }
    });
  }, 1);

  ordersQueue.drain = function () {
    if (errHandling.length > 0)
      callback(errHandling, payload);
    else
      callback(null, payload);
  };

  _.each(payload.subOrderList, function (suborder) {
    ordersQueue.push(suborder, function (err) {
      if (err) console.log(err);
    });
  });
}

/* This will check if the quantities scanned is same as the  quantities in the suborder; */
function _orderProductInputQuantityCheck(payload, callback) {
  var errHandling = [];
  var ordersQueue = async.queue(function (subOrder, callbacksubOrder) {
    db.collection('omsmasters').findOne({
      "subOrders._id": subOrder._id
    }, (err, ordDoc) => {
      payload.subOrderList.forEach(o => {
        ordDoc.subOrders.forEach(so => {
          if (so._id == o._id) {
            so.products.forEach(bprd => {
              var scannedPrdCount = 0;
              o.scan.forEach(oprd => {
                if (bprd.id == oprd.productId) {
                  scannedPrdCount = scannedPrdCount + oprd.quantity;
                  if (bprd.collectSerialNumber == true) {
                    if (oprd.serialNo == undefined)
                      errHandling.push({
                        "ERROR": subOrder._id + " Serial Number Manadatory"
                      });
                  }
                }
              });
              // suborder product = bprd
              if (bprd.quantity != scannedPrdCount)
                errHandling.push({
                  "ERROR": subOrder._id + " Not enough quantities of product have been scanned"
                });

            });
          }
        });
      });

      callbacksubOrder(null, subOrder);
    });
  }, 1);

  ordersQueue.drain = function () {
    if (errHandling.length > 0) {
      callback(errHandling, payload);
    } else {
      callback(null, payload);
    }
  };

  _.each(payload.subOrderList, function (suborder) {
    ordersQueue.push(suborder, function (err) {
      if (err) console.log(err);
    });
  });
}


function _fire(_path, _method, _payload) {
  return new Promise((resolve, reject) => {
    if (!_path) {
      reject(`Path cannot be empty for HTTP request.`);
      return;
    }
    if (!_method) {
      reject(`Http Method cannot be empty for HTTP request.`);
      return;
    }
    var options = {};

    options.hostname = "newerp.storeking.in";
    options.port = '8080';
    options.headers = {
      "content-type": "application/json",
      "authorization": token
    };
    options.path = _path//"/api/wh/v1" + _path;
    options.method = _method;


    var request = http.request(options, response => {
      var data = "";
      response.on('data', _data => data += _data.toString());
      response.on('end', () => {
        if (response.statusCode == 200) {
          try {
            if (data) {
              data = JSON.parse(data);
              resolve(data);
            } else {
              resolve(data);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(data));
        }

      });
    });
    if ((_method === 'POST' || _method === 'PUT') && !_.isEmpty(_payload))
      request.end(JSON.stringify(_payload));
    else
      request.end();
  });
}
