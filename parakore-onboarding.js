// @ts-nocheck
const { RecordId } = input.config()

const onboardingTable = base.getTable("Onboarding")
const ropuTable = base.getTable("Ropu")
const wasteTable = base.getTable("Waste Log")
const hazardsTable = base.getTable("Hazards")
const peopleTable = base.getTable("People")
const iwiTable = base.getTable("Iwi/Hapu")
const quarterTable = base.getTable('Quarterly Reports')

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

//console.log(ropuTable.fields.find(f => f.name == 'Type'))
//console.log(onboardingTable.fields.find(f => f.name == 'Ropu Type'))

/**
 * Map the Ropu type from the onboarding table to the Ropu Table
 * Use something like `console.log(ropuTable.fields.find(f => f.name == 'Type'))` to get the option ids for a select field
 * @param {string} onboarding table ropu type field select option id
 * @return {string} ropu table type field select option id
*/
function getRopuTypeOptionId(onboardingRopuTypeOptionId){
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
        case "selJnZ9GTAeKpzngO":
            return "selCsKOYQIrTC1EAp"
        // Not for profit < 500
        case "selBb04ag6upbVs61":
            return "selDmUWtQ1sSPgziu"
        // Not for profit > 500
        case "selXEyRtGoAhfWcW0":
            return "selDmUWtQ1sSPgziu"
        default:
            return null
    }
}

/**
 * Get Select Id for Ropu Table Bin Volume field 
 * @param {string} name
 * @return {string} select option id
*/
function getRopuBinVolumeOptionId(onboardingBinVolumeOptionId){
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

async function createRopu(){
    return await ropuTable.createRecordAsync({
        Name: record.getCellValue('Rōpū Name'),
        "Physical Adress": record.getCellValue('Rōpū Address'),
        "Rōpū Phone": record.getCellValue('Rōpū Phone') && record.getCellValue('Rōpū Phone').trim(),
        "Rōpū Email": record.getCellValue('Rōpū Email') && record.getCellValue('Rōpū Email').trim(),
        "Profile Image": record.getCellValue('Rōpū Photo'),
        "Rohe": [{ id:record.getCellValue('Rohe')[0].id }],
        "General Waste Bin Volume": {id: getRopuBinVolumeOptionId(record.getCellValue('fldZd8B9kNChlz8FI').id)},
        Type: {id: getRopuTypeOptionId(record.getCellValue('fld62ZWMrxbt7aNzJ').id)},
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
        "Preferred Comms": record.getCellValue("Best Comms")[0],
        "Signed Up": true,
        "Date Signed": record.getCellValue("Date Created"),
        Users: record.getCellValue("Kaiārahi"),
        "Regional Contacts": record.getCellValue("Council"),
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

/**
 * @param {string} id
 */
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
        "General Waste Bin Volume": {id: getRopuBinVolumeOptionId(record.getCellValue('fldZd8B9kNChlz8FI').id)},
        Type: {id: getRopuTypeOptionId(record.getCellValue('fld62ZWMrxbt7aNzJ').id)},
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
        "Preferred Comms": record.getCellValue("Best Comms")[0],
        "Signed Up": true,
        "Date Signed": record.getCellValue("Date Created"),
        Users: record.getCellValue("Kaiārahi"),
        "Regional Contacts": 
            ropuRecord.getCellValue('Regional Contacts') != null
            ? record.getCellValue('Council') != null
            ? [{id:record.getCellValue('Council').concat(ropuRecord.getCellValue('Regional Contacts'))[0].id}]
            : ropuRecord.getCellValue('Regional Contacts')
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
