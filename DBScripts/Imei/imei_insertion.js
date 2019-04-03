"use strict;"
var Mongoose = require("mongoose");
const readline = require('readline');
var async = require("async");
var _ = require("lodash");
var fs = require("fs");
var jsonexport = require('jsonexport');
var moment = require("moment");
var chalk = require('chalk');
var chalker = new chalk.constructor({ enabled: true, level: 1 });

/* Mongo URL */
const url = "mongodb://skaman:QdEN96NQMspbGDtXrHRWDQ@35.154.220.245:27017/skstaging";
//const url ="mongodb://10.0.1.102:27017/skstaging";
var path = "/home/aman/Desktop/Hygiene_reports";//__dirname + "/csv_reports";
const folder = "output";


/* --------MONGO CONNECT------ */
var options = { "useNewUrlParser": true };
Mongoose.connect(url, options);
var db = Mongoose.connection;

/* -----LISTENERS------ */
db.on('error', function () {
    console.log("Connection Error....");
    process.exit();
});

db.once('open', function callback() {
    console.log("Connection established to : ", url);
    runScript();
});


var imeis = ["16641/00651549", "16641/00650658", "16641/00651889", "16641/00650650", "16641/00650280", "16641/00650547", "16641/00650988",
    "16641/00652575", "16641/00651888", "16641/00652576", "16641/00652577", "16641/00652586", "16641/00652591", "16641/00652587", "16641/00652588", "16641/00650732", "16641/00652578", "16641/00652579", "16641/00652589", "16641/00650025", "16641/00652594", "16641/00651819", "16641/00651820", "16641/00651823", "16641/00651890", "16641/00651824", "16641/00651893", "16641/00651905", "16641/00651909", "16641/00651882", "16641/00651815", "16641/00651816", "16641/00651817", "16641/00650281", "16641/00650538", "16641/00650654", "16641/00650735", "16641/00651828", "16641/00651826", "16641/00650213", "16641/00650023", "16641/00650013", "16641/00649878", "16641/00651877", "16641/00651900", "16641/00651899", "16641/00652372", "16641/00651887", "16641/00651886", "16641/00651885", "16641/00651884", "16641/00651903", "16641/00651902", "16641/00651901", "16641/00651876", "16641/00651883", "16641/00651898", "16641/00651897", "16641/00651896", "16641/00650734", "16641/00652284", "16641/00649618", "16641/00652362", "16641/00651904", "16641/00652287", "16641/00652364", "16641/00652366", "16641/00652300", "16641/00652345", "16641/00651892", "16641/00651894", "16641/00651875", "16641/00652371", "16641/00652294", "16641/00652295", "16641/00652365", "16641/00651879", "16641/00651880", "16641/00651881", "16641/00652363", "16641/00652292", "16641/00652306", "16641/00652297", "16641/00652288", "16641/00652289", "16641/00652290", "16641/00652368", "16641/00652369", "16641/00652370", "16641/00652285", "16641/00652286", "16641/00652301", "16641/00652302", "16641/00652303", "16641/00652304", "16641/00652305", "16641/00652291", "16641/00652293", "16641/00652296", "16641/00652298", "16641/00652299", "16641/00652359", "16641/00652360", "16641/00652361", "16641/00651091", "16641/00650881", "16641/00652367", "16641/00652350", "16641/00652351", "16641/00652354", "16641/00652353", "16641/00652355", "16641/00652352", "16641/00652356", "16641/00652357", "16641/00652358", "16641/00652349", "16641/00650738", "16641/00649614", "16641/00650282", "16641/00649606", "16641/00649913", "16641/00649729", "16641/00651411", "16641/00649937", "16641/00649705", "16641/00651409", "16641/00651856", "16641/00650548", "16641/00651474", "16641/00651548", "16641/00651526", "16641/00650549", "16641/00649731", "16641/00651414", "16641/00471328", "16641/00650199", "16641/00649741", "16641/00651412", "16641/00651478", "16641/00651380", "16641/00651398", "16641/00649726", "16641/00650131", "16641/00650627", "16641/00649671", "16641/00649708", "16641/00649667", "16641/00651396", "16641/00651616", "16641/00650124", "16641/00649728", "16641/00650487", "16641/00650554", "16641/00650189", "16641/00649666", "16641/00651546", "16641/00649540", "16641/00651545", "16641/00651544", "16641/00651543", "16641/00649672", "16641/00649709", "16641/00651529", "16641/00651531", "16641/00651530", "16641/00651547", "16641/00650775", "16641/00650774", "16641/00650011", "16641/00650130", "16641/00650190", "16641/00650780", "16641/00649682", "16641/00649668", "16641/00650773", "16641/00649727", "16641/00651523", "16641/00651399", "16641/00651389", "16641/00651620", "16641/00650772", "16641/00651388", "16641/00651387", "16641/00650533", "16641/00649547", "16641/00651466", "16641/00651527", "16641/00651400", "16641/00649892", "16641/00651383", "16641/00651473", "16641/00649724", "16641/00649911", "16641/00651430", "16641/00649807", "16641/00472090", "16641/00471715", "16641/00650132", "16641/00651391", "16641/00651392", "16641/00651393", "16641/00649544", "16641/00649880", "16641/00651465", "16641/00651384", "16641/00649904", "16641/00649742", "16641/00649885", "16641/00651621", "16641/00649881", "16641/00649803", "16641/00651403", "16641/00649804", "16641/00651475", "16641/00463040", "16641/00482703", "16641/00649751", "16641/00649846", "16641/00649704", "16641/00651521", "16641/00651404", "16641/00651476", "16641/00649750", "16641/00651477", "16641/00649884", "16641/00651629", "16641/00651625", "16641/00649906", "16641/00651618", "16641/00651619", "16641/00651522", "16641/00649734", "16641/00649809", "16641/00651394", "16641/00649552", "16641/00650133", "16641/00651415", "16641/00649670", "16641/00650488", "16641/00650459", "16641/00649551", "16641/00651617", "16641/00649910", "16641/00651542", "16641/00651405", "16641/00649903", "16641/00651397", "16641/00651471", "16641/00651467", "16641/00651385", "16641/00651624", "16641/00650550", "16641/00651402", "16641/00651410", "16641/00650195", "16641/00651470", "16641/00650338", "16641/00650020", "16641/00651463", "16641/00650782", "16641/00651550", "16641/00649912", "16641/00651417", "16641/00651390", "16641/00649538", "16641/00649648", "16641/00651630", "16641/00649679", "16641/00649669", "16641/00649893", "16641/00651554", "16641/00650460", "16641/00649907", "16641/00650546", "16641/00649951", "16641/00649795", "16641/00650462", "16641/00650540", "16641/00649655", "16641/00649798", "16641/00649740", "16641/00651386", "16641/00650551", "16641/00649805", "16641/00651551", "16641/00651395", "16641/00651622", "16641/00649695", "16641/00649945", "16641/00650203", "16641/00650742", "16641/00650201", "16641/00651464", "16641/00649739", "16641/00651413", "16641/00650531", "16641/00649950", "16641/00651421", "16641/00651623", "16641/00649663", "16641/00649689", "16641/00649715", "16641/00649888", "16641/00650305", "16641/00650008", "16641/00649738", "16641/00650115", "16641/00649589", "16641/00650126", "16641/00650752", "16641/00650306", "16641/00649541", "16641/00649688", "16641/00649696", "16641/00651539", "16641/00651540", "16641/00649599", "16641/00649725", "16641/00651534", "16641/00649899", "16641/00469140", "16641/00649905", "16641/00649706", "16641/00651469", "16641/00651468", "16641/00650202", "16641/00651528", "16641/00651401", "16641/00649678", "16641/00649548", "16641/00651535", "16641/00651408", "16641/00651382", "16641/00651541", "16641/00649543", "16641/00652406", "16641/00652407", "16641/00652408", "16641/00652409", "16641/00652411", "16641/00652417", "16641/00652418", "16641/00652419", "16641/00652420", "16641/00652421", "16641/00652402", "16641/00651514", "16641/00652403", "16641/00652404", "16641/00652405", "16641/00652423", "16641/00652422", "16641/00652328", "16641/00652329", "16641/00649890", "16641/00652410", "16641/00652413", "16641/00652412", "16641/00652414", "16641/00651513", "16641/00650620", "16641/00650626", "16641/00652330", "16641/00651504", "16641/00652718", "16641/00652332", "16641/00652333", "16641/00652334", "16641/00652335", "16641/00652336", "16641/00651503", "16641/00652397", "16641/00652398", "16641/00652399", "16641/00652400", "16641/00652343", "16641/00652344", "16641/00652331", "16641/00650012", "16641/00650215", "16641/00651479", "16641/00651098", "16641/00652337", "16641/00652338", "16641/00652339", "16641/00652340", "16641/00652341", "16641/00652342", "16641/00651500", "16641/00652401", "16641/00649891", "16641/00650659", "16641/00650653", "16641/00652348", "16641/00652347", "16643/00118087", "16643/00118079", "16643/00117760", "16643/00118045", "16643/00118069", "16643/00118120", "16643/00118053", "16643/00121606", "16643/00117940", "16643/00118071", "16643/00118441", "16643/00118095", "16643/00118132", "16643/00118113", "16643/00118162", "16643/00118169", "16643/00121549", "16643/00118182", "16643/00118066", "16643/00118116", "16643/00118099", "16643/00117975", "16643/00118137", "16643/00118108", "16643/00118102", "16643/00118150", "16643/00118149", "16643/00118471", "16643/00117754", "16643/00122085", "16643/00118107", "16643/00118125", "16643/00118474", "16643/00118123", "16643/00118086", "16643/00121598", "16643/00140348", "16643/00140247", "16643/00118039", "16643/00118057", "16643/00118081", "16643/00140290", "16643/00140359", "16643/00140374", "16643/00140322", "16643/00140398", "16643/00140304", "16643/00140275", "16643/00140349", "16643/00140423", "16643/00140356", "16643/00140309", "16643/00140298", "16643/00140300", "16643/00117808", "16643/00117973", "16643/00140285", "16643/00118093", "16643/00121603", "16643/00118381", "16643/00121626", "16643/00140244", "16643/00140291", "16643/00118417", "16643/00140333", "16643/00140357", "16643/00140306", "16643/00140397", "16643/00140351", "16643/00140299", "16643/00140389", "16643/00140362", "16643/00140270", "16643/00140332", "16643/00140347", "16643/00140418", "16643/00140334", "16643/00140261", "16643/00140243", "16643/00140326",
    "16643/00140360", "16643/00140437", "16643/00140281", "16643/00140353", "16643/00140239",
    "16643/00140294", "16643/00140242", "16643/00140329", "16643/00140302", "16643/00140308", "16643/00140350",
    "16643/00140250", "16643/00140312", "16643/00140280", "16643/00140293", "16643/00140277", "16643/00140267",
    "16643/00140367", "16643/00140369", "16643/00140372", "16643/00140344", "16643/00140279", "16643/00140335",
    "16643/00140284", "16643/00140273", "16643/00140310", "16643/00140345", "16643/00140399", "16643/00140297",
    "16643/00140292", "16643/00140340", "16643/00140365", "16643/00140341", "16643/00140301", "16643/00140296", "16643/00140272",
    "16643/00140366", "16643/00056550", "16643/00140286", "16643/00140246", "16643/00140330", "16643/00140248", "16643/00140288",
    "16643/00140336", "16643/00140307", "16643/00140295", "16643/00140303", "16643/00140316", "16643/00140376",
    "16643/00140305", "16643/00140238", "16643/00140235", "16643/00140245", "16643/00140259", "16643/00140352",
    "16643/00140307", "16643/00043437", "16643/00043263", "16643/00043206", "16643/00043509", "16643/00043271",
    "16643/00043198", "16643/00043300", "16643/00043249", "16643/00043985", "16643/00043252", "16643/00071919",
    "16643/00043608", "16643/00043251", "16643/00075933", "16643/00072375", "16643/00043277", "16643/00072257",
    "16643/00043629", "16643/00043292", "16643/00043319", "16643/00043295", "16643/00043581", "16643/00075972",
    "16643/00075916", "16643/00072520", "16643/00075918", "16643/00043216", "16643/00043280", "16643/00043353",
    "16643/00043907", "16643/00043258", "16643/00043279", "16643/00043205", "16643/00075967", "16643/00043241",
    "16643/00072483", "16643/00043195", "16643/00075970", "16643/00043578", "16643/00043269", "16643/00043204",
    "16643/00043259", "16643/00043276", "16643/00043293", "16643/00043317", "16643/00043297", "16643/00043299",
    "16643/00043264", "16643/00043589", "16643/00043435", "16643/00043298", "16643/00140249", "16643/00140287",
    "16643/00076010", "16643/00043436", "16643/00043313", "16643/00075971", "16643/00043315", "16643/00043320",
    "16643/00075920", "16643/00043434", "16643/00076009", "16643/00140236", "16643/00140237", "16643/00140289",
    "16643/00140253", "16643/00140257", "16643/00043266", "16643/00043987", "16643/00043253", "16643/00043196",
    "16643/00043321", "16643/00043200", "16643/00043275", "16643/00043307", "16643/00043384", "16643/00043254",
    "16643/00043607", "16643/00043290", "16643/00043906", "16643/00043632", "16643/00043115", "16643/00075975",
    "16643/00072481", "16643/00043296", "16643/00043304", "16643/00043309", "16643/00043314", "16643/00043308",
    "16643/00072518", "16643/00140233"];


var productId = "PR14953";

var inventoryId = "WH23395";

var grnId = "GRN1722";

function runScript() {
    console.log("#SCRIPT ADDED : --------------------------------------------");
    async.waterfall([
        _findProduct(),
        _fetchInventory
    ], function (err, result) {
        if(err){
            console.log("#.ERROR : -----" , err);
            process.exit();
        }else{
            console.log("#.SCRIPT ENDED : -----------------------------------------------");
        }
    });
}