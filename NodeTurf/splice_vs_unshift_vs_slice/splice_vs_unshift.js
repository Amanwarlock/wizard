/*
  - Splice takes three arguments : array.splice(arg1,arg2,arg3)
  - arg1 = index/position of element in array that is to be removed;
  - arg2 (optional) = *if arg2 is not given then all elements in array from the given position will be removed;
                      * If arg2 = 0 ; then element wont be removed;
                      * If arg2 = 1 ; then one element will be removed;
  - arg3 (optional) = This arg adds the element to the removed position in that array;
  - Splice returns the removed elements array;
  - splice alteres the array; i,e array gets effected on splice;

*/

/*
  - unshift adds elements to the first in an array;
*/

/*
  - Slice - slice takes only two arguments;
  - array.slice(arg1,arg2);
  - arg1 = starting position/index to select;
  - arg2 = end position/index (excluded) ; If this is not given , it selectes all elements from starting of arg1;
  - slice returns the matched elements array based on the positions/indices given;
  - slice does not alter the array ; i,e that original array is uneffected;
*/


/*--------------------------------------------------------------------------------------------------------------------------------------------------------------*/


var inventories = [{
  "_id" : "WH100",
  "quantity" : 2,
  "used" :0,
},
{
  "_id" : "WH200",
  "quantity" : 3,
  "used" : 0
}];

var priorityList = ["WH200"];


inventories.map((el,k) => {
  if(priorityList.indexOf(el._id) > -1){
    var element = inventories.splice(k,1);
    inventories.unshift(element[0]);
  }
});

console.log("Invenntories sorted according to the priorityList : " ,inventories );
