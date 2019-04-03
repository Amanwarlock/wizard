"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var http = require("http");
var cuti = require("cuti");
//var puttu = require("puttu-redis");
//puttu.connect();

var invoiceIds = require("./invoiceIds");


/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging"; //live
//const url ="mongodb://10.0.1.102:27017/skstaging";
var path = "/home/aman/Desktop/Tax_SyncUp_Report";//__dirname + "/csv_reports";
const folder = "output";



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

var invoiceIds = invoiceIds; //

//  path=   /order/invoiceTaxCron/IN17100010815
////{{url}}/api/oms/v1/order/invoiceTaxCron/IN17100010815
function runScript() {

     var queue = async.queue(function(id , cb){
         console.log("----");
         var path = `/order/invoiceTaxCron/${id.toString()}`
         _fireHttpRequest("oms", path, "POST", null).then(() => {
             console.log("Success ", id);
             cb(null);
         }).catch(e => cb(e));
     })

    /* _.each(invoiceIds, id => {
        var path = `/order/invoiceTaxCron/${id.toString()}`
        _fireHttpRequest("oms", path, "POST", null).then(() => {
            console.log("Success ", id);
        }).catch(e => console.error(e))
    }) */


      queue.drain = function(){
          console.log("Completed");
          process.exit();
      }
  
      queue.push(invoiceIds , function(){
  
      });
}



var token = "JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA4LTAzVDEwOjA0OjMyLjkxM1oiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wNi0yOFQwNTo0NToxMC45NDBaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiXSwiZGVmYXVsdFdoSWQiOiJXTUYwIn0sInJvbGVJZCI6IlJPTEUxIiwiaWF0IjoxNTMzMzg1MDEzLCJleHAiOjE1MzM0NzE0MTN9.9-5mXkkm-MCU4DwV82T9qx432dA7X8qM-dVKGvXVKRg";


function _fireHttpRequest(_magickey, _path, _method, _payload) {
    return new Promise((resolve, reject) => {
        if (!_magickey) {
            reject(new Error(`Magic Key cannot be empty for HTTP request.`));
            return;
        }
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
        options.path = "/api/oms/v1" + _path; //{{url}}/api/oms/v1/order/invoiceTaxCron/IN17100010815
        options.method = _method;
        console.log("Options----", options);
        var request = http.request(options, response => {
            var data = "";
            response.on('data', _data => data += _data.toString());
            response.on('end', () => {
                if (response.statusCode == 200) {
                    try {
                        data = JSON.parse(data);
                        resolve(data);
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


        /*   cuti.request.getUrlandMagicKey(_magickey)
              .then(options => {
                  options.hostname = "newerp.storeking.in";
                  options.port = '8080';
                  options.headers = {
                      "content-type": "application/json",
                      "authorization": token
                  };
                  options.path = "/api/oms/v1" + _path; //{{url}}/api/oms/v1/order/invoiceTaxCron/IN17100010815
                  options.method = _method;
                  console.log("Options----", options);
                  var request = http.request(options, response => {
                      var data = "";
                      response.on('data', _data => data += _data.toString());
                      response.on('end', () => {
                          if (response.statusCode == 200) {
                              try {
                                  data = JSON.parse(data);
                                  resolve(data);
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
  
              }).catch(e => reject(e)); */
    });
}


