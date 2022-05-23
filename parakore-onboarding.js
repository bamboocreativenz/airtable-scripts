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

const quarterQuery = await quarterTable.selectRecordsAsync()

const quarter = quarterQuery.records.find((r) => {
    return new Date(r.getCellValue('From')) >= firstDay && new Date(r.getCellValue('To')) <= lastDay
})

console.log(quarter)

// Onboarding Record
const onboardingQuery = await onboardingTable.selectRecordsAsync()
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
    const ropuQuery = await ropuTable.selectRecordsAsync()

    const ropuRecord = ropuQuery.records.find((r) => {
        if (r.getCellValue('Rōpū Email') != null) {
            return r.getCellValue('Rōpū Email').trim() == record.getCellValue('Rōpū Email').trim() && r.getCellValue('Name').trim() == record.getCellValue('Rōpū Name').trim()
        }
    })

    if (ropuRecord != undefined && ropuRecord.id != undefined || ropuRecord != undefined && ropuRecord.id != null) {
        updateRopu(ropuRecord.id)
    } else {
        createRopu()
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
        "General Waste Bin Volume": record.getCellValue('General Waste Volume'),
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
        "Metrics": [{id: 'reczaOiu8zwtxeBYZ'}]
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
    .catch( err => {
        console.error(err)
        throw new Error(err)
    })
}

/**
 * @param {string} id
 */
async function updateRopu(id){
    const ropuQuery = await ropuTable.selectRecordsAsync()
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
        "General Waste Bin Volume": record.getCellValue('General Waste Volume'),
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
        "Metrics": [{id: 'reczaOiu8zwtxeBYZ'}]
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
    .catch( err => {
        console.error(err)
        throw new Error(err)
    })
}
