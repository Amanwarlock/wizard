
let user = {
    name: 'John'
}

let guest = {
    name: 'Guest'
}

function sayHi(msg) {
    console.log(`${msg} ${this.name} !`);
}

//Call with user context and passing array of arguments;
 sayHi.apply(user,['Hello']);

 //Call with guest context
 sayHi.apply(guest , ['Welcome']);