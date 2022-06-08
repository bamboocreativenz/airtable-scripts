const {recordId, roleId, weekId} = input.config()

/**
 * Workflow:
 * - Get the available people for the week
 * - Get the roles for each person available for the week
 * - Filter down to just those who have the role needed (roleId)
 * - Write names as string into 'Available for Role'
 */

const weekTable = base.getTable('Weeks')
const personTable = base.getTable('People')
const demandTable = base.getTable('Demand & Assignment')

const allPeople = await personTable.selectRecordsAsync({fields: personTable.fields}) 
const week = await weekTable.selectRecordAsync(weekId[0])

if(week){
    const weekAvailable = week.getCellValue('Whos Available').map(p => p.id)
    const availablePeople = allPeople.records.filter(p => weekAvailable.includes(p.id))
    const people = availablePeople.map(p => ({...p, role: p.getCellValue('Roles').map(r => r.id)}))

    const peopleWithRole = people.filter(p => p.role.includes(roleId[0]))
    demandTable.updateRecordAsync(recordId, {"Recalculate Available": false, "Available for Role": peopleWithRole.map(p => p.name).join(', ')})
}
