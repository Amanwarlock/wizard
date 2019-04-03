let user = { name: 'Aman' };

let guest = { name: 'Guest' };


function sayHi(msg) {
    console.log(`${msg} ${this.name}`);
}


sayHi.apply(user , ['Hello']);

sayHi.apply(guest , ['Greetings']);