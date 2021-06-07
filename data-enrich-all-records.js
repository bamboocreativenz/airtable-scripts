//init consts
const usersTable = base.getTable('Users')
const weMatterTable = base.getTable('WeMatter')
const usersQuery = await usersTable.selectRecordsAsync()
const weMatterQuery = await weMatterTable.selectRecordsAsync()

let batchQueue = []

const users = usersQuery.recordIds.map((recordID) => {
    const weMatter = usersQuery.getRecord(recordID).getCellValue('Link to WeMatter')

    if (weMatter) {
        const lastPhaseRecordId = weMatter.reduce((previousValue, currentValue) => {
            const WeMatter = weMatterQuery.getRecord(currentValue.id)

            return Number(previousValue) < Number(WeMatter.getCellValue('Phase Number').trim()) 
            ? currentValue
            : previousValue
        })

        const lastPhase = weMatterQuery.getRecord(lastPhaseRecordId.id)

        const engagementScore = lastPhase.getCellValue('Engagement Average')
        const imatterScore = lastPhase.getCellValue('IM S&B Average')
        const youMatterScore = lastPhase.getCellValue('YM S&B Average')

        lastPhaseRecordId.name.includes('Arias') ? console.log({recordID, engagementScore, imatterScore, youMatterScore}) : null
        
        batchQueue.push({recordID, engagementScore, imatterScore, youMatterScore})
    }
})

async function updateUserRecord({recordID, engagementScore, imatterScore, youMatterScore}) {
    await usersTable.updateRecordAsync(recordID, {
        "Engagement Score": engagementScore,
        "IMatter Score": imatterScore,
        'YouMatter Score': youMatterScore
    }).catch(err => console.log(err))
}

while (batchQueue.length > 0) {
    await updateUserRecord(batchQueue.pop())
}
