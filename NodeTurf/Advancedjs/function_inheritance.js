function Animal(name) {
    this.name = name;
}

Animal.prototype = {
    eat : function(){
        console.log(`${this.name} eats ...........`);
    }
}


function Rabbit(name){
    this.name = name;
}

Rabbit.prototype = {
    jumps: function(){
        console.log(`${this.name} jumps .......`);
    },
    __proto__ : Animal.prototype 
}

//Or

//Rabbit.prototype.__proto__ = Animal.prototype;

let rabbit = new Rabbit('Rabbit');
rabbit.eat();
rabbit.jumps();



function Snake(){

}


console.log('\n Default prototype and constructor : ' , Snake.prototype.constructor === Snake);

let snake = new Snake();

console.log('\n Default prototype and constructor by object instance : ' , snake.constructor === Snake);