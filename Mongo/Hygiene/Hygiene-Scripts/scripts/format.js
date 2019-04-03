WH50857, WH50822, WH27532, WH27387, WH50853, WH50851




/*

 ADVANCED NOTIFICATION SHIPMENT;

    - ASN CSV will be share via email or manual upload; (We dont know if CSV will have an ASN);
    - Add / store / Log all ASN CSV's in a collection called ASN;
    - ASN number they will share , also we should have an sk ASN number for a given csv and a batchId;
    - ASN will not be packed order wise and they are chances that we will recieve two ASN's at a time;


##. GRN :
    ::::STEP: 1 - DOCK::
        - ASN's CSV recieved either via email or upload store in an ASN's collection in DB;
        - For ERP give option to choose asn (probably show ASN details for user like : date , ASN no , Vehicle no, courier no... etc)
        - After choosing as ASN , user should select locations for docking for that ASN;
        - On choosing dock and submit do automatic GRN to dock;
    ::::STEP-2 - ALLOCATION::
        * NOTE: One Specific location only per ASN for that given day only;
        - Check if any location is free (suggest user a list of free locations only for this ASN)
        - If not ask user to create additional location;
        - For a ASN and for a given day only one location can exist;
        - If a location is already used for a ASN same cannot be used by others;
        - Auto do GRN to allocation wrt to orderIds for a given product from ASN CSV;
        - In orders update the ASN's

##. BATCHING :
    - option to batch by ASN or Location wise;
    - Partial/short shipment
    - short shipement during batch no problem;
    - partial , user can split (RBAC based)
    - For split capture reason , remarks , user name and qty to split or keep;


##. INVOICING :
    - While invoicing we can identify if walmart has shipped units for a given order correctly or not;
    - If a suborder is short on units , then move the allocated stocks to suspens/Reckon location and store the mappings of snapshots;
    - Suspense location is important as when we are doing ASN wise batching, then previous ASN order which had shortage and the shortange stock has
        arrived in today's ASN then the order wont be picked at all.
        OR - instead of Suspense , you can maintain an array of ASN's at suborder level and if to be batched ASN matches any in array pick it;
    - Also in case the shortange is never received or is there any delay ; then ERP user should be able to split the suborder and cancel the desired shortages;    
    - While invoicing if any stocks have not recieved check if any new po has to be raised ?
    - while moving to suspense , scan the products to be moved;

## CONFIG : (Only for walmart)
    - Allow partial Shipement/Invoice or not ? Global flag
    - 

## RBACS: (Only for walmart)
    - Move to suspense 
    - Partial Invoice

##. SPLIT: (Only for walmart)
    - Split suborders product
    - ask user to enter qty
    - recompute deal price after split
    - cannot split if the qty is one 
    - split qty has to be 0< spit < qty
    - suborder should not be batched;
    - suborder shoult be in confirmed state only

##. PARTIAL SHIPMENT:
    - In this case both parties now about this (out of 4 only 2 are shipped now)
    - If partial invoice is allowed in global config and user has rbac ; shortage qty should be logged
    - Capture remarks and reason for short shipment.

##. SHORT SHIPEMENT:
    - In this case we can determine short shipment only while invoicing
    - While invoicing if global level allow partial invoice is checked and user has permission 
    - Move to suspense (Based on Rbac)
    - Capture reason and remarks;
    - log the shortage occured 

*/