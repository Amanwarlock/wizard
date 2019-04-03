var http = require("http");
var https = require("https");
var request = require("request");
var oauthSignature  = require("oauth-signature");

const consumerKey = "VEALOW3U";
const secretkey = "6BFT9D6Z2NNBC6YUQJF1EROF";
const MerchantId = "b7095ff2-12fe-4c18-9b0a-946980d12202";


const url = `https://www8.martjack.com/DeveloperAPI/category/b7095ff2-12fe-4c18-9b0a-946980d12202/NA`;

oauthSignature.generate("GET" , url);