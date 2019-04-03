let animal = {
    eats: () => console.log(`Eats .........`)
}


function Rabbit(){
    jumps : () => console.log(`Jumps ...........`)
}

Rabbit.prototype = animal;

