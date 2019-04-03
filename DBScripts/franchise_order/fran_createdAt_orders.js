"use strict;"
const Mongoose = require("mongoose");
const http = require("http");
var chalk = require("chalk");
var chalker = new chalk.constructor({ enabled: true, level: 1 });
var async = require("async");
var _ = require("lodash");

//const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";

const url = "mongodb://localhost:27017/multiWh";

var option = { "useNewUrlParser": true };
Mongoose.connect(url, option);
const db = Mongoose.connection;

//const token = "JWT  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjM0NzVlNmRkNDMxOTUyMTRjZDg2MzMiLCJ1c2VybmFtZSI6IjkxMTMwMzMyOTgiLCJsbERhdGUiOiIyMDE4LTA5LTExVDA1OjQ5OjQwLjI1N1oiLCJpc0FjdGl2ZSI6dHJ1ZSwiaXNTZWxsZXIiOmZhbHNlLCJlbXBsb3llZSI6IkVNUDc2OSIsIndhcmVob3VzZXMiOlsiV01GMCJdLCJub3RpZmljYXRpb24iOnsiQWNjb3VudCBDcmVhdGlvbiI6ZmFsc2UsIlJlc2V0IFBhc3N3b3JkIjpmYWxzZX0sImltYWdlIjpbXSwidXNlclR5cGUiOiJFbXBsb3llZSIsInJlc2V0UGFzc3dvcmQiOmZhbHNlLCJjcmVhdGVkQXQiOnRydWUsImxhc3RVcGRhdGVkIjoiMjAxOC0wOC0xM1QwNzozOTo0My4wNDRaIiwicmVmSWQiOiJFTVA3NjkiLCJuYW1lIjoiQW1hbiIsImVuYWJsZU90cCI6dHJ1ZSwicGxhdGZvcm0iOiJXZWIiLCJ3aERldGFpbHMiOnsid2hJZHMiOlsiV01GMCIsIldNRjEiLCJXTUYyIl0sImRlZmF1bHRXaElkIjoiV01GMCJ9LCJyb2xlSWQiOiJST0xFMSIsImlhdCI6MTUzNjcyODQ0MCwiZXhwIjoxNTM2ODE0ODQwfQ.Tyj6lQUic0k1QVGAXMK5_03cYZjIPXtOHICQXqmanY8";

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});

function runScript() {
    db.collection('omsmasters').aggregate({}).forEach(function (order, err) {
        if (order) {
            db.collection('franchises').findOne({ _id: order.franchise.id }, function (err, franchise) {
                if (franchise) {
                    db.collection('omsmasters').findOneAndUpdate({ _id: order._id }, { $set: { "franchise.createdAt": franchise.createdAt } }, function (err, result) {
                        if (err) {
                            console.log("Error occured : ", err);
                        } else {
                            console.log("Updated order : ", order._id, order.franchise.id);
                        }
                    })
                }
            });
        }
    });
}
