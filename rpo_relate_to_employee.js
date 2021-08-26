// Tables & Queries
const clientTable = base.getTable('Clients');
const employeeTable = base.getTable('Client Employees')
const surveyTable = base.getTable('Survey Records')

const employeeQuery = await employeeTable.selectRecordsAsync({fields:['name','Survey  Records']})

// Config
const config = input.config();
const phase = Array.isArray(config.phase) ? config.phase[0] : config.phase
const phaseNumber = Number(phase.match(/\d+/)[0]
)
// When a new survey is submitted
// Than find the Employee record to associate with
// Than determine the single last phase
// Than update the survey record with the employee and survey recordIds

let employeeRecordId = ''
let lastSurveys

console.log('IMName: ',config.employeeIMName)
console.log('YMName: ',config.employeeYMName)


// If IM is submitted first
if (config.employeeIMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeIMName)
    if (employeeRecordId.length > 1){
     lastSurveys = await orderSurveys(employeeRecordId).then((surveys) => surveys.filter((survey) => survey.id != config.recordId))
    }

// Else if YM is submitted first
} else if(config.employeeYMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeYMName)
    if (employeeRecordId.length > 1){
     lastSurveys = await orderSurveys(employeeRecordId).then((surveys) => surveys.filter((survey) => survey.id != config.recordId))
    }
}

// If there is at least 1 previous survey
// Update the survey with the last survey
if (lastSurveys) {
    await surveyTable.updateRecordAsync(config.recordId, {
        "Previous Phases": lastSurveys
    })
}
async function findEmployeeRecordId(name){
    const record = employeeQuery.records.find((record) => record.getCellValue('name') == name)
    console.log(record)
    if (record) {
        return record.id
    } else {
        return ''
    }
}

// Reduce through array of previous phases and find the one which has a Phase number less than 1 than the current
async function getlastSurvey(employeeRecordId, phaseNumber){
    const surveys = await employeeQuery.getRecord(employeeRecordId).getCellValue('Survey  Records')
    // @ts-ignore
    return surveys.reduce((_accumulator, record) => {
        return Number(record.name.match(/\d+/)[0]) == phaseNumber - 1
        ? record
        : null
    })
}

// Order surveys by 
async function orderSurveys(employeeRecordId){
    const surveys = await employeeQuery.getRecord(employeeRecordId).getCellValue('Survey  Records')
    return surveys.sort((p1, p2) => {
        return Number(p1.name.match(/\d+/)[0]) - Number(p2.name.match(/\d+/)[0])
    })
}
