"use strict";

class Animal {
    constructor(name) {
        this.name = name;
    }

    eat() {
        console.log(`${this.name} Eats ...`);
    }

    run() {
        console.log(`${this.name} Runs......`);
    }

    stop() {
        console.log(`${this.name} Stops ...`);
    }
}

class Rabbit extends Animal {
    constructor(name) {
        super(name);
        this.name = name;
    }

    hide() {
        console.log(`${this.name} hides .......`);
    }

    jumps() {
        console.log(`${this.name} Jumps .......`);
    }

    stop() {
        super.stop();
        this.hide();
    }
}

let rabbit = new Rabbit('White Rabbit');

rabbit.eat();
rabbit.run();
rabbit.hide();
rabbit.jumps();
rabbit.stop();

