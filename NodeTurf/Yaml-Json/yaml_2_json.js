var jsyaml = require('js-yaml');
var fs = require('fs');

var inputfile = "sample.yaml";
var outputfile = "output.json";


var obj = jsyaml.load(fs.readFileSync(inputfile, { encoding: 'utf-8' }));
// this code if you want to save
fs.writeFileSync(outputfile, JSON.stringify(obj, null, 2));