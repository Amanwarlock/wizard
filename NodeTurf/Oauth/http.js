var https = require("https");
const request = require('request');
const OAuth   = require('oauth-1.0a');
const crypto  = require('crypto');
var qs = require('querystring');


const consumerKey = "VEALOW3U";
const secretkey = "6BFT9D6Z2NNBC6YUQJF1EROF";
const MerchantId = "b7095ff2-12fe-4c18-9b0a-946980d12202";
var url = "https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA"

// Initialize
const oauth = OAuth({
    consumer: {
      key: 'VEALOW3U',
      secret: '6BFT9D6Z2NNBC6YUQJF1EROF'
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    }
  });
  
  const request_data = {
    url: url,
    method: 'GET',
  };
  
  // Note: The token is optional for some requests
  const token = {
    key: 'VEALOW3U',
    secret: '6BFT9D6Z2NNBC6YUQJF1EROF'
  };
  

  console.log("Custom Oauth data generated : -------------", oauth.authorize(request_data) );


  console.log("Oauth Query string : -------------", qs.stringify(oauth.authorize(request_data)) );


  request({
    url: request_data.url,
    method: request_data.method,
    form: request_data.data,
    headers: oauth.toHeader(oauth.authorize(request_data))
}, function(error, response, body) {
    // Process your data here
    console.log("Body :------------------" , body );
    console.log("OAUth headers : --------------------" , oauth.toHeader(oauth.authorize(request_data)));
    
});


/* 
    Custom generated Oauth in form;
*/
request({
    url: request_data.url,
    method: request_data.method,
    form: oauth.authorize(request_data , token),
}, function(error, response, body) {
    // Process your data here
    console.log("Body 4 :------------------" , body );
    
});


/* 
    Walmart shared credentials in url
*/
request({
    url: "https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA?oauth_consumer_key=VEALOW3U&oauth_nonce=7943340&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1540965065&oauth_version=1.0&oauth_signature=oDhG7RVild2emimxyVAOv1VzG+Q=",
    method: request_data.method,
    headers: {
        "Accept" : "application/json"
    }
}, function(error, response, body) {
    // Process your data here
    console.log("\n \n  Body 5 with give oauth in url :------------------" , body );
    
});


/* 
    - 
*/
request({
    url: "https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA?oauth_consumer_key=VEALOW3U&oauth_nonce=NfCqEHt3WIjDtYiRCHGppuVnpScKhI2A&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1541481700&oauth_version=1.0&oauth_signature=DU6lQayXZcTuoGAdSWcmFh5z7BE%3D",
    method: request_data.method,
    headers: {
        "Accept" : "application/json"
    }
}, function(error, response, body) {
    // Process your data here
    console.log("\n \n \n Body 6 genrated oauth in url :------------------" , body );
    
});




/* 

https://www8.martjack.com/DeveloperAPI/category/{{MerchantId}}/NA?
oauth_consumer_key={{oauth_consumer_key}}&
oauth_nonce={{oauth_nonce}}&
oauth_signature={{oauth_signature}}&
oauth_signature_method={{oauth_signature_method}}&oauth_timestamp={{oauth_timestamp}}&
oauth_version={{oauth_version}}


*/