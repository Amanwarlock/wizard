"use strict";

class User {

    constructor(name) {
        this.setName = name; // calling the setter called set Name
    }

    get getName() {
        return this._name;
    }

    set setName(value) {
        console.log(`Setter is called......`);
        this._name = value;
    }

    static fullName(first,last){
        console.log(`Full name is :  ${first} ${last}`)
    }

}


let user = new User("Aman");
console.log(user.getName);

User.fullName('Aman' , 'Kareem');

console.log(User.prototype.constructor === User);

console.log(user.constructor === User);