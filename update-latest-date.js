let table = base.getTable('Goals');
let config = input.config();
let recordId = config.recordId;
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timeZone);
let query = await table.selectRecordsAsync();
let record = query.getRecord(recordId);
let reviewDates = record.getCellValue('Review Dates (from Goal Reviews)').map((value) => new Date(value))
let newestDate = reviewDates.sort(function(d1, d2){
    return d2-d1;
})[0];
newestDate.setHours(newestDate.getHours() + 13)
console.log(newestDate.toLocaleString('en-NZ', { timeZone }))
await table.updateRecordAsync(record, {
    'Latest review': newestDate
});
