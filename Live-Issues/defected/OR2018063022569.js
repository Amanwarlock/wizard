var batch = {
	"_id" : "OR2018063022569",
	"paymentStatus" : "Paid",
	"createdAt" : ISODate("2018-06-30T18:46:42.103+05:30"),
	"invoices" : [
		{
			"invoiceNo" : "IN17100010458",
			"amount" : 665,
			"_id" : ObjectId("5b39f2d1c6dcf9426a932911"),
			"isCustomerReturn" : false,
			"processRefund" : false,
			"isRTO" : false,
			"isCulled" : false,
			"commissionReleased" : "Pending",
			"status" : "New"
		}
	],
	"stockAllocation" : "PartialAllocated",
	"subOrders" : [
		{
			"name" : "Intex Eco 205i(Black)",
			"mrp" : 1099,
			"b2bPrice" : 775,
			"quantity" : 2,
			"_id" : "OR2018063022569_1",
			"batchId" : "BR20180702726",
			"invoiced" : false,
			"processed" : true,
			"readyForBatching" : true,
			"snapshots" : [
				{
					"ledgerId" : "10056381530517132721",
					"snapShotId" : "WH17481",
					"productId" : "PR15024",
					"quantity" : 1,
					"mrp" : 1099,
					"location" : "Normal",
					"area" : "NormalAR-WMF0-2",
					"rackId" : "Rack-1",
					"binId" : "Bin-1",
					"type" : "Reserved",
					"createdAt" : ISODate("2018-07-02T13:08:54.341+05:30")
				},
				{
					"type" : "Reserved",
					"binId" : "Bin-1",
					"rackId" : "Rack-1",
					"area" : "NormalAR-WMF0-2",
					"location" : "Normal",
					"mrp" : 1099,
					"quantity" : 1,
					"productId" : "PR15024",
					"snapShotId" : "WH17161",
					"ledgerId" : "10087941530526464668",
					"_id" : ObjectId("5b39fb08fa5a3a29b0a1d409"),
					"serialNo" : [ ],
					"barcode" : [ ]
				}
			],
			"blockedProducts" : [
				{
					"productId" : "PR15024",
					"quantity" : 2
				}
			],
			"requestedProducts" : [
				{
					"productId" : "PR15024",
					"quantity" : 2,
					"_id" : ObjectId("5b3782bbbbb2a80c84c80363")
				}
			],
			"internalStatus" : "BatchEnabled",
			"status" : "Processing",
			"performaInvoiceNo" : "PR12876"
		},
		{
			"name" : "Intex Eco 105(Black)",
			"mrp" : 949,
			"b2bPrice" : 670,
			"quantity" : 2,
			"_id" : "OR2018063022569_2",
			"batchId" : "",
			"invoiced" : false,
			"processed" : false,
			"readyForBatching" : false,
			"snapshots" : [ ],
			"blockedProducts" : [ ],
			"requestedProducts" : [
				{
					"productId" : "PR15028",
					"quantity" : 2,
					"_id" : ObjectId("5b3782bbbbb2a80c84c80364")
				}
			],
			"internalStatus" : "Confirmed",
			"status" : "Confirmed"
		},
		{
			"name" : "Parle G (Rs. 5) Original Biscuit (70g) Case (144pcs.)",
			"mrp" : 720,
			"b2bPrice" : 655,
			"quantity" : 1,
			"_id" : "OR2018063022569_3",
			"batchId" : "BR20180702765",
			"invoiced" : true,
			"processed" : true,
			"readyForBatching" : true,
			"snapshots" : [
				{
					"ledgerId" : "10118411530364603378",
					"snapShotId" : "WH17451",
					"productId" : "PR14470",
					"quantity" : 1,
					"mrp" : 720,
					"location" : "Normal",
					"area" : "NormalAR-WMF0-12",
					"rackId" : "Rack-1",
					"binId" : "Bin-1",
					"type" : "Reserved",
					"createdAt" : ISODate("2018-06-30T18:46:45.968+05:30")
				}
			],
			"blockedProducts" : [
				{
					"productId" : "PR14470",
					"quantity" : 1
				}
			],
			"requestedProducts" : [
				{
					"productId" : "PR14470",
					"quantity" : 1,
					"_id" : ObjectId("5b3782bbbbb2a80c84c80365")
				}
			],
			"internalStatus" : "Invoiced",
			"status" : "Invoiced",
			"performaInvoiceNo" : "PR12875",
			"invoiceNo" : "IN17100010458"
		}
	],
	"gotRequestedProducts" : false,
	"status" : "Processing"
}