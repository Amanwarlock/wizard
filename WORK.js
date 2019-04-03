
git+https://bitbucket.org/storekingdev/puttu-redis.git

git clone git@bitbucket.org:storekingdev/cache.git

git+https://bitbucket.org:storekingdev/cache.git

git+https://bitbucket.org:storekingdev/cache.git



http://www8.martjack.com/developerapi/swagger/ui/index#
-----------------------------------------------------------------[ WAREHOUSES ]---------------------------------------------------------------------------------------------------------------------
WMF0 - SK_warehouse
WMF1 - Hyd warehouse
WMF3 - Walmart Warehouse

------------------------------------------------------------------------------------------------------------------------------------------------------------------
FRANCHISE:
	RF - F530206  -Amanwarlock - rf  - username: 9113033298 , password - 12345
	RMF - F530207 - warlock - RMF - username: 8050913325 , password - 12345
	RMF - F100001
	LMF's - [LMF100022]

ROUTES :
	WMF0 --> LMF100022 --> F100001
	LMF100022 --> F530207

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/home/aman/Downloads/mongoDump

	#.SOURCEABLE : DEALS WITH NO STOCK: 

		D10158 - PR10145 - Zandu Balm (4.5ml) - ["WH4637"] - db.warehouses.remove({productId : "PR10145" , _id : {"$nin"  : ["WH4637"]}})
		D2352569646 - RED MI
		D10261 - PR10199 - White Tone Face Powder (30g) - ["WH4568" , "WH1699" , "WH1590"]
		D10021 - PR10017 - Engage On Woman Pocket Perfume - Sweet Blossom - WMF0= ["WH4450" , "WH4732"]  WMF1= ["WH4711","WH4713","WH4732","WH4733"]
		D0187934817	 PR10962-  Adidas New Game = Men ["WH4731"]	
		D10245 - PR10248 - Fair and lovely - ["WH4456" , "WH4615"]
		D7365174110    - PR10960 - Tresemme conditioner Keratin - ["WH4651" , "WH4657" , "WH4663" , "WH4670" , "WH4676" , "WH4682" ]
		D4268479138 - PR10963 - Wizard -HPB-500
		PR10965 - wizard hyper 1  -grn product
		PR10966 - wizard
		PR10207 - Ponds
		PR11050 - ponds case - pack of 10
---------------------------------------------------------------------------------------------------------
	#. COMBO DEALS:
	
	Ponds & Lakme = 	D2365503915 - 
					PR10251 (Ponds) - ["WH1313" , "WH1496" , "WH1521"]
					PR10615 (Lakme) - ["WH4146" , "WH4153"] - Invoice separately;

	Lakme & Zandu Balm =	D0044403540 - 
					PR10611 (Lakme Nail POlish) - ["WH4156"]
					PR10145 (Zandu Balm)	- ["WH4637"]

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

	#.NOT SOURCEABLE : DEALS WITH NO STOCK:
		
		D10306 - PR10300 -- Nycil Talcum Powder - Classic Excel (150g) - ["WH4584" , "WH4585" , "WH4597" , "WH4670" , "WH4702"]

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	#.MOBILE PRODUCTS:

		D2285565569 - PR10961                 - Mobile-Inv - ["WH4553"] - db.warehouses.remove({productId : "PR10961" , _id : {"$nin"  : ["WH4553"]}})
		D0793266489 - PR10968 + PR10967       - samsung+Formal
		D5098473715 - PR10001	     	      - Karbonn A40 Indian (Black,8GB,1GB RAM) - ["WH2091" , "WH2089" , "WH1711"]
		D10003	    - PR10001        	      - Karbonn A40 Indian (Black,8GB,1GB RAM) (pack of 3) - ["WH2091" , "WH2089" , "WH1711"]
		D1927297821 - PR10466        	      - xiaomi mobile
		D6354793855 - PR10277                 - Xiaomi Redmi 4 (Black, 4GB RAM 64 GB ROM)
		D2352569646 - PR10478	      	      - MI RED ME - []

{_id: 1 , quantity:1 ,location:1,area:1 , rackId:1 , binId:1 ,onHold:1 , barcode:1 ,productId:1 , serialNo :1 , scannedSerialNo:1}
{_id: 1 , quantity:1 ,onHold:1 , barcode:1 ,productId:1 , serialNo :1 }
----------------------------------------------------------------------------------------------------------------------------------------------------


	SAMPLE:  "git+https://bitbucket.org/storekingdev/cache.git"

	WORKING : git+https://bitbucket.org/amankareem/wmfintegration.git [Just remove initial name and @ ex: amankareem@ this part needs to be omitted]

	git+https://amankareem:Zkf9S2mWaY9879QATUHJ@bitbucket.org:amankareem/invoice.git#*

	git+https://amankareem@bitbucket.org/amankareem/wmfintegration.git



-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

	MULTIWARE HOUSE DEAL LISTING:

	Engange : D10021 - PR10017 = {{api-url}}/deal/v1?filter={"category":{"$in":["C5395"],"$nin":[]},"status":"Publish","brand":{"$nin":[]},"_id":{"$nin":[]}}

	FAIR & PONDS : D10245 - PR10248 = {{api-url}}/deal/v1?filter={"category":{"$in":["C5204"],"$nin":[]},"status":"Publish","brand":{"$nin":[]},"_id":{"$nin":[]}}

-------------------------------------------------FULFILLMENT CENTERS -------------------------------------------------------------------------------------------------------------------------------


 #.[ WALMART FC ]
	PR10964 - D7646571270
	D0913046796 - Bambino - volumetric
	D0913046796










-------------------------------------------------------WALMART DEALS-------------------------------------------------------------------------------------------------------------------------------------

LOCAL:
	D2450785826 - Bambino Macroni Elbow, 450g
	D4218292241 - BRU Gold Coffee 10N (6g Each)\
	D0044293513 - Cadbury


STAGING:
	 D2158195811 - Cadbury
	 D0993416416 - Raymond Multi Bath Towel Bluebell, 1 N
	 D3886712746 - Raymond Bath Towel Bluebell, 1 N


D5665254665

OR201903202 , OR201903204
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

LIVE PRODUCT MULITPLE MRPS;
		//PR16327,PR15518,PR18728
    // PR19972 ,PR11908,PR10288- WMF1



LOCAL PRODUCT MULITPLE MRPS
	
	PO id : 201903291 - GRN535 - PR10145 - C3948

	/*
		PR10145 - WMF0
		PR10393, PR10393 , PR10162 , PR10273 , PR10359

		PR10373 ,PR10128 - only one mrp
	*/





----------------INVOICE BULK AND RESET------------------------------------------------------------------------------------------------------------------------------------------------------------------
LOCAL:
	 D10232 - PR10207 - WMF1 -  WH5493,WH5494
	 Orders = OR201904011


QA: OR2019032911 - 
	db.warehouses.find({ "_id": { "$in": ["WH9245","WH9247"] } }, { _id: 1, quantity: 1, onHold: 1, barcode: 1, productId: 1, serialNo: 1 ,whId:1,mrp:1,scannedSerialNo:1,isGoodStock:1 })

	db.warehouses.find({ productId: "PR11835" , whId: "WMF0" , $or: [{ quantity: { $gt: 0 } }, { onHold: { $gt: 0 } }] }, { _id: 1, quantity: 1, onHold: 1, barcode: 1, productId: 1, serialNo: 		1 ,whId:1,mrp:1,scannedSerialNo:1,isGoodStock:1 })

	


















