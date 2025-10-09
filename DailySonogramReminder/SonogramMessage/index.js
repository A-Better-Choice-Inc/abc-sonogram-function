const axios = require('axios');
const twillio = require('twilio');
const { DateTime } = require("luxon");

console.log("Begin Script")

// Update to use the new PHP API endpoint
let sourceUrl = `https://abcmc.azurewebsites.net/api/v1/sonogram_reminders.php`
let twillioFlowId = process.env["twillioFlowId"]
let twilioAccountSid = process.env["twilioAccountSid"]
let twilioAuthToken = process.env["twilioAuthToken"]

module.exports = async function (context, myTimer) {
    const client = twillio(twilioAccountSid, twilioAuthToken);
    console.log("Fetch Data From Source URL")

    let responseData = await axios.get(sourceUrl)

    responseData.data.data.forEach(async line => {
        // Destructure the array returned by stored procedure
        // [id, client_id_fk, date, time, firstName, lastName, Phone, okToText]
        const [id, client_id_fk, date, time, firstName, lastName, Phone, okToText] = line;

        console.log("Response Date:", date)
        console.log("Response Time:", time)

        fulldate = DateTime.fromISO(date).setZone("utc")
        console.log("Luxon: ", fulldate)

        monthnumber = fulldate.toFormat('LL')
        daynumber = fulldate.toFormat('dd')
        dayofweek = fulldate.toFormat('cccc')

        fulltime = DateTime.fromISO(time).setZone("America/Chicago")
        console.log("Luxon: ", fulltime)
        combinedTime = fulltime.toFormat('hh:mm a')

        let twillioParams = {
            to: Phone,
            from: '+13166855757',
            parameters: {
                sonogram_id: id,
                textmessage: [
                    "This is a reminder for your appointment at A BETTER CHOICE on",
                    `${dayofweek}, ${monthnumber}/${daynumber} at ${combinedTime}. Please`,
                    "reply Y to confirm and N to cancel. Thanks!"
                ].join(" "),
                client_id: client_id_fk,
                type: 'sonogram',
            }
        }
        console.log("Sending to Twillio: ", twillioParams)
        await client.studio.flows(twillioFlowId)
            .executions
            .create(twillioParams)
            .then(execution => console.log(execution.sid));
    })
};
