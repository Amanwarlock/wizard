

function sum(a, b) {
    console.log(`${a} + ${b} = `, a + b);
    return a + b;
}


function curry(func) {
    return function (a) {
        return function (b) {
            return func(a, b);
        }
    }
}


let calc = curry(sum);

calc(2)(3);