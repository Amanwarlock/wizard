var express = require("express");
var app = express();
var kue = require("kue");
var kue_ui = require("kue-ui");
var redis = require('redis');
var host = "127.0.0.1";
var port = "6379";
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });
var _ = require("lodash");

app.use("/kue-ui", kue.app); //visit : http://localhost:9110/kue-ui/active

const jobName = 'Warlock';

var kueWorker = kue.createQueue({
    redis: {
        host: host,
        port: port
    }
});


kueWorker.process(jobName, 1, function (job, ctx, done) {
    /* ctx.pause(100, function (err) {
        console.log("Worker is paused... ");
        fetcher(job).then(_job => {
            console.log("Job is : ", job.data);
            ctx.resume();
            //done();
        });
    }); */

    fetcher(job).then(_job => {
        console.log("Job is : ", job.data, new Date().toISOString());
        done();
    });
});

function fetcher(job) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve(job);
        }, timeOut);
    });
}

function pushToQueue(list) {
    list.map(el => {
        var job = kueWorker.create(jobName, el)
            .removeOnComplete(true)
            .save((err, result) => {
                if (err) {
                    console.log("Create / push error", err);
                } else {
                    console.log("Pushed to queue ", new Date().toISOString());
                }
            });

        job.on('error', (err) => {
            console.log("Job error : --", err);
        });

        job.on('failed', () => {
            console.log("Job failed :")
        });

        job.on('job complete', function (id, result) {
            kueWorker.job.get(id, function (err, job) {
                if (err) {
                    console.log("Failed to remove job : ", err);
                    return;
                } else {
                    job.remove((err) => {
                        if (err) {
                            console.log("Failed to remove job :", err);
                        } else {
                            console.log("Job successfully removed");
                        }
                    });
                }
            })
        });
    });
}

/* ---------------------------------------------------------------------------------------------------------------- */
const timeOut = 6000; // 5000ms = 5sec;

var list = [{
    _id: 100,
    name: 'Aman',
    title: 'Warlock Queue'
},
{
    _id: 200,
    name: 'Kareem',
    title: 'Warlock Queue'
}
];

pushToQueue(list);



app.listen(9110);