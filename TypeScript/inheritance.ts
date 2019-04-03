/* 


*/


class A {
    first: string = 'Aman';
    last: string = 'Kareem';
    
    getFullName() {
        return `Full Name from parent class A : ${this.first} ${this.last}`;
    }
}


class B extends A {

    firstName: string = 'Warlock';
    lastName: string = 'Wizard';

  //  console.log(`First name from parent using super key word ${super.firstName}`);

    getFullName() {
        return `Full Name from parent class B over rided : ${this.firstName} ${this.lastName}`
    }

    getParentFullName(){
       return super.getFullName();
    }
}

class C {
    constructor(){
        
    }

    /* 
        Any of constructor can be defined of the following below 2: 
            1. Default constructor;
            2. Overloaded constructor with arguments;
        TO call constructor of the parent use super();
    */
}


var b = new B();
console.log(b.getFullName());
console.log(b.getParentFullName());

