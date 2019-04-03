/* 
Pivot = last array element;
-Two branches / divisions : i,e left and right;
-anything less than pivot is pushed into left;
-anything greater than pivot is pushed into right;
*/


let arr = [5, 9, 1, 3, 10, 2, 15];


function quickSort(arr) {

    if (arr.length <= 1) return arr;

    const pivot = arr[arr.length - 1];

    let left = [];

    let right = [];

    for (let i = 0; i < arr.length - 1; i++) { //observe condition here
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSort(left), pivot, ...quickSort(right)];

}


let result = quickSort(arr);

console.log("Result : ", result);