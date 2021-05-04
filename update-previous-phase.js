// Tables & Queries
const clientTable = base.getTable('Clients');
const employeeTable = base.getTable('Client Employees')
const surveyTable = base.getTable('Survey Records')

const employeeQuery = await employeeTable.selectRecordsAsync()

// Config
const config = input.config();
const phase = Array.isArray(config.phase) ? config.phase[0] : config.phase
const phaseNumber = Number(phase.match(/\d+/)[0])

// When a new survey is submitted
// Than find the Employee record to associate with
// Than determine the single last phase
// Than update the survey record with the employee and survey recordIds

let employeeRecordId = ''
let lastSurveys

// If IM is submitted first
if (config.employeeIMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeIMName)
    lastSurveys = await orderSurveys(employeeRecordId)

// Else if YM is submitted first
} else if(config.employeeYMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeYMName)
    lastSurveys = await orderSurveys(employeeRecordId)
}

// If there is at least 1 previous survey
// Update the survey with the last survey
if (lastSurveys) {
    await surveyTable.updateRecordAsync(config.recordId, {
        "Previous Phases": lastSurveys
    })
}
async function findEmployeeRecordId(name){
    return employeeQuery.records.find((record) => record.getCellValue('name') == name).id
}

// Reduce through array of previous phases and find the one which has a Phase number less than 1 than the current
async function getlastSurvey(employeeRecordId, phaseNumber){
    const surveys = await employeeQuery.getRecord(employeeRecordId).getCellValue('Survey  Records')
    return surveys.reduce((accumulator, record) => {
        return Number(record.name.match(/\d+/)[0]) == phaseNumber - 1
        ? record
        : null
    })
}

// Order surveys by newest (highest phase number) to oldest (lowest phase number)
async function orderSurveys(employeeRecordId){
    const surveys = await employeeQuery.getRecord(employeeRecordId).getCellValue('Survey  Records')
    return surveys.sort((p1, p2) => {
        return Number(p1.name.match(/\d+/)[0]) - Number(p2.name.match(/\d+/)[0])
    })
}
