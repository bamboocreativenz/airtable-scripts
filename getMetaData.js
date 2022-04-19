// This fetch request uses the front end UIs hidden api. But returns all kinds of goodies including the field descrptions

const response = await fetch(`https://airtable.com/v0.3/application/APP_ID/read`, {
    "headers": {
        "accept": "*/*",
        "x-airtable-application-id": 'appXXXXXXXXXXXX',
        "x-requested-with": "XMLHttpRequest",
        "x-time-zone": "Europe/Paris",
        "x-user-locale": "us",
        "Cookie": `__Host-airtable-session=TOKEN1; __Host-airtable-session.sig=TOKEN2;`
    }
});

const result = await response.json();
console.log('result', result)
