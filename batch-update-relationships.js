const categoriesTable = base.getTable('tblY4ttR57YEJrGKc')
const orgsTable = base.getTable('tblzP2rWmac39XrbD')
const transactionsTable = base.getTable('tblIgM7MNsBzjoYjP')

const categoriesQuery = await categoriesTable.selectRecordsAsync({fields: ['Name']})
const orgsQuery = await orgsTable.selectRecordsAsync({fields: ['Name', 'Relationship Type']})
const transactionsQuery = await transactionsTable.selectRecordsAsync({fields: 
    [
        'Relationship Type',
        'Sync Origin Org',
        'Origin Org', 
        'Sync Destination Org',
        'Destination Org', 
        'Sync Category',
        'Category'
    ]
})

let orgCreates = []
let transactionUpdates = []

const transactionsMissingOrgsAndCategory = transactionsQuery.records
    .filter(f => 
        !exists(f.getCellValueAsString('Category')) 
        && !exists(f.getCellValueAsString('Origin Org')) 
        || !exists(f.getCellValueAsString('Destination Org'))
    )

transactionsMissingOrgsAndCategory.forEach(record => {
    let transactionUpdate = {id: record.id, fields: {}}
    const relationshipType = record.getCellValueAsString('Relationship Type')

    // Get data out of transaction & look it up in the appropriate table
    const transactionCategory = record.getCellValueAsString('Category')
    const transactionSyncCategory = record.getCellValueAsString('Sync Category')
    const foundCategory = categoriesQuery.recordIds
        .filter(o => categoriesQuery.getRecord(o).name == transactionSyncCategory)

    const transactionOriginOrg = record.getCellValueAsString('Origin Org')
    const transactionSyncOriginOrg = record.getCellValueAsString('Sync Origin Org')
    const foundOriginOrg = orgsQuery.recordIds
        .filter(o => orgsQuery.getRecord(o).name == transactionSyncOriginOrg && orgsQuery.getRecord(o).getCellValueAsString('Relationship Type') == relationshipType)

    const transactionDestinationOrg = record.getCellValueAsString('Destination Org')
    const transactionSyncDestinationOrg = record.getCellValueAsString('Sync Destination Org')
    const foundDestinationOrg = orgsQuery.recordIds
        .filter(o => orgsQuery.getRecord(o).name == transactionSyncDestinationOrg && orgsQuery.getRecord(o).getCellValueAsString('Relationship Type') == relationshipType)

    if(exists(transactionSyncCategory) && exists(foundCategory) && !exists(transactionCategory)) {
        transactionUpdate.fields['Category'] = foundCategory.map(m => ({id: m}))
    }

    if(exists(transactionSyncOriginOrg) && !exists(transactionOriginOrg)) {
        if(exists(foundOriginOrg)) {
            transactionUpdate.fields['Origin Org'] = foundOriginOrg.map(m => ({id: m}))
        } else {
            orgCreates.push(transactionSyncOriginOrg + '|**' + relationshipType)
        }
    }

    if(exists(transactionSyncDestinationOrg && !exists(transactionDestinationOrg))) {
        if(exists(foundDestinationOrg)) {
            transactionUpdate.fields['Destination Org'] = foundDestinationOrg.map(m => ({id: m}))
        } else {
            orgCreates.push(transactionSyncDestinationOrg + '|**' + relationshipType)
        }
    }

    transactionUpdates.push(transactionUpdate)
})

// create unique set of orgs to create
const uniqueOrgs = [...new Set(orgCreates)];

let orgs = uniqueOrgs.map(o => {
    const splitValues = o.split('|**')
    return {
        fields: {
            Name: splitValues[0],
            'Relationship Type': splitValues[1] 
        }
    }
})

output.markdown(`Updating ${transactionUpdates.length} records`);
while (transactionUpdates.length > 0) {
  await transactionsTable.updateRecordsAsync(transactionUpdates.slice(0, 50));
  transactionUpdates = transactionUpdates.slice(50);
}
output.markdown(`Creating ${uniqueOrgs.length} records`);
while (orgs.length > 0) {
  await orgsTable.createRecordsAsync(orgs.slice(0, 50));
  orgs = orgs.slice(50);
}
output.markdown("**Done**");

function exists (data){
    if (data === undefined) {
        return false
    } else if (data === null) {
        return false
    } else if (data.length === 0) {
        return false
    } else {
        return true
    }
}
