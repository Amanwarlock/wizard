

function sum(a, b) {
    console.log(`Sum of ${a} , ${b} = `, a + b);
    return a + b;
}


function cacheDecorator(func) {
    let cache = new Map();

    return function (a, b) {
        let key = `${a}_${b}`;

        if (cache.has(key)) {
            console.log(`From cache the result is `, cache.get(key));
            return cache.get(key);
        }

        let result = func(a, b);

        cache.set(key, result);

        console.log(`Computed result : `, result);

        return result;
    }
}

let decorator = cacheDecorator(sum);

decorator(2,4);

decorator(2,4);