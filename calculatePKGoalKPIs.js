const goalsTable = base.getTable('Kaiarahi Goals')
const ropuTable = base.getTable('Ropu')
const huiLogsTable = base.getTable('Ropu Hui Log')

const goals = await goalsTable.selectRecordsAsync({fields: ['Type', 'Kaiārahi', 'Quarter Start', 'Quarter End']})
const ropu = await ropuTable.selectRecordsAsync({fields: ['Date Signed', 'Kaiārahi']})
const hui = await huiLogsTable.selectRecordsAsync({fields: ['_date', 'Kaiārahi', 'Type']})

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

// The Goal type is a single select
const goalTypes = { 
    //Sign Ups
    selNoxulKxjmjv51D: calculateSignedUp,
    //Wānanga
    sel1zL06dDb2ZkOGp: calculateWananga,
    //Number tracking waste
    selAY7UvaxhznPYZJ: calculateSignedUp,
    //Stories of Change
    sel1fUF2WYLUQs1ip: calculateSignedUp,
    //Equipment setup
    selFHYSZzWcdKQq6H: calculateSignedUp,
    //Events
    selntYyWJuYov8Hm1: calculateSignedUp,
    //Presentations
    selXNaAFOWkOi0yp4: calculateSignedUp,
    //Compost Wānanga
    sel6ofR9Rek0MAo9R: calculateSignedUp,
    //Microgreens Wānanga
    selqKj7raZAaNJRSR: calculateSignedUp,
    //Ikura Wānanga
    selH8YVLyU8PGwjd6: calculateSignedUp,
    //50% reduction of waste
    selADMsf4uPpg9AZ0: calculateSignedUp,
    //Support Committee Hui
    sel4bNoidZdH2Umlp: calculateSignedUp,
    //Facebook Posts
    sel2kIHOCwI8A2i0T: calculateSignedUp,
    //Other
    selxCHf7TZ1PP8tjz: calculateSignedUp,
    //Waste Check Wānanga
    selAm0ZpN6tGMfhss: calculateSignedUp,
    //Kope Toitū Wānanga
    selMRmgZ6J7Ct38wl: calculateSignedUp,
    //Māra Wānanga
    selhWPqyIMIMSmWCP: calculateSignedUp,
    //Wai Māori Wānanga
    selp4eyhrguw9XFah: calculateSignedUp,
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

function calculateWananga(start, end, kaiarahi){
    const records = filterQuarterRecords(hui, start, end, '_date', kaiarahi)
    // This is count of each wananga in the type column for each records.
    // ie everything except the presentations and wanananga planning hui
    return records.reduce((acc, next) => {
        const wanangaTags = next.getCellValue('Type').filter(t => huiLogCategory(t.id) === 'wananga')
        return acc + wanangaTags.length
    }, 0)
}

function calculateActual(goalType){
    // ALternative approach to switch: https://www.blog.wax-o.com/2015/05/an-alternative-to-if-else-and-switch-in-javascript/
    return goalTypes[goalType.id] || calculateSignedUp
} 

let actuals = goals.records.map(goal => {
    const getActual = calculateActual(goal.getCellValue('Type'))
    return {
        id: goal.id,
        fields: {
            'Quarter Actual': getActual(goal.getCellValue('Quarter Start'), goal.getCellValue('Quarter End'), goal.getCellValue('Kaiārahi'))
        }
    }
})

output.markdown(`Updating ${actuals.length} records`);

while (actuals.length > 0) {
  await goalsTable.updateRecordsAsync(actuals.slice(0, 50));
  actuals = actuals.slice(50);
}

output.markdown("**Done**");
