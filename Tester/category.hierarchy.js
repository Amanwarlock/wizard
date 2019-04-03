
var catId = ["C4331"];

db.categories.aggregate([{
    "$match" : {
        "_id" : {"$in" : catId}
    }
},
{
    "$graphLookup":{
        "from": "categories",
        "startWith": "$parent",
        "connectFromField": "parent",
        "connectToField": "_id",
        "as": "hierarchy"
    }
},
{
    "$project"  : {
        "_id" : 1,
        "name" : 1,
        "parent" : 1,
        "status" : 1,
        "hierarchy._id": 1,
        "hierarchy.name" : 1,
        "hierarchy.status" :1,
        "hierarchy.parent" :1,
    }
}

])


db.categories.find({_id : "C3688"} , {"_id" : 1 , "status" : 1 , "name" : 1 , "parent" :1});
//
db.categories.find({"name" : /Mobiles & Tablets/})

db.categories.find({"parent"  : {"$exists" : true}});

//parent
db.categories.find({"$or" : [{"parent"  : {"$exists" : false}},{"parent" : ""}] , status: "Active"},{"_id" : 1 , parent : 1 , name :1 , status: 1 , collectSerialNumber:1});

/*
FMCG = C3554,C3558,C3637,C3645,C3694,C3707,C3732,C3809,C4307,C5777,C5853,C6215
Electronics = C3626,C3695,C3696,C3703,C6097
*/

db.categories.find({_id : {"$in" : ["C3626","C3695","C3696","C3703","C6097"]}} , {"_id" : 1 , "status" : 1 , "name" : 1 , "parent" :1});

