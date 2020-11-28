#!/usr/bin/env node

'use strict;'

const files = require('./lib/files')
const strava = require('./lib/strava');

(async () => {

  // check data directories
  await files.verifyData()

  // set up strava client config
  await strava.authorise();

  // upload the tracks
  await strava.upload()

  process.exit(0);

})();