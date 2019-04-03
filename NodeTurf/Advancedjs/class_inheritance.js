class Animal{
    constructor(name){
        this.name = name;
    }

    eat(){
        console.log(`${this.name} eats.......`);
    }

    run(){
        console.log(`${this.name} runs.......`);
    }

    stop(){
        console.log(`${this.name} stops.......`);
    }
}

class Rabbit extends Animal{
    constructor(name){
        super(name);
    }

    hide(){
        console.log(`${this.name} hides.......`);
    }

    stop(){
        super.stop();
        this.hide();
    }
}


let rabbit = new Rabbit(`White Rabbit`);
rabbit.eat();
rabbit.hide();
rabbit.run();
rabbit.stop();