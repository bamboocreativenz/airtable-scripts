/**
 * Workflow:
 * - Get the available people for the week
 * - Get the roles for each person available for the week
 * - Filter down to just those who have the role needed (roleId)
 * - foreach week for each demand updated the names as string into 'Available for Role'
 */

const weekTable = base.getTable('Weeks')
const personTable = base.getTable('People')
const demandTable = base.getTable('Demand & Assignment')

const allDemands = await demandTable.selectRecordsAsync({fields: demandTable.fields})

const updateRecords = allDemands.records.map(r => ({id: r.id, fields: {'fldYlBnvduF521yPw': true}}))

let batches = []

for (let i = 1; i < updateRecords.length; i+=50) {
  batches.push(updateRecords.slice(i-1,i+49))
}

await Promise.all(batches.map(async b => demandTable.updateRecordsAsync(b)))
