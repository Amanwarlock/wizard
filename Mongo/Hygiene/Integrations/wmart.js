
var walmart = require("wmfintegration");
walmart = new walmart();

const env = { PROD_ENV: false }
const fc = { partner: { integrationKey: "walmart", locationId: 248 } }

/* var old = require("./wmfintegration/index");
old = new old();
old.init(env); */
/**
 * Locations:
 * Mumbai Fc :
 *          - Test = 272
 * Lucknow Fc:
 *          - Test = 258
 * 
 * Sample = 248
 */


walmart.init(env, null);


//&oauth_token=mpj0veep0r4sink3qqqkkhum

//walmart.viewCart(fc).then(r => console.log("Cart ----------", JSON.stringify(r))).catch(e => console.log("Error", e));


//walmart.checkOut(fc).then(r => console.log("Order ----------", JSON.stringify(r))).catch(e => console.log("Error", e));


/* walmart.shippmentModes(fc).then(modes => {
    console.log("Modes :-----------------", modes);
}).catch(e => console.log('Error : -------------------', e)); */



/* walmart.accessToken(fc).then(token => {
    console.log("TOKEN : -------------", token);
}).catch(e => console.log('Error : ----------------', e)); */


/* old.accessToken(fc).then(t =>{
    console.log("Old token : -------------", t);
}).catch(e =>{
    console.log('OLD Error : ----------------', e)
}) */

/**
 * SKU = [14158]
 */
/* walmart.productByLocation(fc, "14158").then(result => {
    console.log("Product by location :----------", result);
}).catch(e => {
    console.log("Error:  ------------", e);
}); */



/* walmart.getAllParentCategories(fc).then(c =>{
    console.log("Parent Categories :----------", c);
}).catch(e=>{
    console.log("Error:  ------------", e);
}); */


//----------------------------------------------------------------INTEGRATION TESTING--------------------------------------------------------------------------------

//walmart.login(fc).then(d => console.log("Result ----------------" , d)).catch(e => console.log("Error :---------" , e));


//walmart.getAllParentCategories(fc).then(d => console.log("Result ----------------" , d)).catch(e => console.log("Error :---------" , e));


var order = {
    subOrders: [{
        products: [
            {
                quantity: 2,
                mapping: {
                    productId: '336934'
                }
            }
        ]
    }]
}

var order1 = {
    subOrders: [{
        products: [
            {
                quantity: 2,
                mapping: {
                    productId: '336934'
                }
            },
            {
                quantity: 2,
                mapping: {
                    productId: '226070'
                }
            },
            {
                quantity: 1,
                mapping: {
                    productId: '226116'
                }
            }
        ]
    }]
}

//walmart.addToCart(fc,order).then(d => console.log("Result ----------------" , JSON.stringify(d))).catch(e => console.log("Error :---------" , e));


//walmart.viewCart(fc).then(r => console.log("Cart ----------", JSON.stringify(r))).catch(e => console.log("Error", e))


//walmart.addAndCheckout(fc,order).then(d => console.log("Result ----------------" , JSON.stringify(d))).catch(e => console.log("Error :---------" , JSON.stringify(e)));

let token = { "AccessToken": "xbvmm3vj1d4lv0gwepwgju0v", "issued_at": "\/Date(1543989452318+0530)\/", "UserId": "8325aed0-5eb0-11e8-b926-000d3af229a1", "MerchantId": "b7095ff2-12fe-4c18-9b0a-946980d12202" };

//walmart.addCartItems(fc, order1, token).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", JSON.stringify(e)));

//walmart.updateShipmentAddress(fc, token).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", JSON.stringify(e)));

//walmart.checkOut(fc).then(d => console.log("Result ----------------" , d)).catch(e => console.log("Error :---------" , e));

//walmart.shippmentModes(fc).then(d => console.log("Result ----------------" , d)).catch(e => console.log("Error :---------" , e));

//walmart.changeShipmentMode(fc,410).then(d => console.log("Result ----------------" , d)).catch(e => console.log("Error :---------" , e));

//walmart.logout(fc, { AccessToken: "lpaaywfhfr5pspi20sblza1i" }).then(d => console.log("Result ----------------", d)).catch(e => console.log("Error :---------", e));

//walmart.clearCart(fc).then(d => console.log("Result ----------------" , JSON.stringify(d))).catch(e => console.log("Error :---------" , e));

//walmart.productInventory(fc,"336934").then(d => console.log("Result ----------------" , JSON.stringify(d))).catch(e => console.log("Error :---------" , e));


//walmart.startSession(fc).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.removeAllFromCart(fc).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.addToCartBySession(fc, order).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.addToCartByLocation(fc,order).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.allProductsByLocation(fc, 1, 2, /* new Date() */).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.getStates(fc).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.getCities(fc , 'UP').then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));

//walmart.getConfiguredLocations(fc).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));


//walmart.inventoryBuckets(fc,[{mapping: {productId : "338726" , sku: "14685"},whId: "WMF3"}]).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));



walmart.productImage(fc ,"338726" ,700,700 ).then(d => console.log("Result ----------------", JSON.stringify(d))).catch(e => console.log("Error :---------", e));