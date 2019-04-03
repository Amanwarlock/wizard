let obj1 = {};
let inst = {
    "place": "Bidar"
}
let obj2 = {
    "name": "aman",
    "age": 24,
    details: {
        "place": "Bidar"
    }
}

let sym1 = Symbol("id");

console.log("sym 1 value is", sym1.toString());


let user = {
    name: 'aman',
    age: 26,

    toString() {
        return `My name is ${this.name}`
    }
}


console.log("User --------------", user.toString());


let arr = [1, 2, 3, 4, 5];

// removed initial value from reduce (no 0)
let result = arr.reduce((sum, current) => sum + current);

alert(result); // 15