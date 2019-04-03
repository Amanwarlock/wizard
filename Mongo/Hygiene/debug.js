/* 
CASE STUDT-1
  WH16331 = stock Intaken: 14400;JUNE Invoiced = 14544 ; 110 orders;
  WH16649 = stock Intaken: 18000;JUNE Invoiced = 18278 ; 111 orders
  WH16775 = stock Intaken: 1000;JUNE Invoiced = 1000; 6 orders;

    WH16649 = onHold = 214 - order not found for substitution;
    WH16775 = onHold = 416 - order not found for substitution;

*/

/* 
CASE STUDY-2
    OR2018063022040 - WH16950 - stock INtaken for 30qty
    - WH16950 = 10 got reserved when order was placed;
    - WH16950 = -1 got invoice unreserved while invoicing; 9 left onHold;
    - for some order 3 invoice reservation failed , but it got released for this inventory any way taking 3 away; 
      Hence only 6 was left; but 9 should be for the order OR2018063022040

*/

/* 
CASE STUDY-3
OR2018061819998

Reservation happened , but onHold qty was zero at the time of invoice .
* Invoice unreserve failed for the reserved snapshots
    WH15607 = 48 should be onHold , but found 0 - Now manually corrected
    WH16123 = 14 should be onHold with subOrder_3 , but found = 0 , now corrected manually
    WH16321 = +10 should be onHold with suBorder_3 , but found = 0 , now corrected manually
    WH16118 = +144 should be onHold with subOrder_4 , but found=0 , now corrected manually

*/

/* 
CASE STUDY-4 : WH17535 - stock intaken for 18 units
    This inventory had 18 on Hold , but there was no order reserving this.
    Order not found for substitution
*/