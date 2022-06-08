const {recordId, availabilityIds} = input.config()

const availabilityTable = base.getTable('Availability')
const demandTable = base.getTable('Demand & Assignment')
const weeksTable = base.getTable('Weeks')

const availability = await availabilityTable.selectRecordsAsync({recordIds: availabilityIds, fields: availabilityTable.fields}) 

// For the given week get all the people and reshape the object to be based on the People table
const allPeople = availability.records.map((r) => ({ id: r.getCellValue('Person')[0].id, name: r.getCellValue('Person')[0].name }))

// Enrich with peoples availability and demand
Promise.all(allPeople.map(async person => {
  const availability= await availabilityTable.selectRecordsAsync({ fields: availabilityTable.fields })
  const weeksAvailability = availability.records
    .filter(r => r.getCellValue('Person') && r.getCellValue('Person')[0].id == person.id && r.getCellValue('Week')[0].id == recordId)
    .reduce((a, i) => {
      const week = i.getCellValue('Week Total Availability')
      return a + week
    }, 0)
    const demand = await demandTable.selectRecordsAsync({fields: demandTable.fields})
    const weeksDemand = demand.records
      .filter(r => r.getCellValue('Person') && r.getCellValue('Person')[0].id == person.id && r.getCellValue('Week')[0].id == recordId)
      .reduce((a, i) => {
        const weeeksDemand = i.getCellValue('Week Total Demand')
        return a + weeeksDemand
      }, 0)
  return {
    ...person,
    weeksAvailability,
    weeksDemand
  }
}))
// Filter out people whos demand is greater then their availabilty
.then(people => people.filter(p => p.weeksAvailability > p.weeksDemand))
// Add the remaining people back to the week
.then(people => {
  weeksTable.updateRecordAsync(recordId, {"Recalculate Available": false, "Whos Available": people.map(p => ({id: p.id}))})
})
