
let animal = {
    name: 'Animal',
    eat: function () {
        console.log(`${this.name} Eats....`);
    }
}

let rabbit = {
    name: 'Rabbit',
    jump: function () {
        console.log(`${this.name} Jumps ....`);
    }
}

rabbit.__proto__ = animal;

// Check if inherited;

console.log("Inheritance check : ", rabbit.__proto__ === animal);

rabbit.eat();
rabbit.jump();

animal.eat();