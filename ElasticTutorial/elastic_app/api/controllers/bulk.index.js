"use strict";
var http = require("http");
var elasticSearch = require("elasticsearch");
var esClient = new elasticSearch.Client({
    host: '127.0.0.1:9200',
    log: 'error'
});

function bulkIndex(req, res) {
    let data = req.swagger.params['data'].value;
    const index = req.swagger.params['index'].value;
    const type = req.swagger.params['type'].value;

    let bulkList = [];

    data.map(item => {
        bulkList.push({
            index: {
                _index: index,
                _type: type,
                _id: item._id
            }
        });
        bulkList.push(item);
    });

    esClient.bulk({ body: bulkList }).then(result => {
        res.status(200).send(result);
    }).catch(e => res.status(400).send({ message: e.message }));

}


module.exports = {
    bulkIndex: bulkIndex
}