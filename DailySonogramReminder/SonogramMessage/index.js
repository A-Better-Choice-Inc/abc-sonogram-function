const axios = require('axios');
const twilio = require('twilio');
const { DateTime } = require('luxon');

const apiBaseUrl = process.env.apiBaseUrl || 'https://abcmc.pregnancywichita.com';
const sourceUrl = `${apiBaseUrl}/api/v1/sonogram_reminders.php`;
const twilioFlowId = process.env.twilioFlowId;
const twilioAccountSid = process.env.twilioAccountSid;
const twilioAuthToken = process.env.twilioAuthToken;
const twilioFromNumber = process.env.twilioFromNumber || '+13166855757';

module.exports = async function (context, myTimer) {
    context.log('Sonogram reminder function started');

    // Validate environment variables
    if (!twilioFlowId || !twilioAccountSid || !twilioAuthToken) {
        context.log.error('Missing required environment variables');
        throw new Error('Missing Twilio configuration');
    }

    try {
        const client = twilio(twilioAccountSid, twilioAuthToken);
        context.log('Fetching data from:', sourceUrl);

        const response = await axios.get(sourceUrl);
        const appointments = response.data.data;

        if (!appointments || appointments.length === 0) {
            context.log('No appointments to process');
            return;
        }

        context.log(`Processing ${appointments.length} appointments`);

        // Use for...of instead of forEach to properly await promises
        for (const line of appointments) {
            try {
                // Destructure the array returned by stored procedure
                // [id, client_id_fk, date, time, firstName, lastName, Phone, okToText]
                const [id, client_id_fk, date, time, firstName, lastName, phone, okToText] = line;

                context.log(`Processing appointment ${id} for ${firstName} ${lastName}`);

                const fullDate = DateTime.fromISO(date).setZone('utc');
                const monthNumber = fullDate.toFormat('LL');
                const dayNumber = fullDate.toFormat('dd');
                const dayOfWeek = fullDate.toFormat('cccc');

                const fullTime = DateTime.fromISO(time).setZone('America/Chicago');
                const combinedTime = fullTime.toFormat('hh:mm a');

                const twilioParams = {
                    to: phone,
                    from: twilioFromNumber,
                    parameters: {
                        sonogram_id: id,
                        textmessage: [
                            'This is a reminder for your appointment at A BETTER CHOICE on',
                            `${dayOfWeek}, ${monthNumber}/${dayNumber} at ${combinedTime}. Please`,
                            'reply Y to confirm and N to cancel. Thanks!'
                        ].join(' '),
                        client_id: client_id_fk,
                        type: 'sonogram',
                    }
                };

                context.log('Sending SMS to:', phone);
                const execution = await client.studio
                    .flows(twilioFlowId)
                    .executions
                    .create(twilioParams);

                context.log(`SMS sent successfully. Execution SID: ${execution.sid}`);
            } catch (error) {
                context.log.error(`Error processing appointment ${line[0]}:`, error.message);
                // Continue processing other appointments even if one fails
            }
        }

        context.log('Sonogram reminder function completed successfully');
    } catch (error) {
        context.log.error('Fatal error in sonogram reminder function:', error.message);
        throw error;
    }
};
