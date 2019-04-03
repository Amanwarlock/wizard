"use strict";

class User {

    constructor(name) {
        this.setName = name;
    }

    set setName(name) {
        console.log(`Setter is called ........`);
        this._name = name;
    }

    get getName() {
        return this._name;
    }

    static greet() {
        console.log(`Greetings ${this._name}`);
    }
}


let user = new User('Aman');

console.log(`Get Name getter   `, user.getName);

//user.setName = 'Kareem';

//console.log(`Get Name getter   `, user.getName);


User.greet();