'use strict;'

const strava  = require('strava-v3');
const files = require('./files')
const { promisify } = require('util')
const sleep = promisify(setTimeout);

// Strava API usage is limited on a per-application basis using both a 15-minute and daily request limit.
// The default rate limit allows 100 requests every 15 minutes, with up to 1,000 requests per day.
const LIMIT_15_MINUTE = 100;
const LIMIT_DAY = 1000;


module.exports = async (tcxfiles) => {
  if (tcxfiles===undefined) tcxfiles = await files.getTcxFiles();

  let filesProcessed = 0; 
  let hittingLimits = false

  for (const file of tcxfiles){
    //    check usage limits and sleep if needed
    //    check token and refresh if needed
    //    will token expire before usage limit next available, do I need to throttle?

    while (hittingLimits){
      console.log('waiting 2 s')
      await sleep(2000);
      console.log('done waiting')
      hittingLimits = false;
    }
    
    console.log(`processing file ${++filesProcessed} of ${tcxfiles.length} : ${file.name}`)
    // const payload = await strava.uploads.post({
    //     data_type: 'gpx',
    //     file: 'data/your_file.gpx',
    //     name: 'Epic times',
    //     statusCallback: (err,payload) => {
    //         //do something with your payload
    //     }
    // });
    //    Wait for it to complete

    // update limits
    hittingLimits = true;
  }
}