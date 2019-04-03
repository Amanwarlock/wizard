var http = require("http");
var _ = require("lodash");
var app = require("express")();

const translate = require('google-translate-api');

translate('Ik spreek Engels', { to: 'en' }).then(res => {
    console.log(res.text);
    //=> I speak English
    console.log(res.from.language.iso);
    //=> nl
}).catch(err => {
    console.error(err);
});

/* ----------------#2.----------------------------------------------- */
var  languageTranslator = require('language-translator');

app.use(languageTranslator(
  {
    langs          : ["kn", "en", "es"], // ... And other languages
    defaultLang    : "en",
    translationApiKey: "trnsl.1.1.20190314T184508Z.d840dfecde7ec71a.16f71905f5ebe8b3cb20055fd841cd26a45ac3a8"
}));