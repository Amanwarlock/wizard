var mongoose = require("mongoose"),
    Schema = mongoose.Schema;
module.exports = {
    _id: {
        type: String,
        default: null
    },
    typeOfOrder: {
        type: String,
        enum: ["SK", "MPS", "SELLER", "WMFORDERS", "RESERVEORDERS"],
        default: "SK"
    },
    isOffline: {
        type: Boolean,
        default: false
    },
    autoCancel: {
        type: Boolean,
        default: true
    },
    //Cancellation TAT In Minutes
    cancelationTat: {
        type: Number,
        default: 10
    },
    autoConfirm: {
        type: Boolean,
        default: true
    },
    paymentTransactionId: { type: String },
    vatFixed: { type: Boolean, default: false },
    poId: { type: String },
    useWallet: { type: Boolean, default: false },
    logistics: { type: Number },
    batchingTime: { type: Date },
    name: { type: String },
    confirmationDate: {
        type: Date
    },
    isPurchaseOrder:{type:Boolean,default:false},
    linkedPurchaseOrderId: { type: String },
    awbNumber: {
        type: String
    },
    placedBy: {
        type: String
    },
    cancelledBy: {
        type: String
    },
    cancellationDateAndTime: {
        type: Date
    },
    //Cancellation TAT In Minutes
    cancelationTat: {
        type: Number,
        default: 10
    },
    coupon: {
        id: { type: String },
        couponCode: { type: String },//Now we are considering Coupon Code not Coupon Id
        discount: { type: Number, default: 0 },//This will total Discount Per Order Level
        couponDiscPerDeal: [{
            type: Schema.Types.Mixed
        }],//this is coupon Discount for Deal
        isCouponUsed: { type: Boolean, default: false },
        isCouponUpdated: { type: Boolean, default: false }
    },
    couponDisc: {
        type: Number,
        default: 0
    },
    kingsaleDisc: {
        type: Number,
        default: 0
    },
    kingsale: [{
        from: { type: Number },
        to: { type: Number },
        discount: { type: Number, default: 0 },
        value: { type: Number, default: 0 },
        id: { type: String }
    }],
    status: {
        type: String,
        enum: ["Created", "Received", "Payment Initiated", "Confirmed", "Invoiced", "Cancelled", "Processing", "Partially Shipped", "Shipped", "Closed", "Partially Delivered", "Delivered", "Partner Shipped","Seller Shipped", "ManifestGenerated", "Ready To Ship", "Partially Returned", "Returned"],
        default: "Created"
    },
    notification: {
        "Created": { type: Boolean, default: true },
        "Payment Initiated": { type: Boolean, default: true },
        "Confirmed": { type: Boolean, default: true },
        "Invoiced": { type: Boolean, default: true },
        "Cancelled": { type: Boolean, default: true },
        "Processing": { type: Boolean, default: true },
        "Partially Shipped": { type: Boolean, default: true },
        "Shipped": { type: Boolean, default: true },
        "Closed": { type: Boolean, default: true },
        "Partially Delivered": { type: Boolean, default: true },
        "Delivered": { type: Boolean, default: true }
    },
    discount: {
        type: Number,
        default: 0
    },
    inwardScan: {
        type: Boolean,
        default: false
    },
    processed: {
        type: Boolean,
        default: false
    },
    readyToShip: {
        type: Boolean,
        default: false
    },
    orderAmount: {
        type: Number,
        minimum: 1
    },
    paymentStatus: {
        type: String,
        enum: ["Paid", "Unpaid", "Reverted"]
    },
    paymentDate: {
        type: Date
    },
    transactionId: {
        type: String
    },
    invoiced: {
        type: Boolean,
        default: false
    },
    source: {
        type: String,
        default: "WMF0"
    },
    commissionReleasedAt: {
        type: String,
        default: "Delivered"
    },
    disabledBatch: {
        type: Boolean,
        default: false
    },
    body: {
        type: Object
    },
    invoiceGeneratedOn: { type: Date },
    gotRequestedProducts: { type: Boolean, default: false },
    logisticsId:{ type: String},
    subOrders: [{
        id: { type: String },
        allowReserveOrder: { type: Boolean },
        extId: { type: String }, // mps
        info: { type: Object },// mps
        isShowCaseDeal: { type: Boolean },
        partnerProductUrl: { type: String },
        partnerManifectId: { type: String },
        partnerShipmentDate: { type: String },
        cashOnDeliveryCharge: { type: Number, default: 0 },
        encryptedShipmentId: { type: String, default: 0 },
        estimatedDeliveryDate: { type: Date },
        partnerEstimatedDeliveryDate: { type: Date },
        shipsIn: { type: String },
        shipmentDueDate: { type: Date},
        mrp: { type: Number },
        b2bPrice: { type: Number },
        vat: { type: Number },
        memberPrice: { type: Number },
        images: [{ type: String }],
        delivery_chalan: { type: Boolean },
        invoiceNo: { type: String },
        kingsale: { type: String },
        performaInvoiceNo: { type: String },
        seggregationBatchId: { type: String },
        trayNo: { type: String },
        motherboxNo: { type: String },
        shippingCharges: { type: Number, default: 0 },
        AWBNo: { type: String },
        logisticsId:{ type: String},
        name: { type: String },
        sellerCharges: {type: Number},
        category: {
            id: { type: String },
            name: { type: String }
        },
        brand: {
            id: { type: String },
            name: { type: String }
        },
        claimed: {
            type: Number,
            default: 0
        },
        products: [{
            id: { type: String },
            name: { type: String },
            mrp: { type: Number },
            barcode: { type: String },
            quantity: { type: Number },
            blockedQty: { type: Number },
            returnedQuantity: { type: Number, default: 0 },
            barcodeScanned: { type: Boolean },
            images: [{ type: String }],
            snapShot: [{ type: String }],
            serialNos: [{ type: String }],
            returnedSerialNos: [{ type: String }],
            category: { type: String },
            brand: { type: String },
            imeiCommAvailable: { type: Boolean },
            serialNo:  [{ type: String }],
            imeiSlab: { type: Object },
            HSNNumber: { type: String },
            skuCode: { type: String },
            allowReserveOrder: { type: Boolean },
            taxInfo: {
                tax: { type: Number },
                spMargin: { type: Number },
                isDefaultHSN: { type: Boolean }
            },
            transferPrice : { type: Number },
            mapping:{
                productId: {type: String},
                categoryId: {type: String},
                sku: {type: String}
            },
            stickyOrderPrice: { type: Boolean },
            collectSerialNumber: { type: Boolean },
            offer: { type: String }
        }],
        invoice_seperately: { type: Boolean },
        price: { type: Number },
        orgPrice: { type: Number },
        couponDisc: { type: Number, default: 0 },//this is added to save the couponDisc amount Applied for this Deals
        kingsaleDisc: { type: Number, default: 0 },
        kingsaleEnabled: {
            type: Boolean
        },
        status: { type: String, default: "Confirmed", enum: ["Pending", "Created", "Received", "Payment Initiated", "Confirmed", "Invoiced", "Cancelled", "Processing", "Partially Shipped", "Shipped", "Closed", "Partially Delivered", "Delivered", "Partner Shipped", "ManifestGenerated", "Ready To Ship", "Partially Returned", "Returned", "Packed","Seller Shipped"] },
        commission: {
            amount: { type: Number, default: 0 },
            perc: { type: Number, default: 0 },
            paid: { type: Boolean, default: false }
        },
        internalStatus: { type: String, default: "Confirmed" },
        _id: { type: String },
        quantity: { type: Number },
        inventoryId: { type: String },
        requestedProducts: [{
            productId: { type: String },
            quantity: { type: Number }
        }],
        blockedProducts: [{
            productId: { type: String },
            quantity: { type: Number }
        }],
        snapshots: [{
            ledgerId: { type: String },
            snapShotId: { type: String },
            whId: { type: String },
            barcode: [{ type: String }],
            serialNo: [{ type: String }],
            productId: { type: String },
            expiryDate: { type: Date },
            quantity: { type: Number },
            mrp: { type: Number },
            purchasePrice: { type: Number },
            ref: {
                grn: { type: String },
                po: { type: String },
                invoice: { type: String },
                vendor: { type: String }
            },
            location: { type: String },
            area: { type: String },
            rackId: { type: String },
            binId: { type: String },
            type: { type: String }
        }],
        gotRequestedProducts: { type: Boolean, default: false },
        readyForBatching: {
            type: Boolean,
            default: false
        },
        processed: {
            type: Boolean,
            default: false
        },
        inwardScan: {
            type: Boolean,
            default: false
        },
        readyToShip: {
            type: Boolean,
            default: false
        },
        invoiced: {
            type: Boolean,
            default: false
        },
        batchId: { type: String, default: "" },
        logs: [{
            createdAt: { type: Date },
            status: { type: String },
            remarks: { type: String },
            cancelledByName:{ type: String },
            cancelledBy:{ type: String }
        }],
        stickyOrderPrice: { type: Boolean },
        mpsManifestoDetails: {
            shipfromName: { type: String },
            shipFromAddress: { type: String },
            shipFromCity: { type: String },
            shipFromState: { type: String },
            shipFromPostcode: { type: String },
            shiptoName: { type: String },
            shiptoAddress: { type: String },
            shiptoCity: { type: String },
            shiptoState: { type: String },
            shiptoPostcode: { type: String }
        },
        networkCommission:{
            amount:{type : Number,default:0},
            perc :{ type : Number,default:0},
            paid: { type: Boolean, default: false }
        }
    }],
    stockAllocation: {
        type: String,
        enum: ["Allocated", "NotAllocated", "PartialAllocated"],
        default: "NotAllocated"
    },
    readyForBatching: {
        type: Boolean,
        default: false
    },
    paymentMode: {
        type: String,
        enum: ["Cash", "Online", "Wallet"]
    },
    paymentDate: {
        type: Date
    },
    orderType: {
        type: String,
        enum: ["Wholesale", "Retail"]
    },
    type: {
        type: String
    },
    mpsOrderType: {
        type: String,
        enum: ["SKOrder", "Non-SKOrder"],
        default: "SKOrder"
    },
    date: {
        type: Date,
        default: Date.now
    },
    action: {
        type: String
    },
    isThirdpartySellerOrder: {
        type: Boolean
    },
    sellerInfo:{
        name: {type: String},
        id: {type: String},
        type: {type : String},
        gstNumber: {type : String},
        address: {
            line1: {type: String},
            line2: {type: String},
            landmark: {type: String },
            state: {type: String },
            subDistrict: {type: String},
            district: {type: String},
            city: {type: String },
            pincode: { type: Number}
        },
        shippingPreference: {
            type: String // enum: ['DIRECT', 'SK']
        }
    },
    sellerCharges: {type: Number},
    fulfilledBy: {
        type: String
    },
    franchise: {
        id: { type: String },
        name: { type: String },
        mobile: { type: String },
        address: {
            door_no: { type: String },
            street: { type: String },
            full_address: { type: String },
            landmark: { type: String }
        },
        parent: { type: String },
        type: { type: String },
        state: { type: String },
        district: { type: String },
        city: { type: String },
        town: { type: String },
        pincode: { type: String },
        accountId: { type: String },
        code: { type: String },
        tin_vat_no: { type: String },
        gstNo: { type: String },
        createdAt: { type: Date }
    },
    customer: {
        id: { type: String },
        name: { type: String },
        mobile: { type: String }
    },
    shipmentDueDate: { type: Date},
    shippingAddress: {
        line1: { type: String },
        line2: { type: String },
        landmark: { type: String },
        district: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: Number }
    },
    billingAddress: {
        line1: { type: String },
        line2: { type: String },
        landmark: { type: String },
        district: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: Number }
    },
    warehouseAddress: {
        name: { type: String },
        companyName: { type: String },
        doorNo: { type: String },
        street: { type: String },
        landmark: { type: String },
        city: { type: String },
        district: { type: String },
        state: { type: String },
        pincode: { type: String },
        mobile: { type: String }
    },
    warehouseDetails: {
        gstno: { type: String },
        cinno: { type: String },
        serviceTax: { type: String },
        vat: { type: String }
    },
    invoices: [{
        invoiceNo: { type: String },
        invoiceDocument: {type: String},
        seggregationBatchId: { type: String },
        trayNo: { type: String },
        status: { type: String, default: "New" },
        motherBoxNo: { type: String },
        hopCount: { type: String },
        boxId: { type: String },
        performaInvoiceNo: { type: String },
        logisticsChargesIncluded: { type: Boolean, default: false },
        commissionReleased: {
            type: String,
            enum: ["Pending", "Ready", "Released", "InProcess", "returnDebitInProcess", "returnDebited"],
            default: "Pending"
        },
        amount: { type: Number },
        isCulled: { type: Boolean, default: false },
        performaInvoiceNo: { type: String },
        isRTO: { type: Boolean, default: false },
        processRefund: { type: Boolean, default: false },
        isCustomerReturn: { type: Boolean, default: false },
        shippedOn: { type: Date},
        deliveredOn: { type: Date},
        paymentSettled: {type: Boolean},
        paymentSettledOn: {type: Date},
        returnedOn: {type: Date},
        shipmentType: { type: String ,enum: ["courier", "selfShipment"], default:"courier"},
        payload: {type: Object},

        refundStatus: {
            type: String,
            enum: ["Pending", "Released", "InProcess"]
        }

    }],
    deals: [{
        id: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        isShowCaseDeal: { type: Boolean }
    }],
    subOrdersCreated: {
        type: Boolean,
        default: false
    },
    boxConsumable: {
        inventoryId: { type: String }
    },
    deleted: {
        type: Boolean,
        default: false
    },
    isDuplicateOf: {
        type: String
    },
    remarks: {
        type: String
    },
    commission: {
        to: { type: String },
        from: { type: String },
        amount: { type: Number },
        paid: { type: Boolean, default: false }
    },
    returns: [{
        type: String
    }],
    batchEnabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date
    },
    cancelledDate: {type: Date},
    lastUpdated: {
        type: Date
    },
    createdBy: {
        type: String
    },
    modifiedBy: {
        type: String
    },
    isImported: {
        type: Boolean
    },
    inwardDate: {
        type: Date
    },
    mpsOrderId: {
        type: String
    },
    from: { //MPS warehouse 
        type: String
    },
    placedBy: {
        type: String
    },
    payoutStage: { type: String },
    payoutHappened: { type: Boolean, default: false },
    skApp: { default: true, type: Boolean },
    mpsPaymentStatus: {
        type: String,
        enum: ["Paid", "Cash On Delivery", "Unpaid"]
    },
    mpsOrderType: {
        type: String,
        enum: ["SKOrder", "Non-SKOrder"]
    },
    commission: {
        logistics: { type: Number },
        skCommission: { type: Number },
        physicalCommission: { type: Number },//this is to accomodate any physical commission
        imeiCommission: { type: Number },//this is to accomodate any imei commission
        orderPassThrough: { type: Number }
    },
    descriptiveCommission: {
        logistics: {
            paid: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        },
        skCommission: {
            paid: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        },
        physicalCommission: {
            paid: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        },//this is to accomodate any physical commission
        imeiCommission: {
            paid: { type: Boolean, default: false },
            amount: { type: Number, default: 0 }
        },//this is to accomodate any imei commission
        orderPassThrough: { type: Number }
    },
    commissionUpdated: { // MPs 
        type: Boolean,
        default: false
    },
    mpsShipped: {
        type: Boolean,
        default: false
    },
    actualOrderType: {
        type: String
    },
    partnerOrderDetails: {
        date: { type: String },
        shippingCharges: { type: Number, default: 0 },
        paymentType: { type: String, enum: ["COD", "PREPAID"] },
        otherCharges: { type: Number, default: 0 }
    },
    actualOrderId: {
        type: String
    },
    needOrderIdCorrection: {
        type: Boolean,
        default: false
    },
    trackingId: {
        type: String
    },
    logs: [{
        createdAt: { type: Date },
        status: { type: String },
        remarks: { type: String }
    }],
    releaseOnHoldAmount: {
        type: Boolean,
        default: false
    },
    isExclusiveType: {
        type: Boolean
    },
    exclusivetype: [{
        _id: { type: String },
        name: { type: String }
    }],
    orderAmountRefund:{
        type: Boolean,
        default: false
    },
    orderAmountRefundStatus: {
        type: String,
        enum: ["Pending", "Ready","InProcess","Released"],
        default: "Pending"
    },
    ratingInfo:{
        rating: { type: Number },
        ratingComment : { type: String },
        ratingOn: { type: Date },
        ratingReason : { type: String },
        ratingId : { type: String }
    },
    isSkWarehouse: { type: Boolean, default: true },
    isDirectShipment: { type: Boolean },
    sellerShippingInfo:{
        courierId: { type: String },
        awbNumber: { type: String },
        name: { type: String },
        weight: { type: String },
        assetId: { type: String },
        vehicle: { type: String },
        contact: { type: String },
        shipmentType: { type: String },
        remarks: { type: String },
        shippedOn: { type: Date }

    },
    poId: {type: String}, // For an order auto po is created only when its a non-sk order ex- walmart order;
    partnerWmfInfo:{
        orderId: {type: String},
        invoiceNo: {type: String},
        orderAmount: {type: Number},
        shippingCharge: {type: Number}
    }
        
};
