
function Animal() {
    this.name = 'Animal';
}

Animal.prototype = {
    eat: function () {
        console.log(`${this.name} Eats .....`);
    }
}


function Rabbit() {
    this.name = 'Rabbit';
}

Rabbit.prototype = {
    jump: function () {
        console.log(`${this.name} Jumps .....`);
    },
    __proto__: Animal.prototype
}

let rabbit = new Rabbit();

rabbit.eat();
rabbit.jump();