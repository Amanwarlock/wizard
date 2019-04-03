
/* 

serviceArea: [{
        level: { type: String, enum: ["sdt", "RMF", "RF", "category"] },
        subType: { type: String }, WMF,RMF,RF,DRF,ERF,SF,SRMF,SRF
        state: { type: String },
        district: { type: String },
        town: { type: String },
        franchise: {type: String}, // All RMF , All RF
        categoryIds: [{
            type: String
        }],
    }],
*/


var fcList = [{
    whId: "WMF0",
    fcConfig: [{
        level: 'sdt',
        state: 'All States',
        district: 'All Districts',
        town: 'All Towns',
        franchise: ['All RMF']
    }]
}, {
    whId: "WMF1",
    fcConfig: [{
        level: 'sdt',
        state: 'Karnataka',
        district: 'Bidar',
        town: 'Bidar',
        franchise: ['All RMF']
    }]
}, {
    whId: "WMF2",
    fcConfig: [{
        level: 'sdt',
        state: 'New Delhi',
        district: 'Delhi',
        town: 'Delhi',
        franchise: ['All RMF'],
        subType: 'RMF'
    }, {
        level: 'RMF',
        state: 'New Delhi',
        district: 'Delhi',
        town: 'Delhi',
        franchise: ['F10000']
    }]
}]


function fcPrioritySelection(fcList, franchise) {

    var masterList = [];

    var priorityList = [];

    var prioritOne = byFranchiseGroup(fcList, franchise);

    var priorityTwo = bySDTAndSubType(fcList, franchise);


    priorityList = priorityList.concat(prioritOne);
    priorityList = priorityList.concat(priorityTwo);

    var fcIdList = [];

    // make it unique;
    priorityList.map((fc, i) => {
        if (fcIdList.indexOf(fc.whId) < 0) {
            fcIdList.push(fc.whId);
            masterList.push(fc);
        }
    });

    return masterList;

}

function byFranchiseGroup(fcList, franchise) {
    var masterList = [];

    outer:
    for (let i = 0; i < fcList.length; i++) {

        let fc = fcList[i];
        fc.selectedConfig = fc && fc.selectedConfig && fc.selectedConfig.length ? fc.selectedConfig : [];

        inner:
        for (let j = 0; j < fc.fcConfig.length; j++) {

            let config = fc.fcConfig[j];

            if (config.level === franchise.franchise_type && Array.isArray(config.franchise) && config.franchise.indexOf(franchise._id) > -1) {

                fc.selectedConfig.push(config);
                masterList.push(fc);
                break inner;

            } else if (config.level === franchise.franchise_type && config.franchise === franchise._id) {

                fc.selectedConfig.push(config);
                masterList.push(fc);
                break inner;
            } // Check for RMF Group;
            else if (config.level === 'RMF' && franchise.franchise_type === 'RF' && Array.isArray(config.franchise) && config.franchise.indexOf(franchise.linked_rmf) > -1) {
                fc.selectedConfig.push(config);
                masterList.push(fc);
                break inner;
            } else if (config.level === 'RMF' && franchise.franchise_type === 'RF' && config.franchise === franchise.linked_rmf) {
                fc.selectedConfig.push(config);
                masterList.push(fc);
                break inner;
            }
        }
    }

    // In the obtained list of same order, again sort and give preference to FC in the retailer state;
    masterList = sortByFcAndRetailerState(masterList, franchise);

    return masterList;
}



function bySDTAndSubType(fcList, franchise) {
    var masterList = [];

    var withSubType = {
        uptoTowns: [], // Matching upto State  district and town;
        uptoSD: [], // Matching upto State and districts
        onlyState: [],  // Matching only till state;
        any: []
    }

    var withoutSubType = {
        uptoTowns: [], // Matching upto State  district and town;
        uptoSD: [], // Matching upto State and districts
        onlyState: [],  // Matching only till state;
        any: []
    }


    outer:
    for (let i = 0; i < fcList.length; i++) {
        let fc = fcList[i];
        fc.selectedConfig = fc && fc.selectedConfig && fc.selectedConfig.length ? fc.selectedConfig : [];

        inner:
        for (let j = 0; j < fc.fcConfig.length; j++) {
            let config = fc.fcConfig[j];

            if (config.level === 'sdt' && Array.isArray(config.subType) && config.subType.indexOf(franchise.franchise_sub_type) > -1) {
                push('TILL-TOWN', franchise, fc, config, withSubType.uptoTowns);
                push('TILL-DISTRICT', franchise, fc, config, withSubType.uptoSD);
                push('TILL-STATE', franchise, fc, config, withSubType.onlyState);
                push('ANY', franchise, fc, config, withSubType.any);
                // break inner;
            } else if (config.level === 'sdt' && config.subType === franchise.franchise_sub_type) {
                push('TILL-TOWN', franchise, fc, config, withSubType.uptoTowns);
                push('TILL-DISTRICT', franchise, fc, config, withSubType.uptoSD);
                push('TILL-STATE', franchise, fc, config, withSubType.onlyState);
                push('ANY', franchise, fc, config, withSubType.any);
                // break inner;
            } else if (config.level === 'sdt') {
                push('TILL-TOWN', franchise, fc, config, withoutSubType.uptoTowns);
                push('TILL-DISTRICT', franchise, fc, config, withoutSubType.uptoSD);
                push('TILL-STATE', franchise, fc, config, withoutSubType.onlyState);
                push('ANY', franchise, fc, config, withoutSubType.any);
                // break
            }

        }
    }

    /* List with same order, give preference to FC belonging to retialer state - IF SAME ORDER PRIORITY ONLY */
    withSubType.uptoTowns = sortByFcAndRetailerState(withSubType.uptoTowns, franchise);
    withSubType.uptoSD = sortByFcAndRetailerState(withSubType.uptoSD, franchise);
    withSubType.onlyState = sortByFcAndRetailerState(withSubType.onlyState, franchise);
    withSubType.any = sortByFcAndRetailerState(withSubType.any, franchise);

    withoutSubType.uptoTowns = sortByFcAndRetailerState(withoutSubType.uptoTowns, franchise);
    withoutSubType.uptoSD = sortByFcAndRetailerState(withoutSubType.uptoSD, franchise);
    withoutSubType.onlyState = sortByFcAndRetailerState(withoutSubType.onlyState, franchise);
    withoutSubType.any = sortByFcAndRetailerState(withoutSubType.any, franchise);

    /* Concat all results by priority */
    masterList = masterList.concat(withSubType.uptoTowns);// Priority-1
    masterList = masterList.concat(withoutSubType.uptoTowns);// Priority-2
    masterList = masterList.concat(withSubType.uptoSD);// Priority-3
    masterList = masterList.concat(withoutSubType.uptoSD);// Priority-4
    masterList = masterList.concat(withSubType.onlyState);// Priority-5
    masterList = masterList.concat(withoutSubType.onlyState);// Priority-6
    masterList = masterList.concat(withSubType.any);// Priority-7
    masterList = masterList.concat(withoutSubType.any);// Priority-8

    return masterList;
}



function push(option, franchise, fc, fcConfig, list) {
    var _fran = franchise.franchise_type === 'RF' ? 'All RF' : 'All RMF';
    var hasType = (Array.isArray(fcConfig.franchise) && fcConfig.franchise.indexOf(_fran) > -1) || fcConfig.franchise === _fran ? true : false;

    switch (option) {
        case 'TILL-TOWN': {
            if (fcConfig.level.toLocaleUpperCase() === 'SDT' && fcConfig.state.toLocaleUpperCase() === franchise.state.toLocaleUpperCase() && fcConfig.district.toLocaleUpperCase() === franchise.district.toLocaleUpperCase() && fcConfig.town.toLocaleUpperCase() === franchise.town.toLocaleUpperCase() && hasType) {
                fc.selectedConfig.push(fcConfig);
                list.push(fc);
                return true;
            }
            return false;
        }
        case 'TILL-DISTRICT': {
            if (fcConfig.level.toLocaleUpperCase() === 'SDT' && fcConfig.state.toLocaleUpperCase() === franchise.state.toLocaleUpperCase() && fcConfig.district.toLocaleUpperCase() === franchise.district.toLocaleUpperCase() && fcConfig.town.toLocaleUpperCase() === 'ALL TOWNS' && hasType) {
                fc.selectedConfig.push(fcConfig);
                list.push(fc);
                return true;
            }
            return false;
        }
        case 'TILL-STATE': {
            if (fcConfig.level.toLocaleUpperCase() === 'SDT' && fcConfig.state.toLocaleUpperCase() === franchise.state.toLocaleUpperCase() && fcConfig.district.toLocaleUpperCase() === 'All Districts'.toLocaleUpperCase() && hasType) {
                fc.selectedConfig.push(fcConfig);
                list.push(fc);
                return true;
            }
            return false;
        }
        case 'ANY': {
            if (fcConfig.level.toLocaleUpperCase() === 'SDT' && fcConfig.state.toLocaleUpperCase() === 'ALL STATES' && hasType) {
                fc.selectedConfig.push(fcConfig);
                list.push(fc);
                return true;
            }
            return false;
        }
    }
}


// In the obtained list of same order, again sort and give preference to FC in the retailer state;
function sortByFcAndRetailerState(fcList, franchise) {
    var masterList = [];

    for (var i = 0; i < fcList.length; i++) {
        let fc = fcList[i];
        if (fc.state === franchise.state) {
            masterList.push(fc);
        }
    }

    masterList = masterList.concat(fcList);

    return masterList;
}


var franchise = {
    franchise_type: 'RF',
    linked_rmf: "F100002",
    franchise_sub_type: "RF",
    state: 'Karnataka',
    district: 'Mandya',
    town: 'Mandya',
    _id: "F10000"
}



var fcListTest = [{
    whId: "WMF0",
    state: 'Maharashtra',
    fcConfig: [{
        level: 'sdt',
        state: 'Karnataka',
        district: 'All Districts',
        town: 'All Towns',
        franchise: 'All RF'
    }]
},
{
    whId: "WMF1",
    state: 'Tamil Nadu',
    fcConfig: [{
        level: 'RF',
        state: 'Karnataka',
        district: 'All Districts',
        town: 'All Towns',
        franchise: 'F10000',
        subType: ''
    }]
}
]

var result = fcPrioritySelection(fcListTest, franchise);

console.log("Result ---------", result);


/*

serviceArea: [{
        level: { type: String, enum: ["sdt", "RMF", "RF", "category"] },
        subType: { type: String }, WMF,RMF,RF,DRF,ERF,SF,SRMF,SRF
        state: { type: String },
        district: { type: String },
        town: { type: String },
        franchise: {type: String}, // All RMF , All RF
        categoryIds: [{
            type: String
        }],
    }],

*/