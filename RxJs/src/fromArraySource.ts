import { Observable, from, Observer } from "rxjs";

let scoresList = [50, 45, 75, 90];


const scores$ = from(scoresList);


/**
 * Observer is an interface ;
 * This is an standart approach;
 * This interface has three methods which implementation class has to implement;
 * This is a generic type interface, where we specify what type of observable from the source to expect;
 */
class myScoresObserver implements Observer<number>{

    next(value: number) {
        console.log("Value is : ", value);
    }

    error(e: Error) {
        console.log("Error : ", e);
    }


    complete() {
        console.log("Completed : -----------------");
    }

}


scores$.subscribe(new myScoresObserver());

//#. Simple Method
scores$.subscribe(next, onError, onComplete);



function next(value: number) {
    console.log("Value ....", value);
}


function onError(e: any) {
    console.log("Error occured.......", e);
}

function onComplete() {
    console.log("Completed.......");
}


