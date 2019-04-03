let user = { name: 'Aman' };

let guest = { name: 'Guest' };

function sayHi(msg) {
    console.log(`${msg} ${this.name}`);
}

//on user context;
sayHi.call(user , 'Hello');

sayHi.call(guest , 'Greetings');