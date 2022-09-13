const { RecordId } = input.config()

const onboardingTable = base.getTable("tbljmUaXGCRN4ks5Q")
const ropuTable = base.getTable("tblTtWjivzuMNRopv")
const wasteTable = base.getTable("tbllT1hPEBfbcxP8P")
const hazardsTable = base.getTable("tblBdiTMr1g2uEaJr")
const peopleTable = base.getTable("tblNesXcVSJlujjtZ")
const iwiTable = base.getTable("tbla2eFHmP9505HEI")
const quarterTable = base.getTable('tbl89DzUOFQZ0yXwD')

// Calculate current Quarter
const date = new Date(), y = date.getFullYear(), m = date.getMonth() + 1;
const firstDay = new Date(y, (Math.ceil(m/4)*3)-3, 1);
const lastDay = new Date(y, (Math.ceil(m/4)*3), 0);

const quarterQuery = await quarterTable.selectRecordsAsync({fields: quarterTable.fields})

const quarter = quarterQuery.records.find((r) => {
    return new Date(r.getCellValue('From')) >= firstDay && new Date(r.getCellValue('To')) <= lastDay
})

// Onboarding Record
const onboardingQuery = await onboardingTable.selectRecordsAsync({fields: onboardingTable.fields})
const record = onboardingQuery.getRecord(RecordId)

const missingRecordsMDList = 'Missing:'.concat(
    record.getCellValue('Rōpū Name') == null ? '\n - Rōpū Name' : '',
    record.getCellValue('Rōpū Email') == null ? '\n - Rōpū Email' : '',
    record.getCellValue('Rohe') == null ? '\n - Rohe' : '',
    record.getCellValue('Kaiārahi') == null ? '\n - Kaiārahi' : ''
)

/* -------------------------------------------------------------------------- */
/*                                 Driver Code                                */
/* -------------------------------------------------------------------------- */

if (record.getCellValue('Rōpū Email') != null && record.getCellValue('Rohe') != null && record.getCellValue('Kaiārahi') != null) {
    updateOrCreate()
    onboardingTable.updateRecordAsync(record.id,{"Missing Data Reason": ''})
} else {
    onboardingTable.updateRecordAsync(RecordId, {Status: {name: 'Missing Data'}, "Missing Data Reason": missingRecordsMDList})
}

async function updateOrCreate(){
    const ropuQuery = await ropuTable.selectRecordsAsync({fields: ropuTable.fields})

    const ropuRecord = ropuQuery.records.find((r) => {
        if (r.getCellValue('Rōpū Email') != null) {
            return r.getCellValue('Rōpū Email').trim() == record.getCellValue('Rōpū Email').trim() && r.getCellValue('Name').trim() == record.getCellValue('Rōpū Name').trim()
        }
    })

    if (ropuRecord != undefined && ropuRecord.id != undefined || ropuRecord != undefined && ropuRecord.id != null) {
        return await updateRopu(ropuRecord.id)
        .catch(async err => {
            console.error(err.message)
        })
    } else {
        return await createRopu()
        .catch(async err => {
            console.error(err.message)
        })
    }
}

/* -------------------------------------------------------------------------- */
/*                       Select Options Mapping Switches                      */
/* -------------------------------------------------------------------------- */

// Use console logs like the below to get the ids for the fields you looking at
// console.log(ropuTable.fields.find(f => f.name == 'Preferred Comms'))
// console.log(onboardingTable.fields.find(f => f.name == 'Best Comms'))

/**
 * Map the Ropu type from the onboarding table to the Ropu Table
 * @param {string} onboardingRopuTypeOptionId field select option id
 * @return {string} ropu table type field select option id
*/
function mapRopuTypeOptionId(onboardingRopuTypeOptionId){
    switch (onboardingRopuTypeOptionId){
        // Marae
        case "selBWnpBpPolJAVMo":
            return "selrBmdLq00lkOjWc"
        // Kura
        case "seldxeFsMfoQK5g0t":
            return "seltTF0HrLKYdTkBQ"
        // Pakihi
        case "selHDAf1yAourRJA2":
            return "selCFUGtye2Z3mCrU"
        // Kōhungahunga
        case "selp0I3jvOaF8kn0P":
            return "selcSQYLVQ1ixEVt3"
        // Whānau
        case "selZ3zkt8tsRGNMQw":
            return "selyzuAUqTCIFZ5dP"
        // Hāpori
        case "selOLBFkT28qMG7I7":
            return "selCsKOYQIrTC1EAp"
        // Not for profit < 500
        case "selBb04ag6upbVs61":
            return "selDmUWtQ1sSPgziu"
        // Not for profit > 500
        case "selXEyRtGoAhfWcW0":
            return "selDmUWtQ1sSPgziu"
        // Eco Church
        case "selJnZ9GTAeKpzngO":
            return "selHzDkmXHNEhmiUX"
        default:
            return ''
    }
}

/**
 * Map the Single Select Option Id for the General Waste Bin Volume field
 * @param {string} onboardingBinVolumeOptionId field select option id
 * @return {string} ropu preferred bin volume select option id
*/
function mapRopuBinVolumeOptionId(onboardingBinVolumeOptionId){
    switch (onboardingBinVolumeOptionId){
        // Food Compost Bin (25L)
        case "sel0BhWBe7HtplUCg":
            return "selQkKc1UG5qtCNtR"
        // Crate (60ltr)
        case "selhgvmn0jj7KRaST":
            return "seliijfShodLH1uQD"
        // Standard Black Bag (65L)
        case "selsOd0k7qiDdhheX":
            return "selWLvjN7H9FIbINx"
        // Big Ben Black Bag (80L)
        case "selItgB3Ai4xJLru8":
            return "selJXZWCD2UtALw0x"
        // Small Wheelie Bin (140L)
        case "sel5jW37bJy6ewlKe":
            return "sel1kJKDTWTfNW9H7"
        // Green Bin (240L)
        case "selidrwfKS2yy74GF":
            return "selcYqT9Wrzju10Pl"
        // Small Skip (1000L)
        case "sellHJ1gBzweAptNf":
            return "selr7d4VvmpP5LKmB"
        // Standard Skip (2000L)
        case "selK34LrLkFZ2c0zX":
            return "selhPKHeXA69F9FDv"
        default:
            return "selcYqT9Wrzju10Pl"
    }
}

/**
 * Map the Single Select Option Id for the Preferred Comms field
 * @param {string} onboardingCommsOptionId field select option id
 * @return {string} ropu preferred comms select option id
*/
function mapRopuCommsOptionId(onboardingCommsOptionId){
    switch (onboardingCommsOptionId){
        // Phone
        case "selz6UuuDqwRHJP5v":
            return "selxYmmhF2tvbL2Uk"
        // Text
        case "seliqn5njyUQmISCg":
            return "selFk4YncfKzGGxR9"
        // Email
        case "selPfK8o7GTvzOA29":
            return "selE3xNl7gu1hF0PM"
        // Visit
        case "selPbx7EnlArY8QrF":
            return "selW67ne8q3ZZ7uY2"
        default:
            return "selE3xNl7gu1hF0PM"
    }
}

/* -------------------------------------------------------------------------- */
/*                       Create or Update Ropu Functions                      */
/* -------------------------------------------------------------------------- */


async function createRopu(){
    return await ropuTable.createRecordAsync({
        Name: record.getCellValue('Rōpū Name'),
        "Physical Adress": record.getCellValue('Rōpū Address'),
        "Rōpū Phone": record.getCellValue('Rōpū Phone') && record.getCellValue('Rōpū Phone').trim(),
        "Rōpū Email": record.getCellValue('Rōpū Email') && record.getCellValue('Rōpū Email').trim(),
        "Profile Image": record.getCellValue('Rōpū Photo'),
        "Rohe": [{ id:record.getCellValue('Rohe')[0].id }],
        "General Waste Bin Volume": {id: mapRopuBinVolumeOptionId(record.getCellValue('fldZd8B9kNChlz8FI').id)},
        Type: {id: mapRopuTypeOptionId(record.getCellValue('fld62ZWMrxbt7aNzJ').id)},
        "General Recycling Bin Volume": record.getCellValue('General Recycling Volume'),
        "Glass Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Plastic Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Garden waste Bin Volume": record.getCellValue('Organic/Garden Waste Volume'),
        "Food Composting Bin Volume": record.getCellValue('Food Waste Volume'),
        "Cans Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Dirty Paper Composting Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Clean Paper Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Cardboard Recycling Bin Volume": record.getCellValue("Other Recycling Volume"),
        "Arrival Process": record.getCellValue("Arrival Process"),
        "Support Now": record.getCellValue('Support Now'),
        "Support Ongoing": record.getCellValue('Support Ongoing'),
        "fldQgbr2vOUMIIWLm": {id: mapRopuCommsOptionId(record.getCellValue("fldQPHnd2f6uBTR5r").id)},
        "Signed Up": true,
        "Date Signed": record.getCellValue("Date Created"),
        Users: record.getCellValue("Kaiārahi"),
        "Regional Partners": record.getCellValue("Council"),
        Onboarding: [{id: RecordId}],
        Tags: record.getCellValue('Tags'),
        "PK Metrics": [{id: 'reczaOiu8zwtxeBYZ'}]
    })
    .then(async ropuId => {
        if (record.getCellValue("Iwi Affiliation").name == "Yes") {
            await ropuTable.updateRecordAsync(ropuId, {
                Iwi: record.getCellValue("Iwi")
            })
        } 
        if (record.getCellValue("Iwi Affiliation").name == "New Iwi"){
            await iwiTable.createRecordAsync({
                Name: record.getCellValue("New Iwi"),
                "Rōpū": [{id: ropuId}]
            }) 
        }
        return ropuId
    }, async err => {
        await onboardingTable.updateRecordAsync(RecordId,{ Status: { name: 'Missing Data' },"Missing Data Reason": "OTHER ERROR - CALL DAN\n" + err.message })
        throw new Error(err.message)
    })
    .then(async ropuId => {
        await wasteTable.createRecordAsync({
            "Number of General Waste Bins": record.getCellValue('General Waste Last Month'),
            "Number of General Recycling Bins": record.getCellValue('General Recycling Last Month'),
            "Number of Garden Waste Composting bins": record.getCellValue('Organic/Garden Waste Last Month'),
            // TODO "": record.getCellValue('Other Recycling Last Month'),
            "Number of Food Composting bins": record.getCellValue('Food Waste Last Month'),
            Users: record.getCellValue("Kaiārahi"),
            Ropu: [{id: ropuId}],
            Baseline: true,
            Quarter: quarter ? [{id: quarter.id}] : undefined
        })
        return ropuId
    })
    .then(async ropuId => {
        await hazardsTable.createRecordAsync({
            "Date Identified": record.getCellValue("Date Created"),
            "Details": record.getCellValue("Hazards"),
            "Name": "Initial Site Hazards",
            Ropu: [{id: ropuId}]
        })
        return ropuId
    })
    .then(async ropuId => {
        await peopleTable.createRecordAsync({
            Name: record.getCellValue("Champion Name"),
            "Email - Primary": record.getCellValue("Champion Email") && record.getCellValue("Champion Email").trim(),
            Phone: record.getCellValue("Champion Phone") && record.getCellValue("Champion Phone").trim(),
            "Member of Rōpū": [{id: ropuId}],
            Champion: true
        })
    })
}

async function updateRopu(id){
    const ropuQuery = await ropuTable.selectRecordsAsync({fields: ropuTable.fields})
    const ropuRecord = ropuQuery.getRecord(id)

    return await ropuTable.updateRecordAsync(id, {
        Name: record.getCellValue('Rōpū Name'),
        "Physical Adress": record.getCellValue('Rōpū Address'),
        "Rōpū Phone": record.getCellValue('Rōpū Phone') && record.getCellValue('Rōpū Phone').trim(),
        "Profile Image": 
            ropuRecord.getCellValue('Profile Image') != null
            ? record.getCellValue('Rōpū Photo') != null
            ? ropuRecord.getCellValue('Profile Image').map(p => ({url: p.url})).concat(record.getCellValue('Rōpū Photo').map(p => ({url: p.url})))
            : ropuRecord.getCellValue('Profile Image')
            : record.getCellValue('Rōpū Photo'),
        // We need to concat the new value on the old in case one doesn't exist - than make sure we only return 1 as the field is meant to only have one rohe
        "Rohe": record.getCellValue('Rohe'),
        "General Waste Bin Volume": {id: mapRopuBinVolumeOptionId(record.getCellValue('fldZd8B9kNChlz8FI').id)},
        Type: {id: mapRopuTypeOptionId(record.getCellValue('fld62ZWMrxbt7aNzJ').id)},
        "General Recycling Bin Volume": record.getCellValue('General Recycling Volume'),
        "Glass Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Plastic Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Garden waste Bin Volume": record.getCellValue('Organic/Garden Waste Volume'),
        "Food Composting Bin Volume": record.getCellValue('Food Waste Volume'),
        "Cans Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Dirty Paper Composting Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Clean Paper Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Cardboard Recycling Bin Volume": record.getCellValue("Other Recycling Volume"),
        "Arrival Process": record.getCellValue("Arrival Process"),
        "Support Now": record.getCellValue('Support Now'),
        "Support Ongoing": record.getCellValue('Support Ongoing'),
        "fldQgbr2vOUMIIWLm": {id: mapRopuCommsOptionId(record.getCellValue("fldQPHnd2f6uBTR5r").id)},
        "Signed Up": true,
        "Date Signed": record.getCellValue("Date Created"),
        Users: record.getCellValue("Kaiārahi"),
        "Regional Partners": 
            ropuRecord.getCellValue("Regional Partners") != null
            ? record.getCellValue('Council') != null
            ? [{id:record.getCellValue('Council').concat(ropuRecord.getCellValue("Regional Partners"))[0].id}]
            : ropuRecord.getCellValue("Regional Partners")
            : record.getCellValue('Council'),
        Onboarding: [{id: RecordId}],
        Tags: record.getCellValue('Tags'),
        "PK Metrics": [{id: 'reczaOiu8zwtxeBYZ'}]
    })
    .then(async () => {
        if (record.getCellValue("Iwi Affiliation").name == "Yes") {
            await ropuTable.updateRecordAsync(id, {
                Iwi: record.getCellValue("Iwi")
            })
        } 
        if (record.getCellValue("Iwi Affiliation").name == "New Iwi"){
            await iwiTable.createRecordAsync({
                Name: record.getCellValue("New Iwi"),
                "Rōpū": [{id}]
            }) 
        }
    }, async err => {
        await onboardingTable.updateRecordAsync(RecordId,{ Status: { name: 'Missing Data' },"Missing Data Reason": "OTHER ERROR - CALL DAN\n" + err.message })
        throw new Error(err.message)
    })
    .then(async () => {
        await wasteTable.createRecordAsync({
            "Number of General Waste Bins": record.getCellValue('General Waste Last Month'),
            "Number of General Recycling Bins": record.getCellValue('General Recycling Last Month'),
            "Number of Garden Waste Composting bins": record.getCellValue('Organic/Garden Waste Last Month'),
            // TODO "": record.getCellValue('Other Recycling Last Month'),
            "Number of Food Composting bins": record.getCellValue('Food Waste Last Month'),
            Users: record.getCellValue("Kaiārahi"),
            Ropu: [{id}],
            Baseline: true,
            Quarter: quarter ? [{id: quarter.id}] : undefined
        })
    })
    .then(async () => {
        await hazardsTable.createRecordAsync({
            "Date Identified": record.getCellValue('Date Created'),
            "Details": record.getCellValue("Hazards"),
            "Name": "Initial Site Hazards",
            Ropu: [{id}]
        })
    })
    .then(async () => {
        const peopleQuery = await peopleTable.selectRecordsAsync()
        const peopleRecord = peopleQuery.records.find((r) => r.getCellValue('Email - Primary')==record.getCellValue('Champion Email'))

        if (peopleRecord != undefined || peopleRecord != null) {
            await peopleTable.updateRecordAsync(peopleRecord.id, {
                // In case the peopleRecord already has associations with other ropu we need to concat the new id onto the existing
                "Member of Rōpū":
                    // Check if there is an existing value and that the new relationship does not already exist
                    peopleRecord.getCellValue('Member of Rōpū') != null && peopleRecord.getCellValue('Member of Rōpū').find((r => r.id == ropuRecord.id)) == null
                    ? peopleRecord.getCellValue('Member of Rōpū').concat({id: ropuRecord.id, name: ropuRecord.name})
                    : [{id}],
                Champion: true
            })
        } else {
            await peopleTable.createRecordAsync({
                Name: record.getCellValue("Champion Name"),
                "Email - Primary": record.getCellValue("Champion Email") && record.getCellValue("Champion Email").trim(),
                Phone: record.getCellValue("Champion Phone") && record.getCellValue("Champion Phone").trim(),
                "Member of Rōpū": [{id}],
                Champion: true
            })
        }
    })
}
