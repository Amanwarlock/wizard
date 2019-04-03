
//var async = require("async");

async function test(){
    console.log("---Getting name---");
    const name = await getName();
    console.log("--Got name---" , name);
}

function getName(){
    var p1 = setInterval(function(){
        var name = "AMAN";
        return Promise.resolve(name);
    },2000);
}

test();