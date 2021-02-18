#!/usr/bin/env node

'use strict;'

const strava = require('./lib/strava');

(async () => {

  // preprocess TCX to fix manual entry workouts, so they include duration and distance
  await strava.preprocess()

  // upload the tracks
  await strava.upload()

  // correct the activity types
  await strava.fixActivities()

})();