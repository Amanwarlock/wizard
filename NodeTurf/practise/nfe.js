
let sayHi = function welcome(name) {
    if (name) {
        console.log(`Greetings ${name}`);
    } else {
        welcome(`Guest`);
    }
}


let greet = sayHi;

greet();

greet('Aman');

sayHi = null;

greet();