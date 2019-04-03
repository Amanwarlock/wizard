let calculator = {
    sum: function (a, b) {
        return a + b;
    },
    multiply: (a, b) => a * b,
}

function cacheDecorator(func) {

    var cache = new Map();

    return function (a, b) {

        let key = `${a},${b}`; // hash

        if (cache.has(key)) {
            return `Result from cache is :  ${cache.get(key)}`;
        }

        let result = func.call(this, a, b);

        cache.set(key, result);

        return `Result is : ${result}`;
    }

}


let sum_computor = cacheDecorator(calculator.sum);

console.log("Sum : ", sum_computor(2, 2));

console.log("Sum : ", sum_computor(2, 2));

console.log("Sum : ", sum_computor(2, 3));

console.log("Sum : ", sum_computor(2, 3));



