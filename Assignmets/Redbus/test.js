function sum(a, b) {
    return a + b;
}


function test(func){
    return function(a){
        return function(b){
            return func(a,b);
        }
    }
}


let adder = test(sum); 
console.log(adder(2)(4));
