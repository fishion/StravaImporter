#!/usr/bin/env node

'use strict;'

const files = require('./lib/files')
const stravaAuth = require('./lib/strava-auth');
const stravaUpload = require('./lib/strava-upload');


(async () => {

  // check data directories
  await files.verifyData()

  // set up strava client config
  // const accessTokenData = await stravaAuth.getAccessToken();
  // console.log(accessTokenData)

  // upload the tracks
  await stravaUpload()

  process.exit(0);

})();