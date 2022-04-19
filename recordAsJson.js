// Script to run in an automation triggered on any update to a record 
// EXCEPT for the recordAsJson field you are updating - that creates an infinite loop

/** -------------- Update Variables ---------------- */
// Get the table name from the url
const tableId = ' tblXXXXXXXXXXXX'
// Whatever the longText field name is you want to update
const jsonFieldName = 'recordAsJson'

// Note: the recordId gets passed in from the airtable update trigger automation
const { recordId } = input.config()

/** ---------------- Do not change ----------------- */
const table = base.getTable(tableId)

const allFields = table.fields.map(field => ({id: field.id, name: field.name}))
    .filter(field => field.name !== jsonFieldName)

const record = await table.selectRecordAsync(recordId)

const recordWithFields = allFields.map(field => {
    return{
        ...field, 
        // @ts-ignore
        value: record.getCellValue(field.name)
    }
})

table.updateRecordAsync(recordId, {[jsonFieldName]: JSON.stringify({recordId, meta: table.fields, fields: recordWithFields})})
