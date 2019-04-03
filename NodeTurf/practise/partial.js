

function mul(a, b) {
    console.log(`${a} x ${b} = `, a * b);
    return a * b;
}


var double = mul.bind(null,2);

double(5);