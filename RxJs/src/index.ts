//import { Observable } from "rxjs";

import { Observable } from "rxjs";

let scoresList = [50, 45, 75, 90];


const scores$ = Observable.create((observer: any) => {

    let index = 0;

    let produce = () => {
        observer.next(scoresList[index++]);

        if (index < scoresList.length) {
            setTimeout(produce, 2000);
        } else {
            observer.complete();
        }
    }

    produce();

});



scores$.subscribe((value: number) => {
    console.log("Value is : ", value);
}, (error: Error) => {
    console.log("Error is ", error);
}, () => {
    console.log("Completed ----------------");
});