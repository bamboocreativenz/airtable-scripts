const {recordId, allAvailable, roleId} = input.config()

/**
 * Workflow:
 * - Get the roles for each person available (allAvailable) for the week
 * - Filter down to just those who have the role needed (roleId)
 * - Write names as string into 'Available for Role'
 */

const personTable = base.getTable('People')
const demandTable = base.getTable('Demand & Assignment')

const availablePeople = await personTable.selectRecordsAsync({recordIds: allAvailable, fields: personTable.fields})

const people = availablePeople.records.map(p => ({...p, role: p.getCellValue('Roles')})).filter(p => p.role[0].id === roleId[0])

demandTable.updateRecordAsync(recordId, {"Available for Role": people.map(p => p.name).join(', ')})
