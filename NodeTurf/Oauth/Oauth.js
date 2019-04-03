var http = require("http");
var https = require("https");
//var OAuth = require("oauth");
var request = require("request");
//var passport = require('passport');
//var OAuthStrategy = require('passport-oauth').OAuthStrategy;

const OAuth   = require('oauth-1.0a');
const crypto  = require('crypto');
var qs = require('querystring');

const consumerKey = "VEALOW3U";
const secretkey = "6BFT9D6Z2NNBC6YUQJF1EROF";
const MerchantId = "b7095ff2-12fe-4c18-9b0a-946980d12202";

/* var oauth = new OAuth.OAuth(
   'https://www8.martjack.com/DeveloperAPI/Customer/GetAccessToken/b7095ff2-12fe-4c18-9b0a-946980d12202',
    consumerKey,
    secretkey,
    '1.0',
    null,
    'HMAC-SHA1'
  );

  oauth.get(
      `https://www8.martjack.com/DeveloperAPI/category/${MerchantId}/NA`,
      secretkey , 
      (e , data , resp) =>{
      console.log("Error : " , e);
      console.log("Data:  " , data);
      console.log("Resp : " , resp);
      
  }); */

var url =  `https://www8.martjack.com/DeveloperAPI/category/${MerchantId}/NA`;
//"https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA?oauth_consumer_key=VEALOW3U&oauth_nonce=7943340&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1540965065&oauth_version=1.0&oauth_signature=oDhG7RVild2emimxyVAOv1VzG+Q=";




//--------------------------------------------------------------------------------------------------------------------------------------------------


// Initialize
const oauth = OAuth({
    consumer: {
      key: consumerKey,
      secret: secretkey
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


  console.log("Custom Oauth data generated : -------------", oauth.authorize(request_data) );


  console.log("Oauth Query string : -------------", qs.stringify(oauth.authorize(request_data)) );



  request({
    url: `${request_data.url}?${qs.stringify(oauth.authorize(request_data))}`,
    method: request_data.method,
    headers: {
        "Accept" : "application/json"
    }
}, function(error, response, body) {
    // Process your data here
    console.log("Request made to URL : -----------"  ,  `${request_data.url}?${qs.stringify(oauth.authorize(request_data))}`);
    console.log("\n \n \n Body 6 genrated oauth in url :------------------" , body );
    
});