let table = base.getTable('Goals');
let config = input.config();
let recordId = config.recordId;
let query = await table.selectRecordsAsync();
let record = query.getRecord(recordId);
let statuses = record.getCellValue('Status (from Goal Reviews)')
await table.updateRecordAsync(record, {
    'Latest Status': {
        name: statuses.pop()
    } 
});
