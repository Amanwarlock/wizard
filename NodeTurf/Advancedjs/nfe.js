/* 
Named function expression;
*/

let sayHi = function greeting(name) {
    if (name) {
        console.log(`Hello ${name}`);
    } else {
        greeting('Guest');
    }
}

let greet = sayHi;

greet('Aman');
greet();

/* 
- At this step what if the value of sayHi changes
*/

sayHi = null;

greet();