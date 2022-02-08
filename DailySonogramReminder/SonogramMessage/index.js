const axios = require('axios');
module.exports = async function (context, myTimer) {
    // const {getdata} = await axios.get(`https://abc-sonogram-api.azurewebsites.net/sonograms`)
    // const {getdata} = await axios.get(`https://api.tfl.gov.uk/Line/central%2cjubilee%2clondon-overground/Status?detail=true`);  

    // const response = await axios.get(`https://abc-sonogram-api.azurewebsites.net/sonograms`);
    const response = await axios.get(`http://localhost:3000/sonograms`);
    console.log(response.data);

    // const msg = [];
    response.forEach(line => {
    //     // Loop through each Train line Status
        // line.lineStatuses.forEach(status =>{
    //         // Create Message describing each Line Status
            msg.push(`The ${line.id} Line has a `);

            // var timeStamp = new Date().toISOString();
            // context.log('JavaScript timer trigger function ran!', timeStamp);

            // context.log(msg)
    //         if (status.statusSeverityDescription !== "Good Service"){
    //             msg.push(status.reason);
    //         };
        });
    // });

    let msg = [];
    // getdata.forEach(id => {
        //Loop through each Train line Status
        // data.id.forEach(sonogram =>{
            //Create Message describing each Line Status
            // msg.push(`The ${getdata} Line has a .`);

            // if (status.statusSeverityDescription !== "Good Service"){
                // msg.push(status.reason);
            // }
        // });
    // });

    // context.log(msg.join(`\n`))

    // console.log(`Got ${Object.getdata} NOTHING!`)


    context.bindings.message = {
        body: msg.join(`\n`),
        to: "+13161234567"
     };

    context.done();

};
