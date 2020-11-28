'use strict;'

const files = require('./files')
const { promisify } = require('util')
const sleep = promisify(setTimeout);

// Strava API usage is limited on a per-application basis using both a 15-minute and daily request limit.
// The default rate limit allows 100 requests every 15 minutes, with up to 1,000 requests per day.
const LIMIT_15_MINUTE = 100;
const LIMIT_DAY = 1000;
const MAX_IN_FLIGHT = 1;
let inFlight = 0;

let delayRequired = true;
const _delayBy = () => {
  //  check usage limits and sleep if needed
  delayRequired = delayRequired ? false : 2000;
  return delayRequired;
}


module.exports = async (strava) => {

  const tcxfiles = await files.getTcxFiles();
  let filesProcessed = 0; 

  for (const file of tcxfiles){
    let delay = false;
    while (delay = _delayBy()){
      console.log(`waiting for ${delay} ms`)
      await sleep(delay);
    }

    // TODO check token and refresh if needed
    
    // Do upload
    console.log(`processing file ${++filesProcessed} of ${tcxfiles.length} : ${files.getFullPath(file.name)}`)
    try {
      const payload = await strava.uploads.post({
        file: files.getFullPath(file.name),
        //name: 'Imported activity from Endomondo',
        description: 'Imported activity from Endomondo',
        data_type: 'gpx',
        statusCallback: (err, payload) => {
          if (err || payload.error){
            inFlight--;
            console.log(`File ${file.name} upload Failed. with error : ${err || payload.error}`)
            files.failure(file.name) // yes, this is promise. It'll be fine
          } else if (payload.activity_id) {
            inFlight--;
            console.log(`File ${file.name} processed OK!`)
            console.log(payload)
            files.success(file.name)  // yes, this is promise. It'll be fine
          } else if (payload.status = 'Your activity is still being processed.') {
            // fine still uploading
          } else {
            console.log('Unexpected status')
            console.log(payload)
          }
        }
      }, (e,p) => {if (e) console.log(`Not sure why this is being called : e : ${e}, p : ${p}`) });
      // increment to acknowledge we have one in progress
      inFlight++;    
    } catch (e) {
      console.log(`Failed to create upload for file ${file.name}. Error : ${e}`)
      await files.failure(file.name)
    }

    // don't move on until number in flight is acceptable
    while (inFlight >= MAX_IN_FLIGHT){
      console.log(`waiting for upload to complete`)
      await sleep(1000);
    }

    // TODO update limits

    // TODO - remove this. Just here to stop after 1 file while testing
    if (filesProcessed) break;
  }
}
