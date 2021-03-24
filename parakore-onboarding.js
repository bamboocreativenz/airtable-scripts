const { Status, RecordId } = input.config()

const onboardingTable = base.getTable("Onboarding")
const ropuTable = base.getTable("Ropu")
const wasteTable = base.getTable("Waste Log")
const hazardsTable = base.getTable("Hazards")
const peopleTable = base.getTable("People")
const iwiTable = base.getTable("Iwi/Hapu")

const query = await onboardingTable.selectRecordsAsync()
const record = query.getRecord(RecordId)

if (Status == 'Approved') {
    createRopu()
}

async function createRopu(){
    return await ropuTable.createRecordAsync({
        Name: record.getCellValue('Rōpū Name'),
        "Physical Adress": record.getCellValue('Rōpū Address'),
        "Rōpū Phone": record.getCellValue('Rōpū Phone'),
        "Rōpū Email": record.getCellValue('Rōpū Email'),
        "Profile Image": record.getCellValue('Rōpū Photo'),
        "Rohe": [{ id:record.getCellValue('Rohe')[0].id }],
        "General Rubbish Bin Volume": record.getCellValue('General Rubbish Volume'),
        "General Recycling Bin Volume": record.getCellValue('General Recycling Volume'),
        "Glass Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Plastic Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Garden waste Bin Volume": record.getCellValue('Organic/Garden Waste Volume'),
        "Food Composting Bin Volume": record.getCellValue('Food Waste Volume'),
        "Cans Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Dirty Paper Composting Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Clean Paper Recycling Bin Volume": record.getCellValue('Other Recycling Volume'),
        "Cardboard Recycling Bin Volume": record.getCellValue("Other Recycling Volume"),
        "Signed MOU": record.getCellValue("Pare Kore Commitment"),
        "Arrival Process": record.getCellValue("Arrival Process"),
        "Preferred Comms": record.getCellValue("Best Comms")[0],
        Users: record.getCellValue("Kaiārahi"),
        "Regional Contacts": record.getCellValue("Council"),
        Onboarding: [{id: RecordId}]
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
        var date = new Date(), y = date.getFullYear(), m = date.getMonth();
        var firstDay = new Date(y, m - 1, 1);
        var lastDay = new Date(y, m, 0);
        await wasteTable.createRecordAsync({
            "Number of General Rubbish Bins": record.getCellValue('General Rubbish Last Month'),
            "Number of General Recycling Bins": record.getCellValue('General Recycling Last Month'),
            "Number of Garden Waste Composting bins": record.getCellValue('Organic/Garden Waste Last Month'),
            // TODO "": record.getCellValue('Other Recycling Last Month'),
            "Number of Food Composting bins": record.getCellValue('Food Waste Last Month'),
            "From": firstDay,
            "To": lastDay,
            Ropu: [{id: ropuId}]
        })
        return ropuId
    })
    .then(async ropuId => {
        await hazardsTable.createRecordAsync({
            "Date Identified": record.getCellValue("Date"),
            "Details": record.getCellValue("Hazards"),
            "Name": "Initial Site Hazards",
            Ropu: [{id: ropuId}]
        })
        return ropuId
    })
    .then(async ropuId => {
        await peopleTable.createRecordAsync({
            Name: record.getCellValue("Champion Name"),
            "Email - Primary": record.getCellValue("Champion Email"),
            Phone: record.getCellValue("Champion Phone"),
            "Rōpū Primary Contact": [{id: ropuId}]
        })
    })
    .catch( err => {
        console.error(err)
        throw new Error(err)
    })
}
