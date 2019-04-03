let animal = {
    name: 'Animal',
    eat: function () {
        console.log(`${this.name} Eats ............`);
    }
}


let rabbit = {
    name: 'Rabbit',
    jumps() {
        console.log(`${this.name} jumps ...........`);
    }
}

rabbit.__proto__ = animal;
//rabbit.prototype = animal;   // Doesnot work

rabbit.eat();
rabbit.jumps();

console.log("\nProto chain check : " , rabbit.__proto__ === animal);

//Object property flags and descriptors;
let desc = Object.getOwnPropertyDescriptor(animal , 'name');
console.log("\nObject property flags and descriptors: " , desc);

//TO change value of flags;
//Object.defineProperty(animal , 'name' , {writable: false});


/* 
writabe - if false readonly
enumerable - can be looped
configurable - can be deleted and modified if true;
*/