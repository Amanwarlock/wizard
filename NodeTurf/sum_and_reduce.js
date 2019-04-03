var _ = require("lodash");

var blockedProducts = [{ productId: "PR1024", quantity: 2 },
{ productId: "PR1024", quantity: 1 }, { productId: "PR1025", quantity: 5 }
]

var result = blockedProducts.reduce((acc, curr) => {
    return (curr.productId == "PR1024") ? acc.quantity + curr.quantity : acc.quantity + 0;

})
var count = _.sumBy(blockedProducts, el => {
    return (el.productId == "PR1024") ? el.quantity : 0;
});

console.log("----Blocked product total count----", result, count);


var requestedProducts = [{ productId: "PR1024", quantity: 2 },
{ productId: "PR1025", quantity: 1 }, { productId: "PR1026", quantity: 5 }
]

var productList = ["665464" , "PR1024"]//["PR1024" , "PR1025" , "784358634"];
function requestedProducttest(productList){
    productList.map(_productId =>{
        var requestedProduct = _.find(requestedProducts , {"productId" : _productId});
        if(!requestedProduct){
            return;
        }
        console.log("--found product----" , requestedProduct.productId);
    });
}

requestedProducttest(productList);



/* TRY THIS OUT 

var scanned = invSo.scan.reduce((acc, curr) => {
    return curr.inventoryids[0] === s.snapShotId ? acc + curr.quantity : acc;
}, 0); // 0 is initial value of accumulator;

*/