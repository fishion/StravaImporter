'use strict;'

const stravaClient        = require('./strava-client');
const stravaUpload        = require('./strava-upload');
const stravaFixActivities = require('./strava-fix-activities');

module.exports = {
  upload        : async () => { await stravaUpload(stravaClient) }, 
  fixActivities : async () => { await stravaFixActivities(stravaClient) }, 
};