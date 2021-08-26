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

let employeeRecordId = await findEmployeeRecordId(config.employeeName)

console.log('Name: ',config.employeeName)

if (employeeRecordId.length > 1){
    surveyTable.updateRecordAsync(config.recordId, {employee_id: [{id: employeeRecordId}]})
    await orderSurveys(employeeRecordId)
    .then((surveys) => surveys.filter((survey) => survey.id != config.recordId))
    .then((lastSurveys) => surveyTable.updateRecordAsync(config.recordId, {
        "Previous Phases": lastSurveys
    }))
    .catch(err => console.error(err))
}

async function findEmployeeRecordId(name){
    const record = employeeQuery.records.find((record) => record.getCellValue('name') == name)
    if (record) {
        console.log('Employee Record ID: ', record.id)
        return record.id
    } else {
        console.log('No Employee Found')
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
