/*
    - Interfaces;
    - Duck Typing
*/
var Programmer = /** @class */ (function () {
    function Programmer() {
        this.firstName = 'Aman';
        this.lastName = 'Warlock';
    }
    Programmer.prototype.getFullName = function () {
        return "Full Name : " + this.firstName + " " + this.lastName;
    };
    return Programmer;
}());
var person = new Programmer(); // Creating instance and reference variable of interface type - Pointer;
console.log(person.getFullName());
/* ----------------------------------------------------#. DUCK TYPING--------------------------------------------------------------------------------- */
var someObj = {
    firstName: 'Aman',
    lastName: 'Kareem',
    getFullName: function () { return 'Duck Typing Test'; },
    age: 26
};
/*
    Since the above obj has all properties implemented as from the interface;
    Its instance can be assigned to instance of type interface as well ;
    If we try to access properties using interface reference variable it will work , accept for age prop - as age is not the property of interface ;

 */
var normalPerson = someObj;
console.log(normalPerson.getFullName());
//console.log(normalPerson.age); // Throws error as using interface type reference variable we cannot access age as its not defined in interface;
