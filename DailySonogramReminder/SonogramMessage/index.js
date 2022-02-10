const axios = require('axios');
const twillio = require('twilio');
const { DateTime } = require("luxon");

console.log("Begin Script")

let sourceUrl = `https://abc-sonogram-api.azurewebsites.net/sonograms`
let destUrl = `https://studio.twilio.com/v2/Flows/FW78dff28617dc6cc617b3fee12bc4f55f/Executions`
let twillioFlowId = process.env["twillioFlowId"]
let twilioAccountSid = process.env["twilioAccountSid"]
let twilioAuthToken = process.env["twilioAuthToken"]

let process = async function (context, myTimer) {
    const client = twillio(twilioAccountSid, twilioAuthToken);
    console.log("Fetch Data From Source URL")
    
    let responseData  = await axios.get(sourceUrl)
    // console.log("ResponseData: ", responseData)
    
    responseData.data.data.forEach(async line => {
        console.log("Response Date:", line.date)
        console.log("Response Time:", line.time)

        fulldate = DateTime.fromISO(line.date).setZone("utc")
        console.log("Luxon: ", fulldate)
        
        monthnumber = fulldate.toFormat('LL')
        daynumber = fulldate.toFormat('dd')
        dayofweek = fulldate.toFormat('cccc')
        
        fulltime = DateTime.fromISO(line.time).setZone("America/Chicago")
        console.log("Luxon: ", fulltime)
        combinedTime = fulltime.toFormat('hh:mm a')

        let twillioParams = {
            to: line.Phone, 
            from: '+13166855757',
            parameters: {
                sonogram_id: line.id,
                textmessage: [
                    "This is a reminder for your appointment at A BETTER CHOICE on",
                    `${dayofweek}, ${monthnumber}/${daynumber} at ${combinedTime}. Please`,
                    "reply Y to confirm and N to cancel. Thanks!"
                ].join(" "),
                client_id: line.client_id_fk,
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

module.exports = process;
