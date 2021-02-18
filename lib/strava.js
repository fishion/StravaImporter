'use strict;'

const stravaClient        = require('./strava-client');
const stravaUpload        = require('./strava-upload');
const stravaFixActivities = require('./strava-fix-activities');
const stravaPreprocess    = require('./strava-preprocess');

module.exports = {
  preprocess    : async () => { await stravaPreprocess() },
  upload        : async () => { await stravaUpload(stravaClient) }, 
  fixActivities : async () => { await stravaFixActivities(stravaClient) }, 
};