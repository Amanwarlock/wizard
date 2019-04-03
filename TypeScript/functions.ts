/* 
    - Delaration;
    - Arguments passing;
    - Optional Arguments; 
    - Default argument when optional;
    - Return type;
    - implicit casting
*/

/* --------------------------------------------------------#.Declaration & Arguments passing------------------------------------------------------------------------------------------ */
function getFullName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`;
}

var fullName = getFullName('Aman', 'Kareem');  // Implicit casting as per the function return value type;
// Implicit type casting for the variable fullName only if variable fullName is declared and assigned in the same line;
/*
    If 
    var fullName;
    fullName = getFullName('Aman' , 'Kareem');
    Then no implicit type casting; - As variable declaration and assignment is done in 2 lines;
 */
console.log(`Full Name :  ${fullName}`);
/* --------------------------------------------------------#.Optional Arguments------------------------------------------------------------------------------------------ */
function getFullNameAndAge(firstName: string, lastName: string, age?) {
    return `${firstName} ${lastName} Age: ${age}`;
}

/* 
    Method 1 : function getFullNameAndAge(firstName: string, lastName: string , age?) { } 
    Method 2 : function getFullNameAndAge(firstName: string, lastName: string , age?: number) { } 
*/

var fullNameWithAge = getFullNameAndAge('Aman', 'Kareem');  // Implicit casting as per the function return value type;
console.log(`Full Name & age (optional):  ${fullNameWithAge}`);
/* --------------------------------------------------------#.Optional Arguments------------------------------------------------------------------------------------------ */
function getFullNameAndGender(firstName: string, lastName: string, gender: string = 'Male') {
    return `${firstName} ${lastName} gender : ${gender}`;
}

/* 
    Method 1 : function getFullNameAndAge(firstName: string, lastName: string , age?) { } 
    Method 2 : function getFullNameAndAge(firstName: string, lastName: string , age?: number) { } 
*/

var fullNameWithGender = getFullNameAndGender('Aman', 'Kareem');  // Implicit casting as per the function return value type;
console.log(`Full Name & gender (if not given default) :  ${fullNameWithGender}`);
/* --------------------------------------------------------#.Return type------------------------------------------------------------------------------------------ */
function getNickName(nickName: string): string {
    return `Nick Name : ${nickName}`;
}

var nickName = getNickName('Warlock');
console.log(nickName);
