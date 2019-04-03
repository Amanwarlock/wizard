/* 
    Machine learning;
*/

var brain = require("brain.js");

const net = new brain.recurrent.RNN();

/* net.train([{ input: [0, 0], output: [0] },
{ input: [0, 1], output: [1] },
{ input: [1, 0], output: [1] },
{ input: [1, 1], output: [0] }]); */

net.train([
    { input: ["Pending", "Pending"], output: ["Pending"] },
    { input: ["Pending", "Confirmed"], output: [1] },
    { input: ["Confirmed", "Pending"], output: [1] },
    { input: [1, 1], output: [0] }
]);


let output = net.run([0, 0]); // [0]
console.log(output);
output = net.run([0, 1]); // [1]
// console.log(output);     
output = net.run([1, 0]); // [1]
// console.log(output);    
output = net.run([1, 1]);  // [0]
    //console.log(output);   

