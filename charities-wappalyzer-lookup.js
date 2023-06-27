const {url, recordId, charityName} = input.config()
const charitiesTable = base.getTable('Charities')
const techJoinTable = base.getTable('Technologies Join')
const techTable = base.getTable('Technologies')

const charities = await charitiesTable.selectRecordsAsync({fields: ['Name', 'Website']})

// Check URL for http(s)
const newURL = /^((http|https):\/\/)/.test(url) ? url : 'https://' + url

const tech = await fetch('https://wappalyzer-api-production.up.railway.app/extract?url=' + newURL)
const data = await tech.json()

// TECH TABLE
const existingTech = await techTable.selectRecordsAsync({fields: ['name']})

let techToCreate = data.technologies
  .filter(t => {
    return existingTech.records.find(f => f.name == t.name) == undefined
  }).map(t => {
    const {cpe, confidence, version, categories, ...otherFields} = t
    return {
      fields: {
        ...otherFields,
        categories: categories.map(c => c.name).join(', ')
      }
    }  
  })

// ADD New Tech
while (techToCreate.length > 0) {
  await techTable.createRecordsAsync(techToCreate.slice(0, 50));
  techToCreate = techToCreate.slice(50);
}

// TECH JOIN TABLE
const existingTechJoins = await techJoinTable.selectRecordsAsync({fields: ['technologyName', 'charityName']})

let techJoinsToCreate = data.technologies
  .filter(t => {
    return existingTechJoins.records.find(f => f.getCellValue('technologyName') == t.name && f.getCellValue('charityName') == charityName) == undefined
  }).map(t => {
    const {confidence, version} = t
    return {
      fields: {
        confidence,
        version,
        technology: [existingTech.records.find(f => f.name == t.name)],
        charity: [charities.records.find(f => f.id == recordId)],
        charityName: charityName
      }
    }  
  })

// ADD New Tech
while (techJoinsToCreate.length > 0) {
  await techJoinTable.createRecordsAsync(techJoinsToCreate.slice(0, 50));
  techJoinsToCreate = techJoinsToCreate.slice(50);
}

const urlsString = Object.keys(data.urls)

charitiesTable.updateRecordAsync(recordId, {'Lookup Tech': false, 'Lookup URLs': urlsString.join(', ')})
