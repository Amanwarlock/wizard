
function mul(a, b) {
    console.log(`Multiplication of ${a} , ${b} : ${a * b}`);
    return a * b;
}



let double = mul.bind(null,2); // For mul function 1st parameter is fixed to 2;

double(3);
double(4);

/* 
That’s called partial function application – we create a new function by fixing some parameters of the existing one.
*/