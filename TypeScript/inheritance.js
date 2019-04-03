/*


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
var A = /** @class */ (function () {
    function A() {
        this.first = 'Aman';
        this.last = 'Kareem';
    }
    A.prototype.getFullName = function () {
        return "Full Name from parent class A : " + this.first + " " + this.last;
    };
    return A;
}());
var B = /** @class */ (function (_super) {
    __extends(B, _super);
    function B() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.firstName = 'Warlock';
        _this.lastName = 'Wizard';
        return _this;
    }
    //  console.log(`First name from parent using super key word ${super.firstName}`);
    B.prototype.getFullName = function () {
        return "Full Name from parent class B over rided : " + this.firstName + " " + this.lastName;
    };
    B.prototype.getParentFullName = function () {
        return _super.prototype.getFullName.call(this);
    };
    return B;
}(A));
var C = /** @class */ (function () {
    function C() {
    }
    return C;
}());
var b = new B();
console.log(b.getFullName());
console.log(b.getParentFullName());
