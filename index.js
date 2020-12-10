#!/usr/bin/env node

'use strict;'

const strava = require('./lib/strava');

(async () => {

  // upload the tracks
  await strava.upload()

  // correct the activity types
  await strava.fixActivities()

})();