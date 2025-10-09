const axios = require('axios');
const { DateTime } = require('luxon');

const apiBaseUrl = process.env.apiBaseUrl || 'https://abcmc.pregnancywichita.com';
const sourceUrl = `${apiBaseUrl}/api/v1/sonogram_reminders.php`;

module.exports = async function (context, myTimer) {
    context.log('Sonogram reminder function started');
    context.log('Fetching data from:', sourceUrl);

    try {

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

                const messageText = [
                    'This is a reminder for your appointment at A BETTER CHOICE on',
                    `${dayOfWeek}, ${monthNumber}/${dayNumber} at ${combinedTime}. Please`,
                    'reply Y to confirm and N to cancel. Thanks!'
                ].join(' ');

                const smsData = {
                    client_id: client_id_fk,
                    phone_number: phone,
                    message: messageText,
                    type: 'sonogram'
                };

                context.log('Sending SMS to:', phone);
                const smsResponse = await axios.post(
                    `${apiBaseUrl}/api/v1/sms_send.php`,
                    smsData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                context.log(`SMS sent successfully. Message SID: ${smsResponse.data.message_sid}`);
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
