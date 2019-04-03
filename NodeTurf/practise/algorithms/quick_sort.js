
let arr = [5, 9, 1, 3, 10, 2, 15];

function quickSort(arr) {

    if (arr.length <= 1) return arr; // if arr is empty [] or of size 1 [3];

    let pivot = arr[arr.length - 1]; //last value;

    let left = [];
    let right = [];

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot)
            left.push(arr[i]);
        else
            right.push(arr[i]);
    }

    //return [...quickSort(left), pivot, ...quickSort(right)]; // increasing order

    return [...quickSort(right), pivot, ...quickSort(left)]; // decreasing order;
}


let result = quickSort(arr);

console.log("Result : ", result);