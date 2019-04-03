"use strict;"
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var http = require("http");
var cuti = require("cuti");
var puttu = require("puttu-redis");
puttu.connect();



function runCuti(_magickey) {
    cuti.request.getUrlandMagicKey(_magickey)
        .then(options => {
            console.log("Options : ---------", options);
        }).catch(e => console.error(e));
}

runCuti('oms');


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
        cuti.request.getUrlandMagicKey(_magickey)
            .then(options => {
                options.hostname = "newerp.storeking.in";
                options.port = '8080';
                options.headers = {
                    "content-type": "application/json",
                    "authorization": token
                };
                options.path = "/api/wh/v1" + _path;
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

            }).catch(e => reject(e));
    });
}
