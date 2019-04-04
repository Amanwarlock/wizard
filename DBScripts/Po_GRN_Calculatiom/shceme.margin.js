


function calculateUnitPrice(dealerPrice, bMargin, schemeMargin) {

    var unitPrice = 0;

    var bMarginComp = 100 - bMargin;
    bMarginComp = bMarginComp ? bMarginComp : 0;

    var schemeMargin = 100 - schemeMargin;
    schemeMargin = schemeMargin ? schemeMargin : 0;

    if (bMarginComp) {
        unitPrice = parseFloat(((bMarginComp * dealerPrice) / 100).toFixed(2));
    }

    if (schemeMargin) {
        unitPrice = parseFloat(((schemeMargin * unitPrice) / 100).toFixed(2));
    }

    return parseFloat(unitPrice);
}

function getTotal(unitPrice, qty) {
    return parseFloat((unitPrice * qty).toFixed(2));
}

var unitPrice = calculateUnitPrice(40,7.4, 0);

var total = getTotal(unitPrice,108);

console.log("Unit Price : ", unitPrice , total);