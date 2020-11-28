'use strict;'

let strava  = require('strava-v3');
const stravaAuth = require('./strava-auth');
const stravaUpload = require('./strava-upload');

const authorise = async () => {
  const accessTokenData = await stravaAuth(strava);
  // console.log(accessTokenData)
  // process.exit(1);
  
  // swap out strava client for auth'd one/
  strava = new strava.client(accessTokenData.access_token);
}

const upload = async () => {
  await stravaUpload(strava)
}


module.exports = {
  authorise : authorise,
  upload    : upload 
};