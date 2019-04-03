var _ = require("lodash");

var input = "OR2018400 , OR2018500,,OR2018600 OR2018700 , OR2018900OR2018800 , @R89";

input = input.split(",");

input.map((el, index) => {
    el = el.trim();
    if (el) {
        var elem = el.split(" ");
        if (elem.length > 1) {
            input.splice(index, 1);
            input = input.concat(elem);
        }
    }
});

input.map((el, index) => {
    if (!el.trim() || !(el.match(new RegExp("O", "g")) || []).length) {
        input.splice(index, 1);
    }

});

input.map((el, index) => {

    var el = el.replace(/\s/g,'');
    input.splice(index , 1 , el);

    if ((el.match(new RegExp("O", "g")) || []).length > 1) {
        console.log("Occurence by O  : ", (el.match(new RegExp("O", "g")) || []).length, el);
        var positions = [];
        var elem = "";
        for (var i = 0; i < el.length; i++) {
            if (el[i] === 'O') {
                positions.push(i);
            }

            if (el[i].trim()) {
                if (i != 0 && el[i] === 'O') {
                    elem += `,${el[i]}`
                } else {
                    elem += el[i];
                }
            }
        }
        elem = elem.split(",").filter(Boolean);
        input.splice(index, 1);
        input = input.concat(elem);
        console.log('Positions : ', positions, elem);
    }
});

//.replace(/\s/g,'')


console.log("Input", input);

console.log('Join' , input.join(","));


