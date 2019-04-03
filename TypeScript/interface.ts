/* 
    - Interfaces;
    - Duck Typing
*/

interface Person {
    firstName: string;
    lastName: string;

    getFullName(): string
}

class Programmer implements Person {
    firstName: string = 'Aman';
    lastName: string = 'Warlock';

    getFullName(): string {
        return `Full Name : ${this.firstName} ${this.lastName}`
    }
}

var person: Person = new Programmer(); // Creating instance and reference variable of interface type - Pointer;
console.log(person.getFullName());


/* ----------------------------------------------------#. DUCK TYPING--------------------------------------------------------------------------------- */
let someObj = {
    firstName: 'Aman',
    lastName: 'Kareem',
    getFullName: () => 'Duck Typing Test',
    age: 26
}
/*
    Since the above obj has all properties implemented as from the interface;
    Its instance can be assigned to instance of type interface as well ;
    If we try to access properties using interface reference variable it will work , accept for age prop - as age is not the property of interface ;

 */

var normalPerson: Person = someObj;
console.log(normalPerson.getFullName());
//console.log(normalPerson.age); // Throws error as using interface type reference variable we cannot access age as its not defined in interface;

