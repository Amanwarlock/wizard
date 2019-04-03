
var _ = require("lodash");

var deal = {
    "product": [
        {
            "id": "PR1000",
            "quantity": 2,
            "mrp": 60,
            "name" : "Engagnge"
        },
        {
            "id" : "PR2000",
            "quantity" : 1,
            "mrp" : 50,
            "name" : "Faile"
        }
    ]
}

var dealProducts = deal.product.map(pr => {
   return {
       "productId" : pr.id,
       //"quantity" : pr.quantity,
       "mrp" : pr.mrp
   }

});

console.log(dealProducts);

var group = _.groupBy(dealProducts , "whId");

console.log("group : " , group);