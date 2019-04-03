
///home/aman/work/skworkspace/sk_apidoc/home/aman/work/skworkspace/sk_devhelper/pm2Files/localMultiWh.yaml

var _ = require("lodash");
var path = require("path");

var dirname = "/home/aman/work/skworkspace/sk_apidoc";

var pm2YamlPath = "/home/aman/work/skworkspace/sk_devhelper/pm2Files/localMultiWh.yaml";



//console.log("Difference", _.difference(dirname.split("/"), pm2YamlPath.split("/")));

//console.log("Intersection ", _.intersection(pm2YamlPath.split("/"), dirname.split("/")));

//console.log("Union " , _.union(pm2YamlPath.split("/"), dirname.split("/")));

function pather(pm2YamlPath) {

    var isAbsolute = isAbsolutePath(pm2YamlPath);

    console.log("Is Absolute -----", isAbsolute);

    var sourcePath = isAbsolute ? pm2YamlPath : path.join(dirname, pm2YamlPath);

    console.log("source path -------------", sourcePath);

}


function isAbsolutePath(pm2YamlPath) {

    var dirPathArr = dirname.split("/").filter(Boolean);
    var pm2YamlArr = pm2YamlPath.split("/").filter(Boolean);

    var difference = _.difference(dirPathArr,pm2YamlArr);
    var common = _.intersection(pm2YamlArr, dirPathArr);

    var dirPath = common.concat(_.intersection(difference, dirPathArr));

   /*  console.log("Difference : ", difference);

    console.log("Common --", common);

    console.log("After concat : ", dirPath);

    console.log("Dir path lenght  & __dir lenght", difference.length, dirPathArr.length); */

    //return dirPath && dirPath.length === dirname.split("/").length ? true : false;

    return difference && difference.length === dirPathArr.length ? false: true;
}


pather("/home/aman/work/skworkspace/sk_devhelper/pm2Files/localMultiWh.yaml");

pather("/apis/category.json");