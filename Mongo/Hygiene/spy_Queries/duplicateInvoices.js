
/*
OR20190131217983
IN181088189 - BR20190201182B - PR171796 - cancelled At=2019-02-01T20:34:33.837+05:30
IN181088202 - BR20190201206B - PR172393 - Release = 2019-02-01T20:36:09.469+05:30
*/

db.omsinvoices.aggregate([
    {
        $match: {
            status: { $ne: "Cancelled" }
        }
    }, {
        $project: {
            _id: 1,
            status: 1,
            orderId: 1,
            batchId: 1,
            createdAt: 1,
            whId: 1,
            "deals._id": 1
        }
    },
    { $unwind: "$deals" },
    {
        $group: {
            _id: { subOrderId: "$deals._id", status: "$status" },
            data: { $push: "$$ROOT" },
            count: { $sum: 1 }
        }
    },
    {
        $project: {
            _id: 1,
            count: 1,
            //data: 1,
            dups: {
                $reduce: {
                    input: "$data",
                    initialValue: [],
                    in: {
                        $concatArrays: ["$$value", {
                            $cond: {
                                if: { "$lt": [{ $indexOfArray: ["$$value", "$$this._id"] }, 0] },
                                then: ["$$this._id"],
                                else: []
                            }
                        }]
                    }
                }
            }
        }
    },
    {
        $project: {
            _id: 1,
            dups: 1,
            dupsCount: { $size: "$dups" },
            data: 1
        }
    },
    {
        $match: {
            dupsCount: { $gt: 1 }
        }
    },
    {
        $lookup: {
            from: "stockledgers",
            foreignField: "reference.subOrderId",
            localField: "_id.subOrderId",
            as: "ledgers"
        }
    },
    {
        $project: {
            _id: 1,
            dups: 1,
            dupsCount: 1,
            //data: 1,
            //ledgers: 1,
            cancencelledInvoice: {
                $reduce: {
                    input: {
                        $filter: {
                            input: "$ledgers",
                            cond: { $eq: ["$$this.referenceType", "Invoice Cancellation"] }
                        }
                    },
                    initialValue: [],
                    in: {
                        $concatArrays: ["$$value", {
                            $cond: {
                                if: { $lt: [{ $indexOfArray: ["$$value", "$$this.reference.invoiceNo"] }, 0] },
                                then: ["$$this.reference.invoiceNo"],
                                else: []
                            }
                        }]
                    }
                }
            },
            isOldInvoice: {
                $cond: {
                    if: { $lte: [{ $size: "$ledgers" }, 0] },
                    then: true,
                    else: false
                }
            },
        }
    }

], { allowDiskUse: true })