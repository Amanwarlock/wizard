
var http = require("http");
var https = require("https");
var OAuth = require("oauth");
var request = require("request");


const consumerKey = "VEALOW3U";
const secretkey = "6BFT9D6Z2NNBC6YUQJF1EROF";
const MerchantId = "b7095ff2-12fe-4c18-9b0a-946980d12202";


const oauth = new OAuth.OAuth({
    consumer: {
        key: "VEALOW3U",
        secret: "6BFT9D6Z2NNBC6YUQJF1EROF"
    },
    signature_method: 'HMAC-SHA1',
    
});


const request_data = {
    url: `https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA`,
    method: 'GET',
};

// Note: The token is optional for some requests
const token = {
    key: 'VEALOW3U',
    secret: '6BFT9D6Z2NNBC6YUQJF1EROF'
};

console.log("Oauth token  :----------" , oauth.toHeader(oauth.authorize(request_data, token)));


request({
    url: request_data.url,
    method: request_data.method,
    headers: oauth.toHeader(oauth.authorize(request_data, token))
}, function (error, response, body) {
    // Process your data here
    console.log("Error :---------------- " , error);
    console.log();
    console.log("BOdy  L -------------------------" , body);

});