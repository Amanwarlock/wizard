/* 

- Hygiene check list:
        1. Pending suborders - After paymentStatus = paid ; subOrders.status = "Pending";
        2. 









*/

/* 
Issues to keep a watch :
    Pendin suborders
    orders not invoiced snapshots qty must match with associated snapshot onHold field;
    orders invoiced - total released must tally mathematically with snapshot GRN qty , onHold qty equation;
    Orders-suborders with extra reservation or blocked product update issue 
    suborders mapped with wrong performa or having mulitple batches;
    monitor stock ledgers reserved qty , unreserved and release qty to tally up with its transaction ;

*/