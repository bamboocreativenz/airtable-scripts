const goalsTable = base.getTable('Kaiarahi Goals')
const ropuTable = base.getTable('Ropu')
const huiLogsTable = base.getTable('Ropu Hui Log')
const storiesTable = base.getTable('Ropu Stories')
const equipmentTable = base.getTable('Ropu Equipment')
const eventsTable = base.getTable('Events')

const goals = await goalsTable.selectRecordsAsync({fields: ['Kaiārahi', 'Type', 'Quarter Start', 'Quarter End', 'Quarter Manual']})
const ropu = await ropuTable.selectRecordsAsync({fields: ['Kaiārahi', 'Date Signed', 'Waste Entries Count', 'Quarters Waste Diverted']})
const hui = await huiLogsTable.selectRecordsAsync({fields: ['Kaiārahi', '_date', 'Type']})
const stories = await storiesTable.selectRecordsAsync({fields: ['Kaiārahi', 'Story Date']})
const equipment = await equipmentTable.selectRecordsAsync({fields: ['Kaiārahi', 'Created Date']})
const events = await eventsTable.selectRecordsAsync({fields: ['Kaiārahi', 'Date']})

function includesArray(arr1, arr2){
    if(arr1 === null) return false
    if(arr2 === null) return false
    const arr1Ids = arr1.map(i => i.id)
    const arr2Ids = arr2.map(i => i.id)
    return arr2Ids
        .map(i => arr1Ids.includes(i))
        .reduce((acc, next) => {
                if(acc === true) return acc
                return next
            },
            false
        )
}

function huiLogCategory(selectId){
    switch (selectId) {
        //Presentation
        case "selrM1REb7LojWWkd": 
            return 'presentation'
        //Wānanga Planning Hui
        case "selRgHix6uVyx8uRk": 
            return 'planningHui'
        //Compost (Worm farm etc) Wānanga 
        case "seleVUMS6Gv97fo5n":
        //Ikura Wānanga
        case "selWHMGlVr0j96Okd":
        //Kope Toitū Wānanga
        case "sel1h7STOxuuCsCc6":
        //Māra Wānanga
        case "selWEFTcXKjlKmRhs":
        //Microgreens Wānanga
        case "sellwu7y2HhoBpDUU":
        //Natural Resources Wānanga
        case "selmCqSQVwVLf6v6Y":
        //System of Stuff Wānanga
        case "selMM4vVaoPi8ycCN":
        //The Waste Hierarchy Wānanga
        case "sel2WfphE5QddaolY":
        //Wai Māori Wānanga
        case "sele3x3xsUl65qjGA":
        //Waste Check Wānanga
        case "selGPRlpHzXg60doU":
        //Wānanga Planning Hui
        case "selRgHix6uVyx8uRk":
        //Other Wānanga
        case "selheqawhk0AxY9WL":
            return 'wananga'
        default:
            return null
    }
}

function getGoalCalculation(selectId){ 
    switch(selectId) {
        //Sign Ups
        case 'selNoxulKxjmjv51D':
            return calculateSignedUp
        //Wānanga
        case 'sel1zL06dDb2ZkOGp':
            return calculateHui('wananga')
        //Number tracking waste
        case 'selAY7UvaxhznPYZJ':
            return calculateRopuTrackingWaste
        //Stories of Change
        case 'sel1fUF2WYLUQs1ip':
            return calculateStoriesOfChange
        //Equipment setup
        case 'selFHYSZzWcdKQq6H':
            return calculateEquipment
        //Events
        case 'selntYyWJuYov8Hm1':
            return calculateEvents
        //Presentations
        case 'selXNaAFOWkOi0yp4':
            return calculateHui('presentation')
        //Compost Wānanga
        case 'sel6ofR9Rek0MAo9R':
            return calculateHui('wananga', 'seleVUMS6Gv97fo5n')
        //Microgreens Wānanga
        case 'selqKj7raZAaNJRSR':
            return calculateHui('wananga', 'sellwu7y2HhoBpDUU')
        //Ikura Wānanga
        case 'selH8YVLyU8PGwjd6':
            return calculateHui('wananga', 'selWHMGlVr0j96Okd')
        //50% reduction of waste
        case 'selADMsf4uPpg9AZ0':
            return calculateReduction
        //Support Committee Hui
        case 'sel4bNoidZdH2Umlp':
            return calculateManual
        //Facebook Posts
        case 'sel2kIHOCwI8A2i0T':
            return calculateManual
        //Other
        case 'selxCHf7TZ1PP8tjz':
            return calculateManual
        //Waste Check Wānanga
        case 'selAm0ZpN6tGMfhss':
            return calculateHui('wananga', 'selGPRlpHzXg60doU')
        //Kope Toitū Wānanga
        case 'selMRmgZ6J7Ct38wl':
            return calculateHui('wananga', 'sel1h7STOxuuCsCc6')
        //Māra Wānanga
        case 'selhWPqyIMIMSmWCP':
            return calculateHui('wananga', 'selWEFTcXKjlKmRhs')
        //Wai Māori Wānanga
        case 'selp4eyhrguw9XFah':
            return calculateHui('wananga', 'sele3x3xsUl65qjGA')
        default:
            return () => 0
    }

}

function filterQuarterRecords(table, start, end, dateFieldName, kaiarahi){
    return table.records.filter(r => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const eventDate = new Date(r.getCellValue(dateFieldName))

        return eventDate.getTime() >= startDate.getTime() 
            && eventDate.getTime() <= endDate.getTime()
            && includesArray(kaiarahi, r.getCellValue('Kaiārahi')) 
    })
}

function calculateSignedUp(start, end, kaiarahi){
    const records = filterQuarterRecords(ropu, start, end, 'Date Signed', kaiarahi)
    return records.length
}

/**
* @param {'presentation' | 'wananga' | 'planningHui'} category
* @param {string} [typeId]
*/
function calculateHui(category, typeId){
    return (start, end, kaiarahi) => {
        const records = filterQuarterRecords(hui, start, end, '_date', kaiarahi)
        // This is count of each wananga in the type column for each records.
        // ie everything except the presentations and wanananga planning hui
        return records.reduce((acc, next) => {
            const wanangaTags = next.getCellValue('Type')
                .filter(t => typeId 
                    ? typeId === t.id && huiLogCategory(t.id) === category
                    : huiLogCategory(t.id) === category
                )
            return acc + wanangaTags.length
        }, 0)
    }
}

function calculateRopuTrackingWaste(start, end, kaiarahi){
    const records = filterQuarterRecords(ropu, start, end, 'Date Signed', kaiarahi)
    const trackingWaste = records.filter(r => r.getCellValue('Waste Entries Count') > 1)
    return trackingWaste.length
}

function calculateStoriesOfChange(start, end, kaiarahi){
    const records = filterQuarterRecords(stories, start, end, 'Story Date', kaiarahi)
    return records.length
}

function calculateEquipment(start, end, kaiarahi){
    const records = filterQuarterRecords(equipment, start, end, 'Created Date', kaiarahi)
    return records.length
}

function calculateEvents(start, end, kaiarahi){
    const records = filterQuarterRecords(events, start, end, 'Date', kaiarahi)
    return records.length
}

function calculateReduction(start, end, kaiarahi){
    const records = ropu.records.filter(r => {
        const quarters = r.getCellValue('Quarters Waste Diverted')
        return quarters !== null
            && quarters[quarters.length -1] <= -0.5
            && includesArray(kaiarahi, r.getCellValue('Kaiārahi')) 
    })
    return records.length
}

function calculateManual(start, end, kaiarahi, manual){
    return manual === null ? 0 : manual
}

let actuals = goals.records.map(goal => {
    const getActual = getGoalCalculation(goal.getCellValue('Type').id)
    return {
        id: goal.id,
        fields: {
        'Quarter Actual': getActual(goal.getCellValue('Quarter Start'), goal.getCellValue('Quarter End'), goal.getCellValue('Kaiārahi'), goal.getCellValue('Quarter Manual'))
        }
    }
})

output.markdown(`Updating ${actuals.length} records`);

while (actuals.length > 0) {
  await goalsTable.updateRecordsAsync(actuals.slice(0, 50));
  actuals = actuals.slice(50);
}

output.markdown("**Done**");
