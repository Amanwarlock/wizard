let user = { name: 'Aman' };

let guest = { name: 'Guest' }

function sayHi(msg) {
    console.log(`${msg} ${this.name} !`);
}

//user context;
sayHi.call(user, 'Hello');

// guest context;
sayHi.call(guest, 'Welcome');

