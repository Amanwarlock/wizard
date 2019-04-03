var ejs = require('ejs');
var fs = require('fs');
var file = fs.readFileSync(__dirname + '/sample.ejs' , 'utf8');


console.log("--dir name--" , __dirname);
var args = {
    "name" : 'aman'
};
var html = ejs.render(file , {data: args});

console.log("Html file is : " , html);