/* WORKING */
var cursor = db.products.find({});
while (cursor.hasNext()) {
    var product = cursor.next();
    var categoryId = product.category[0];
    var category = db.categories.findOne({ _id: categoryId } , {_id : 1 , fulfilmentPolicys : 1 , fulfillmentPolicys : 1});
    var policy = null;
    if(!category.fulfillmentPolicys){
        policy = category.fulfilmentPolicys;
    }else{
         policy = category.fulfillmentPolicys;
    }
    printjson(product.fulfillmentPolicys);
    db.products.findOneAndUpdate({_id : product._id } , {$set : {fulfillmentPolicys : policy}});
}



/* Method -2 */
var cursor = db.products.find();
while (cursor.hasNext()) {
    var product = cursor.next();
    var categoryId = product.category[0];
    var category = db.categories.findOne({ _id: categoryId }, { _id: 1, fulfillmentPolicys: 1 });
    printjson(category);
    //db.products.findOneAndUpdate({_id : product._id } , {$set : {fulfillmentPolicys : category.fulfillmentPolicys}});
}


/* Method -3 */
db.products.find({}).forEach((it)=> { 
    var categoryId = it.category[0];
    db.categories.find({_id : categoryId} , {_id : 1 ,fulfillmentPolicys : 1 }).forEach(cat =>{
        var policy = cat.fulfillmentPolicys;
        it.fulfillmentPolicys = policy;
        db.products.save(it);
    });
});