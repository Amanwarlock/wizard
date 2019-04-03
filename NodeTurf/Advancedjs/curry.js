/* 

- Currying is translating a function from callable as f(a, b, c) into callable as f(a)(b)(c).

*/


function sum(a, b) {
    console.log(`Sum of ${a} and ${b} is : ${a + b}`);
    return a + b;
}

function curry(func) {
    return function (a) {
        return function (b) {
            return func(a, b);
        }
    }
}


let curriedSum = curry(sum);

curriedSum(2)(2);

/* 
As you can see, the implementation is a series of wrappers.

The result of curry(func) is a wrapper function(a).
When it is called like sum(1), the argument is saved in the Lexical Environment, and a new wrapper is returned function(b).
Then sum(1)(2) finally calls function(b) providing 2, and it passes the call to the original multi-argument sum.

*/