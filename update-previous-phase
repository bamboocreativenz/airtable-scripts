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
let lastSurvey = {}

// If IM is submitted first
if (config.employeeIMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeIMName)
    lastSurvey = await getlastSurvey(employeeRecordId, phaseNumber)

// Else if YM is submitted first
} else if(config.employeeYMName) {
    employeeRecordId = await findEmployeeRecordId(config.employeeYMName)
    lastSurvey = await getlastSurvey(employeeRecordId, phaseNumber)
}

// If there is at least 1 previous survey
// Update the survey with the last survey
if (lastSurvey) {
    await surveyTable.updateRecordAsync(config.recordId, {
        "Previous Phases": [{
            'id': lastSurvey.id
        }]
    })
}
async function findEmployeeRecordId(name){
    return employeeQuery.records.find((record) => record.getCellValue('name') == name).id
}

async function getlastSurvey(employeeRecordId, phaseNumber){
    const surveys = await employeeQuery.getRecord(employeeRecordId).getCellValue('Survey  Records')
    return surveys.reduce((accumulator, record) => {
        return Number(record.name.match(/\d+/)[0]) == phaseNumber - 1
        ? record
        : null
    })
}
