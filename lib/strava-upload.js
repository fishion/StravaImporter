'use strict;'

const files = require('./files');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const MAX_IN_FLIGHT = 1;


const filesInFlight = {};
const filesProcessed = {}; 
const _processing = (filename) => {
  filesInFlight[filename] = true;
}
const _completed = (filename, status) => {
  delete filesInFlight[filename];
  filesProcessed[filename] = status;
}
const _inFlightCount = () => {
  return Object.keys(filesInFlight).length
}
const _processedCount = () => {
  return Object.keys(filesProcessed).length
}
const _api_cooldown = async (ratelimits) => {
  // Strava API usage is limited on a per-application basis using both a 15-minute and daily request limit.
  // The default rate limit allows 100 requests every 15 minutes (short term), with up to 1,000 requests per day (long term).
  // An application’s 15-minute limit is reset at natural 15-minute intervals corresponding to 0, 15, 30 and 45 minutes after the hour. The daily limit resets at midnight UTC.
  // check usage limits and return suggested sleep time
  if (ratelimits.shortTermLimit == 0) return false; // not initialised

  console.log(`${ratelimits.shortTermUsage} of ${ratelimits.shortTermLimit} short term API calls made`);
  console.log(`${ratelimits.longTermUsage} of ${ratelimits.longTermLimit} long term API calls made`);

  if (ratelimits.shortTermUsage / ratelimits.shortTermLimit > 0.9){
    const cooldown = (15*60*1000) - (new Date().getTime() % (15*60*1000));
    console.log(`getting close to short term limit. Waiting for ${cooldown / 1000} seconds`)
    await sleep(cooldown + 5000)
  }
  if (ratelimits.longTermUsage / ratelimits.longTermLimit > 0.95){
    const cooldown = (24*60*60*1000) - (new Date() % (24*60*60*1000))
    console.log(`getting close to long term limit. Waiting till midnight (UTC) to continue (${cooldown / (1000*60)} mins)`)
    await sleep(cooldown)
  }
  return false;
}

// TODO check token and refresh if needed
const _refresh_token = () => {
}



module.exports = async (strava) => {
  const tcxfiles = await files.getTcxFiles();

  for (const file of tcxfiles){

    // check we're not going over rate limits
    await _api_cooldown(strava.rateLimiting);

    // check token expiry and refresh if needed
    _refresh_token()
    
    // Do upload
    console.log(`processing file ${_processedCount() + 1} of ${tcxfiles.length} : ${files.getFullPath(file.name)}`)
    try {
      const payload = await strava.uploads.post({
        file: files.getFullPath(file.name),
        //name: 'Imported activity from Endomondo',
        description: 'Imported activity from Endomondo',
        data_type: 'tcx',
        statusCallback: (err, payload) => {
          if (filesProcessed[file.name]) {
            console.log(`Duplicate callback. Already dealt with ${file.name} - it was a ${filesProcessed[file.name]}`)
          } else if (err || payload.error){
            console.log(`File ${file.name} upload Failed. with error : ${err || payload.error}`)
            _completed(file.name, 'failure');
            files.failure(file.name) // yes, this is promise. It'll be fine
          } else if (payload.activity_id) {
            console.log(`File ${file.name} processed OK!`)
            _completed(file.name, 'success');
            files.success(file.name)  // yes, this is promise. It'll be fine
          } else if (payload.status = 'Your activity is still being processed.') {
            // fine still uploading
          } else {
            console.log('Unexpected status') // maybe rate limited?
            console.log(payload)
          }
        }
      }, (e,p) => {if (e) console.log(`Not sure why this is being called : e : ${e}, p : ${p}`) });
      // increment to acknowledge we have one in progress
      _processing(file.name)    
    } catch (e) {
      console.log(`Failed to create upload for file ${file.name}. Error : ${e}`)
      await files.failure(file.name)
    }

    // don't move on until number in flight is acceptable
    while (_inFlightCount() >= MAX_IN_FLIGHT){
      console.log(`waiting for upload to complete`)
      await sleep(1000);
    }

    // TODO - remove this. Just here to stop after fixed number of files while testing
    if (_processedCount() >= 5) break;
  }
}
