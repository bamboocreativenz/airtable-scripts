// Get the Id out of the input
const {recordId} = input.config()

// Setup our table & quiry variable
const dataTable = base.getTable('NZFN Data CamelCase')

// Get Record
const record = await dataTable.selectRecordAsync(recordId)

if(record){
  const firebaseUrl = ''
  const functionSecret = ''
  
  // Need error handling
  try {
    const result = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({
        apiKey: functionSecret, // change to a basicAuth header?
        // @ts-ignore
        record
      })
    })
    
    if(result.status == 200) {
      dataTable.updateRecordAsync(recordId, {'recordSentToHub': true})
    }
  } catch (error) {
    // TODO: Find a better way to handle errors other than relying on airtable emails
    // Unclear how/if we can integrate with sentry.io
    throw new Error(error)
  }
}
