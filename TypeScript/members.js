/*
    - Members visibility for encapsulation
    - By default (even with out explicitly declaring all are public);
    - modifiers - public , private , protected
        * Public:  accessible every where;
        * private: Only within the declared class;
        * protected: Only  inhereited classes ;
*/
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Human = /** @class */ (function () {
    function Human() {
    }
    Human.prototype.setFirstName = function (firstName) {
        this.firstName = firstName;
    };
    Human.prototype.setLastName = function (lastName) {
        this.lastName = lastName;
    };
    //By Default public - need not explicitly define;
    Human.prototype.getFirstName = function () {
        return this.firstName;
    };
    Human.prototype.getLastName = function () {
        return this.lastName;
    };
    Human.prototype.getFullName = function () {
        return this.firstName + " " + this.lastName;
    };
    return Human;
}());
var Boy = /** @class */ (function (_super) {
    __extends(Boy, _super);
    function Boy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Boy.prototype.setName = function (firstName, lastName) {
        this.setFirstName(firstName); // Protected - Hence cannot be accessed out side class which inherits;
        this.setLastName(lastName);
    };
    return Boy;
}(Human));
var boy = new Boy();
// boy.firstName  - Not available / accessible out side call Human 
//boy.setFirstName(firstName); // Protected - Hence cannot be accessed out side class which inherits;
boy.setName('Aman', 'Kareem');
console.log(boy.getFirstName());
console.log(boy.getFullName());
