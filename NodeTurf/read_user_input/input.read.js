"use strict;"

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var url = null;
var folder = null;

function setUrl(_url) {
    url = _url;
}

function setFolder(_name) {
    folder = _name;
}

/* rl.question('What do you think of Node.js? ', (answer) => {
    // TODO: Log the answer in a database
    console.log(`Thank you for your valuable feedback: ${answer}`);

    rl.close();
}); */

rl.question('Enter Mongo DB URI  :  ', (url) => {
    // TODO: Log the answer in a database
    console.log(`Thank you ! Entered URL is : ${url}`);
    setUrl(url);

    //Next Question
    rl.question('Enter OutPut folder for CSV  :  ', (name) => {
        console.log(`Thank you ! Entered Folder name is : ${name}`);
        setFolder(name);
        rl.close();
    });
});