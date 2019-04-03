let user = {
    name: 'Aman',
    sayHi: function () {
        console.log(`Hello ${this.name}`);
    }
}



function runner(func) {
    func();
}

let greet = user.sayHi.bind(user);

runner(greet);
