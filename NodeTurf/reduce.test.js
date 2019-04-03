var products = [{
    productId : "PR10001",
    quantity : 2
}, {
    productId : "PR10002",
    quantity : 1
}];



var result = products.reduce((acc , curr) => acc.quantity + curr.quantity);


console.log(result);