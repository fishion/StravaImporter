'use strict;'

const { promisify } = require('util');
const sleep = promisify(setTimeout);
const files = require('./files');

const MAX_IN_FLIGHT = 1;

const filesInFlight = {};
const filesProcessed = {}; 
const _inFlightCount = () => Object.keys(filesInFlight).length;
const _processedCount = () => Object.keys(filesProcessed).length;
const _processing = (filename) => {
  filesInFlight[filename] = true;
}
const _completed = (filename, status) => {
  delete filesInFlight[filename];
  filesProcessed[filename] = status;
}

module.exports = async (strava) => {
  // get the files
  const tcxfiles = await files.getTcxFiles();
  console.log(`found ${tcxfiles.length} tcx files in data source`);
  if (tcxfiles.length == 0) return;

  for (const file of tcxfiles){
    // Do upload
    console.log(`processing file ${_processedCount() + 1} of ${tcxfiles.length} : ${files.getFullPath(file.name)}`)
    try {
      await strava.uploads.post({
        file: files.getFullPath(file.name),
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
      });
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

  }
}
