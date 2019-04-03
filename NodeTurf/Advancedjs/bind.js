

let user = {
    name: 'John',
    sayHi(msg) {
        console.log(`${msg} ${this.name}`);
    }
}


let greetFunc = user.sayHi.bind(user);
/* 
    - Bind  fixes a scope for a function;
    - no matter where the function is passed or called ; it always refers to the scope which is made fixed using .bind();
*/

greetFunc('Hello');



function runner(func, x) {
    func(x);
}


runner(greetFunc , 'Hello');