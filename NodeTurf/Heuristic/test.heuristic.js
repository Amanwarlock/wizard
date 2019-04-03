
var _ = require("lodash");
var async = require("async");
var selectedOrders = require("./orderMatrix.scenarios").orders;
var productIdList = ["PR10001", "PR10002"];
var wh_scenarios = require("./warehouse.scenarios").wh_scenarios;

/* Call / RUN heuristics; */
runHeuristics(selectedOrders, productIdList, function (err, result) {

});


function runHeuristics(selectedOrders, productIdList, callback) {
    if (!selectedOrders && !selectedOrders.length) {
        callback(new Error(`Order list is empty , cannot find best match.`));
        return;
    }
    if (!productIdList && !productIdList.length) {
        callback(new Error(`Product list cannot be empty.`));
        return;
    }
    var orderMatrixList = prepareOrderMatrix(selectedOrders, productIdList);
    var transformedMatrix = transformMatrix(orderMatrixList);
    applyHeuristics(transformedMatrix, productIdList);
}

function prepareOrderMatrix(_orderList, _productIdList) {
    var orderMatrixList = [];
    _orderList.map(_order => {
        // check if the order is in matrix , if not push;
        var exisitingOrderMatrix = _.find(orderMatrixList, { "_id": _order._id });
        if (!exisitingOrderMatrix) {
            //compute order total required qty , blocked qty , remaining qty;
            var newMatrix = {
                "_id": _order._id,
                "productSummary": [],
                "orderSummary": {},
                "orderkeeper": {},
                "solution": []
            };
            _productIdList.map(_productId => {
                var product = _.find(_order.subOrders.products, { "id": _productId });
                if (product) {
                    var productMatrix = getProductMatrix(_order, product, _productId);
                    newMatrix["productSummary"].push(productMatrix);//no need to check if prod matrix has an element with that soId and Prod id;
                }
            });
            //Get total order req , blocked and remaining;
            var orderLevelCount = getOrderLevelCount(_order);
            newMatrix['orderSummary'] = orderLevelCount;
            newMatrix['orderkeeper'] = orderLevelCount;
            orderMatrixList.push(newMatrix);
        } else {
            //If exists then its orders another suborder record ; convert it to product matrix and insert into exisiting;
            //Extract all the products from this suborder matching with our productId list;
            _productIdList.map(_productId => {
                var product = _.find(_order.subOrders.products, { "id": _productId });
                if (product) {
                    var productMatrix = getProductMatrix(_order, product, _productId);
                    exisitingOrderMatrix["productSummary"].push(productMatrix);
                }
            });
        }
    });

    return orderMatrixList;
}

function getProductMatrix(_order, product, _productId) {
    var requestedProduct = _.find(_order.subOrders.requestedProducts, { "productId": _productId });
    var blockedProduct = _.find(_order.subOrders.blockedProducts, { "productId": _productId });
    var requestedQty = requestedProduct.quantity;
    var blockedQty = blockedProduct ? blockedProduct.quantity : 0;
    var sOlevelCount = getSubOrderLevelCount(_order.subOrders);
    var productMatrix = {
        "productId": product.id,
        "subOrderId": _order.subOrders._id,
        "productHash": product._id,
        "requestedQty": product.quantity,
        "blockedQty": blockedQty,
        "requiredQty": requestedQty - blockedQty,
        "subOrderSummary": sOlevelCount,
        "productkeeper": {
            "requiredQty": requestedQty - blockedQty,//on reset counters/keepers use this qty;
            "remainingQty": requestedQty - blockedQty,//this will be same initially;
            "usedQty": 0,
            "snapShots": []
        }
    };
    return productMatrix;
}

function getSubOrderLevelCount(_subOrder) {
    var blockedCount = _.sumBy(_subOrder.blockedProducts, el => (el && el.quantity) ? el.quantity : 0);
    var requestedCount = _.sumBy(_subOrder.requestedProducts, el => (el && el.quantity) ? el.quantity : 0);
    return {
        totalRequestedQty: requestedCount,
        totalBlockedQty: blockedCount,
        totalRemainingQty: requestedCount - blockedCount
    };
}

function getOrderLevelCount(_order) {
    var totalBlockedQty = 0;
    var totalRequestedQty = 0;
    _order.data.map(_subOrder => {
        var blockedCount = _.sumBy(_subOrder.blockedProducts, el => (el && el.quantity) ? el.quantity : 0);
        var requestedCount = _.sumBy(_subOrder.requestedProducts, el => (el && el.quantity) ? el.quantity : 0);
        totalBlockedQty += blockedCount;
        totalRequestedQty += requestedCount;
    });
    return {
        totalRequestedQty: totalRequestedQty,
        totalBlockedQty: totalBlockedQty,
        totalRequiredQty: totalRequestedQty - totalBlockedQty,
        totalRemainingQty: totalRequestedQty - totalBlockedQty
    };
}

/* Adds product vs order ratio to the ordermatrix list; */
function transformMatrix(_orderMatrixList) {
    _orderMatrixList.map(_orderMatrix => {
        _orderMatrix["prodRatioMatrix"] = [];
        var ratioList = [];//ProdRatioMatrix List;
        _orderMatrix["productSummary"].map(_productMatrix => {
            var entity = _.find(ratioList, { "productId": _productMatrix.productId });
            if (!entity) {
                //create new;
                var obj = {
                    "productId": _productMatrix.productId,
                    "totalQtyRequired": _productMatrix.requiredQty,
                    "remainingQty": _productMatrix.requiredQty,
                    "usedQty": 0,
                    "trace": [{ "sOid": _productMatrix.subOrderId, "productId": _productMatrix.productId, "hash": _productMatrix.productHash, "requiredQty": _productMatrix.requiredQty }]
                };
                ratioList.push(obj);
            } else {
                //update to exisiting;
                entity.totalQtyRequired += _productMatrix.requiredQty;
                entity.remainingQty += _productMatrix.requiredQty;
                entity.trace.push({ "sOid": _productMatrix.subOrderId, "productId": _productMatrix.productId, "hash": _productMatrix.productHash, "requiredQty": _productMatrix.requiredQty });
            }
        });
        ratioList = ratioList.filter(el => el.totalQtyRequired > 0);//even if the product is in GRN product id list , ignore if totalQtyRequired is less than zero;
        _orderMatrix["prodRatioMatrix"] = ratioList;
    });
    return _orderMatrixList;
}

function getCount(required, available) {
    return required <= available ? required : required > available ? available : 0;
}


function applyHeuristics(transformedMatrix, productIdList) {
    async.waterfall([
        _fetchSnapShots(transformedMatrix, productIdList),
        _remainderStage,
        _determineSolution,
        // _extractSolution
    ], function (err, orderMatrixList, inventoryMatrixList) {
        console.log("-----errror---", err);
        console.log("----orderMatrixList---/n", JSON.stringify(orderMatrixList));
        console.log("----inventoryMatrixList---/n", JSON.stringify(inventoryMatrixList));
    });
}

function _fetchSnapShots(transformedMatrix, productIdList) {
    return function (callback) {
        //prepare snapshot matrix;
        var groupedSnapshots = wh_scenarios;
        var inventoryMatrix = initInventoryMatrix(wh_scenarios);
        callback(null, transformedMatrix, productIdList, inventoryMatrix);
    };
}
/* Here snapshots are grouped by product Ids; */
function initInventoryMatrix(groupedSnapshots) {
    //Set master keeper group wise;
    groupedSnapshots.map(group => {
        group.masterKeeper = {
            totalQty: group.totalQty,
            remainingQty: group.totalQty,
            usedQty: 0
        }
        //Set keepers for each snapshot in a group
        group.snapShots.map(snapShot => {
            snapShot.keeper = {
                totalQty: snapShot.quantity,
                remainingQty: snapShot.quantity,
                usedQty: 0,
                trace: []
            }
        });
    });
    return groupedSnapshots;
}

function _remainderStage(transformedMatrix, productIdList, inventoryMatrix, callback) {
    transformedMatrix.map(_order => {
        _order.orderkeeper.remainder = _order.orderSummary.totalRemainingQty;
        _order.prodRatioMatrix.map(el => {
            var snapShotData = _.find(inventoryMatrix, { "_id": el.productId });
            var snapShotQty = snapShotData ? snapShotData.totalQty : 0;
            var count = getCount(el.totalQtyRequired, snapShotQty);
            _order.orderkeeper.remainder -= count;
        });
    });
    var sortedMatrixList = _.sortBy(transformedMatrix, ["orderkeeper.remainder"]);
    callback(null, sortedMatrixList, inventoryMatrix);
}

function _determineSolution(sortedMatrixList, inventoryMatrix, callback) {
    //console.log("----sorted Matrix----", JSON.stringify(sortedMatrixList));
    sortedMatrixList.map(_order => {
        //iterate per element of ratio matrix;
        _order.prodRatioMatrix.map(_ratioMatrix => {
            var whData = _.find(inventoryMatrix, { "_id": _ratioMatrix.productId });
            // check if the snapshot list qty is not zero;
            if (whData && whData.snapShots && whData.masterKeeper.remainingQty > 0 && _ratioMatrix.remainingQty > 0) {
                var snapShotList = whData.snapShots;
                for (var i = 0; i < snapShotList.length; i++) {
                    var snapShot = snapShotList[i];
                    if (snapShot.keeper.remainingQty > 0) {
                        //THIS ratioMatrix.trace loop should break on its length criteria or when the pointed snapSHot qty becomes zero;
                        for (var j = 0; j < _ratioMatrix.trace.length; j++) {
                            var trace = _ratioMatrix.trace[j];//one trace obj from list of traces;
                            //find product from trace keys;
                            var product = _.find(_order.productSummary, { "subOrderId": trace.sOid, "productHash": trace.hash, "productId": _ratioMatrix.productId });
                            if (product && product.productkeeper.remainingQty > 0) {
                                // update current ratio matrix keeper , current product keeper ; current order keeper , inventorykeeper , inventory master keeper;
                                var count = getCount(product.productkeeper.remainingQty, snapShot.keeper.remainingQty);
                                updateOrderKeepers(count, _order, _ratioMatrix, product, snapShot);
                                updateInventoryKeepers(count, whData, snapShot, product);
                            }

                            if (snapShot.keeper.remainingQty <= 0 || whData.masterKeeper.remainingQty <= 0) {
                                break;
                            }
                        }//trace loop ends here;
                    }
                    // break snap shot iterations;
                    if (whData.masterKeeper.remainingQty <= 0 || _ratioMatrix.remainingQty <= 0) {
                        break;
                    }
                }//snapShot loop ends here;
            };
        });//prodRatioMatrix loop ends here;
    });
    callback(null, sortedMatrixList, inventoryMatrix);
}

/* Happens only on allotment: Order Keepers are 3:
    - prodRatioMatrix level of an order;(Array or objects called ratio matrix;)
    - productSummary level - productKeeper;
    - order level  - orderKeeper;
    There are no keepers for subOrder level;
 */
function updateOrderKeepers(count, orderMatrix, ratioMatrix, productMatrix, inventoryMatrix) {
    //update order level keeper;
    orderMatrix.orderkeeper.totalRemainingQty -= count;
    orderMatrix.orderkeeper.usedQty = orderMatrix.orderkeeper.usedQty ? orderMatrix.orderkeeper.usedQty : 0;
    orderMatrix.orderkeeper.usedQty += count;
    orderMatrix.solution.push({
        "snapShotId": inventoryMatrix._id,
        "warehouseId": "WMF0",
        "productId": productMatrix.productId,
        "reference": { "objectId": productMatrix.productHash, "subOrderId": productMatrix.subOrderId },
        "requestQty": count,
        "referenceType": "",
    });
    //update ration matrix instance;
    ratioMatrix.remainingQty -= count;
    ratioMatrix.usedQty += count;
    // update productMatrix instance;
    productMatrix.productkeeper.remainingQty -= count;//This should become to zero;
    productMatrix.productkeeper.usedQty += count;//increase the used count ; this should be equal to the total requiredQty;
    productMatrix.productkeeper.snapShots.push({ _id: inventoryMatrix._id, qty: count, productId: inventoryMatrix.productId });
}
/* Happens only on allotment stage;
    - WH data level - called masterKeeper;
    - snapShot list level - called inventoryKeeper;
 */
function updateInventoryKeepers(count, master, inventoryMatrix, productMatrix) {
    //master - whData instance (grouped by prodId) , contains masterKeeper and snapShotList;
    // inventoryMatrix - one single element in snapShotList for the current master;
    //update master keeper ;
    master.masterKeeper.remainingQty -= count;
    master.masterKeeper.usedQty += count;
    //Update inventory;
    inventoryMatrix.keeper.remainingQty -= count;
    inventoryMatrix.keeper.usedQty += count;
    inventoryMatrix.keeper.trace.push({ productHash: productMatrix.productHash, productId: productMatrix.productId, sOid: productMatrix.subOrderId, requestedQty: count });
}

/*
    - This function already has solution for optimal orders which was found at the determineSoltion stage(Previous stage);
    - Now the solution can be extracted in two ways:
        1. By traversing the inventory matrix list lets call it inventoryListBased solutionl
        2. By traversing the orderMatrix (productSUmmary field); lets call it - OrderListbased solution;
*/
function _extractSolution(_orderMatrixList, _inventoryMatrixList, callback) {
    _orderMatrixList = solutionFromOrderMatrixList(_orderMatrixList);
    _inventoryMatrixList = solutionFromInvetoryList(_inventoryMatrixList);
    callback(null, _orderMatrixList, _inventoryMatrixList);
}

function solutionFromOrderMatrixList(_orderMatrixList) {
    //Iterate Orders;
    _orderMatrixList.map(_orderMatrix => {
        var solutionList = [];
        //Iterate prodRatioMatrix;
        _orderMatrix.prodRatioMatrix.map(_ratioMatrix => {
            //Iterate Traces and collect solution;
            _.each(_ratioMatrix.trace, function (trace) {
                var product = _.find(_orderMatrix.productSummary, { "productHash": trace.hash, "productId": trace.productId, "subOrderId": trace.sOid });

            });
        });
    });
    return _orderMatrixList;
}

function solutionFromInvetoryList() {

}

function resetKeepers(orderMatrixList) {
    orderMatrixList.map(_orderMatrix => {
        //first reset orderKeeper;
        _orderMatrix.orderkeeper = _orderMatrix.orderSummary;
        // reset prodOrderMatrix;
        _orderMatrix.prodRatioMatrix.map(el => {
            el.remainingQty = el.totalQtyRequired;
            el.usedQty = 0;
        });
        //then keepers at productSummary level;
        _orderMatrix.productSummary.map(el => {
            el.productkeeper.remainingQty = el.productkeeper.requiredQty;
            el.productkeeper.alloted = 0;
            //Reset product summary;
            el.subOrderSummary.totalRemainingQty = el.subOrderSummary.totalRequestedQty - el.subOrderSummary.totalBlockedQty;
        })
    });
}

function resetKeepers(orderMatrixList) {
    orderMatrixList.map(_orderMatrix => {
        //first reset orderKeeper;
        _orderMatrix.orderkeeper = _orderMatrix.orderSummary;
        // reset prodOrderMatrix;
        _orderMatrix.prodRatioMatrix.map(el => {
            el.remainingQty = el.totalQtyRequired;
            el.usedQty = 0;
        });
        //then keepers at productSummary level;
        _orderMatrix.productSummary.map(el => {
            el.productkeeper.remainingQty = el.productkeeper.requiredQty;
            el.productkeeper.alloted = 0;
            //Reset product summary;
            el.subOrderSummary.totalRemainingQty = el.subOrderSummary.totalRequestedQty - el.subOrderSummary.totalBlockedQty;
        })
    });
}




