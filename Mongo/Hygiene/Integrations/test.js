var request = require("request");

var options = { method: 'POST',
  url: 'http://www8.martjack.com/developerapi/Carts/AddCartItems/b7095ff2-12fe-4c18-9b0a-946980d12202',
  qs: 
   { oauth_consumer_key: 'B3ZDUTWY',
     oauth_signature_method: 'HMAC-SHA1',
     oauth_timestamp: '1543989897',
     oauth_nonce: 'y2NqDc84K7Q',
     oauth_version: '1.0',
     oauth_signature: 'BLdlkeK5SdY1FA2TPKmJt8M6n5w=' },
  headers: 
   { 
     'Content-Type': 'application/x-www-form-urlencoded',
     AccessToken: 'l5j3fza2c5amyog2vdqjwqku',
     Ver: '3',
     SKey: 'GP7G962PRJMK7KPT5IIMOJNC',
     CKey: 'B3ZDUTWY',
     Accept: 'application/json' },
  form: false };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
