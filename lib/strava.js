'use strict;'

const stravaClient  = require('./strava-client');
const stravaUpload  = require('./strava-upload');

module.exports = {
  upload    : async () => {await stravaUpload(stravaClient);} 
};