

function calculateB2BPrice(b2bDiscount, mrp) {

    var b2bPrice = (b2bDiscount * mrp) / 100;
    return b2bPrice;

}


function arriveAtMrpFromB2b(b2bPrice, b2bDiscount) {

    var mrp = (100 * b2bPrice) / b2bDiscount;

    return mrp;

}


console.log("MRP : ", arriveAtMrpFromB2b(97.09, 80.90833333333333));


console.log("B2B Price : ", calculateB2BPrice(80.90833333333333, 20).toFixed(2));

/* 

var dealB2BPrice = (subOrder.price) ? subOrder.price : subOrder.b2bPrice;
 deal.price = order.orderType == "Retail" ? subOrder.memberPrice : dealB2BPrice;
                deal.priceBeforeVat = ((deal.price * 100) / (100 + vat));


*/