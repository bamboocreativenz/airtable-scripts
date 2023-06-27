//Airtable Script Inputs

const donationInput = await input.textAsync('Minimum Donations received (1000s)')
const balanceMinInput = await input.textAsync('Minimum Balance (1000s)')
const balanceMaxInput = await input.textAsync('Maximum Balance (1000s)')
const donationMin = Number(donationInput) * 1000
const balanceMin = Number(balanceMinInput) * 1000
const balanceMax = Number(balanceMaxInput) * 1000
const registeredStatus = "Registered"

const charitiesTable = base.getTable('Charities')

const query = `https://www.odata.charities.govt.nz/GrpOrgLatestReturns?$filter=(DonationsKoha gt ${donationMin}) and (TotalAssets gt ${balanceMin}) and (TotalAssets lt ${balanceMax}) and (substringof(RegistrationStatus, '${registeredStatus}') eq true)&$format=json`

const res = await remoteFetchAsync(query)

if(res.ok) {
    const data = await res.json()

    let charities = data.d.map((c) => {
        // Filter out keys with null value - they will cause airtable to shit a brick
        let _c = Object.keys(c)
            .filter((k) => c[k] != null)
            // Cast bools to strings
            .reduce((a, k) => { 
                const v = typeof c[k] == "boolean" ? String(c[k]) : c[k]
                return {...a, [k]: v }
            },{});

        // Cast out the fields that are giving you trouble
        const {__metadata, ...f} = _c

        return {
            fields: {
                'OData URI': __metadata.uri,
                ...f
            }
        }
    })

    // DELETE CURRENT SEARCH RESULTS
    const allData = await charitiesTable.selectRecordsAsync({fields: ['Name', 'Technology Joins']})
    let records = allData.records.filter(r => r.getCellValue('Technology Joins') == null || undefined)

    while (records.length > 0){
        await charitiesTable.deleteRecordsAsync(records.slice(0, 50))
        records = records.slice(50)
    }

    const existingCharities = allData.records.filter(r => r.getCellValue('Technology Joins') != null || undefined)

    let charitiesToCreate = charities.filter(c => {
        return existingCharities.find(f => f.getCellValue('Name') == c.fields.Name) == undefined
    })

    // ADD NEW SEARCH RESULTS
    while (charitiesToCreate.length > 0) {
        await charitiesTable.createRecordsAsync(charitiesToCreate.slice(0, 50));
        charitiesToCreate = charitiesToCreate.slice(50);
    }
    output.markdown(`${data.d.length} Charities Found`);
} else {
    console.log(res.statusText)
}
