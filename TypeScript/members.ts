/* 
    - Members visibility for encapsulation
    - By default (even with out explicitly declaring all are public);
    - modifiers - public , private , protected
        * Public:  accessible every where;
        * private: Only within the declared class;
        * protected: Only  inhereited classes ;
*/

class Human {
    private firstName: string;
    private lastName: string;

    protected setFirstName(firstName: string) {
        this.firstName = firstName;
    }

    protected setLastName(lastName: string) {
        this.lastName = lastName;
    }
    //By Default public - need not explicitly define;
    getFirstName(): string {
        return this.firstName;
    }

    public getLastName(): string {
        return this.lastName;
    }

    public getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}

class Boy extends Human {

    public setName(firstName: string, lastName: string) {
        this.setFirstName(firstName); // Protected - Hence cannot be accessed out side class which inherits;
        this.setLastName(lastName);
    }
}


var boy = new Boy();
// boy.firstName  - Not available / accessible out side call Human 
//boy.setFirstName(firstName); // Protected - Hence cannot be accessed out side class which inherits;
boy.setName('Aman', 'Kareem');
console.log(boy.getFirstName());
console.log(boy.getFullName());
