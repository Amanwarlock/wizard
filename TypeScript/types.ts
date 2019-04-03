
// Compile - tsc filename;
// Run node filename.js or tsc <filename && node <filename>>

/* #.Introduction :
    - types - number , string , boolean , undefined , null;
    - Tuples - for array type safety - array of fixed length only
    - unions - ex: Number | Boolean - either of the two
 */
//-------------------------------------#.Number Declaration-------------------------------------------------------------------------------------
var a: number;
a = 10;
console.log(`A  ${a}`);
// Cannot assign string or etc ; it will give compile time error as an alert; But still the code is valid javascript
// Hence it will go ahead and compile it to js code with no issue at all;
//---------------------------------#.String Declaration-------------------------------------------------------------------------------------------

var message: string;
message = 'Hello';
console.log(`Message ${message}`);

//------------------------------------#.Arrays--------------------------------------------------------------------------------------------------------------

/* Arrays */
var myList: number[];
myList = [3];
console.log(`Array  ${myList}`);

//-------------------------------------#. Tuples--------------------------------------------------------------------------------------------------

/* Tuples */
var idList: [number, boolean];
idList = [2, true]; // Cannot be [2 , true , 2] as size is fixed;

//-------------------------------------#. UNIONS----------------------------------------------------------------------------------------------------
/*Unions */

var myName: number | string;

myName = 20;
myName = 'Aman';