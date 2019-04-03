
var _ = require("lodash");

var deal = {
    "_id": "D0913046796",
    "active": true,
    "status": "Publish",
    "name": "Bambino Vermicelli Roasted, 500 g",
    "discount": 0,
    "isSkWarehouse": false,
    "allowReserveOrder": false,
    "product": [
        {
            "name": "Bambino Vermicelli Roasted, 500 g",
            "mrp": 50,
            "id": "PR10997",
            "quantity": 1,
            "transferPrice": 41.41,
            "mapping": {
                "productId": "337178",
                "categoryId": "CK00003731",
                "sku": "11916"
            },
            "isSkWarehouse": false,
            "stock": true,
            "warehouse": "WMF3",
            "availableStock": 8814,
            "effectiveStock": 8814,
            "volumetric": [
                {
                    "Quantity": 1,
                    "WebPrice": 41.41
                },
                {
                    "Quantity": 6,
                    "WebPrice": 25.0648
                },
                {
                    "Quantity": 20,
                    "WebPrice": 24.8064
                },
                {
                    "Quantity": 30,
                    "WebPrice": 24.548
                }
            ],
        }
    ],
    "sellers": [
        {
            "name": "StoreKing12",
            "id": "MPS0",
            "shipsIn": "24-48 Hrs",
            "b2bPrice": "46.41",
            "b2bQuantity": 10,
            "b2bMinQuantity": 1,
            "incrementQuantity": 1
        }
    ],
    "transferPrice": 41.41,
    "mrp": 50,
    "b2bPrice": 46.41,
    "b2bDiscount": "",
    "markup": 5,
    "availableStock": 8814,
    "effectiveStock": 8814,
    "whId": "WMF3",
}



function getVolumetricSlabs(requiredQty, deal) {
    if (deal && deal.isSkWarehouse === false) {
        deal.volumetricSlabs = [];
        let steps = [];
        if (!requiredQty) {
            deal.product.map(p => {
                if (p.volumetric && p.volumetric.length) {
                    p.volumetric.map(v => steps.push(v.Quantity));
                }
            });
            steps = _.sortBy(steps);
        } else {
            steps.push(requiredQty);
        }

        for (let i = 0; i < steps.length; i++) {
            let quantity = steps[i];
            let _d = pickMrpByVolume(quantity, deal);
            deal.volumetricSlabs.push({ [quantity]: _d.b2bPrice });
        }

      //  console.log("Slabs : ", deal.volumetricSlabs , deal.b2bPrice);
    }
}


function pickMrpByVolume(quantity, deal) {
    if (deal && deal.isSkWarehouse === false) {

        deal.transferPrice = 0;
        deal.mrp = 0;

        deal.product.map(p => {
            p.volumetric = p.volumetric && p.volumetric.length ? p.volumetric : [];
            let selectiveVolumes = p.volumetric.filter(v => v.Quantity <= quantity ? true : false);
            var selected = null;

            for (let i = 0; i < selectiveVolumes.length; i++) {
                let slab = selectiveVolumes[i];
                if (!selected) {
                    selected = slab;
                }
                if (slab.Quantity > selected.Quantity) {
                    selected = slab;
                }
            }
            if (selected) {
                p.transferPrice = selected.WebPrice;
                deal.transferPrice += p.transferPrice * p.quantity;
                deal.mrp += p.mrp * p.quantity;
            }
        });

        deal.markup = deal.markup === undefined ? 0 : deal.markup;
        var b2bPrice = deal.transferPrice + deal.markup;
        b2bPrice = b2bPrice > deal.mrp ? deal.mrp : b2bPrice;
        deal.b2bDiscount = (b2bPrice / deal.mrp) * 100;

        deal.b2bPrice = parseFloat(b2bPrice.toFixed(2));
        deal.b2bDiscount = parseFloat(deal.b2bDiscount.toFixed(2));

        deal.b2bPrice = ((deal.b2bDiscount / 100) * deal.mrp).toFixed(2)

        if (deal.sellers && deal.sellers.length) {
            deal.sellers[0].b2bPrice = deal.b2bPrice;
        }

        return deal;
    }
}


getVolumetricSlabs(null,deal);