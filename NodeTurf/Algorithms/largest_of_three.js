
let arr = [5, 9, 1, 3, 10, 2, 15]; //output first = 15 ; second = 10 ; third = 9;

function largest(arr) {
    let first = 0;
    let second = 0;
    let third = 0;

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > first) {
            third = second;
            second = first;
            first = arr[i];
        } else if (arr[i] > second) {
            third = second;
            second = arr[i];
        } else if (arr[i] > third) {
            third = arr[i];
        }
    }

    return { first: first, second: second, third: third }
}


let result = largest(arr);

console.log("Result : ", result);