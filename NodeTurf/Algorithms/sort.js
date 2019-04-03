
let arr = [5, 9, 1, 3, 10, 2, 15]; // output = [1,2,3,5,9,10,15] , [15,10,9,5,3,2,1];


function sort(arr, type) {

    switch (type) {
        case 'asc': return increasingOrder(arr); break;
        case 'dec': return decreasingOrder(arr); break;
        default: return null;
    }


    function decreasingOrder(arr) {
        for (let i = 0; i < arr.length; i++) {
            for (let j = arr.length - 1; j > i; j--) {
                if (arr[j] > arr[i]) {
                    let t = arr[i];
                    arr[i] = arr[j];
                    arr[j] = t;
                }
            }
        }

        return arr;
    }

    function increasingOrder(arr) {
        for (let i = 0; i < arr.length; i++) {
            for (let j = arr.length - 1; j > i; j--) {
                if (arr[i] > arr[j]) {
                    let t = arr[i];
                    arr[i] = arr[j];
                    arr[j] = t;
                }
            }
        }

        return arr;
    }

}

let result = sort(arr, 'asc');

console.log("SOrt : ", result);

let res = sort(arr, 'dec');

console.log("SOrt : ", res);