

let arr = [5, 9, 1, 3, 10, 2, 15];



function finder(arr, type) {
    switch (type) {
        case 'largest': return largest(arr);
        case 'smallest': return smallest(arr);
        default: return null;
    }


    function largest(arr) {
        let largest;
        for (let i = 0; i < arr.length; i++) {

            if(largest === undefined) largest = arr[i];

            if (arr[i] > largest) {
                largest = arr[i];
            }
        }
        return largest;
    }

    function smallest(arr) {
        let smallest;
        for (let i = 0; i < arr.length; i++) {
            if (smallest === undefined) smallest = arr[i];
            if (arr[i] < smallest) {
                smallest = arr[i];
            }
        }
        return smallest;
    }

}



let largest = finder(arr, 'largest');

console.log("Largest : ", largest);

let smallest = finder(arr, 'smallest');

console.log("smallest : ", smallest);