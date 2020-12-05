'use strict;'

const stravaAuth = require('./strava-auth');
const stravaUpload = require('./strava-upload');
let accessTokenData = false;

const authorise = async () => {
  accessTokenData = await stravaAuth();
  //console.log(accessTokenData); process.exit(1);
}

const upload = async () => {
  if (!accessTokenData){
    console.log("Can't upload without authenticated access token")
    process.exit(1);
  }
  await stravaUpload(accessTokenData);
}


module.exports = {
  authorise : authorise,
  upload    : upload 
};