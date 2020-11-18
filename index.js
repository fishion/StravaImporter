#!/usr/bin/env node

"use strict"
const prompts = require('prompts');
const strava  = require('strava-v3');


// Strava API usage is limited on a per-application basis using both a 15-minute and daily request limit. The default rate limit allows 100 requests every 15 minutes, with up to 1,000 requests per day.
const LIMIT_15_MINUTE = 100;
const LIMIT_DAY = 1000;

/*
 * Functions
 */

const simplePrompt = async (question) => {
  const response = await prompts({
    type: 'text',
    name: 'answer',
    message: question
  });
  return response.answer;
}

const setStravaConfig = async () => {
  const client_id = process.env.STRAVA_CLIENT_ID ?
    process.env.STRAVA_CLIENT_ID :
    await simplePrompt('What is your client id')
  const client_secret = process.env.STRAVA_CLIENT_SECRET ?
    process.env.STRAVA_CLIENT_SECRET : 
    await simplePrompt('What is your client secret?')

  strava.config({
    "redirect_uri"  : "http://localhost/exchange_token",
    "client_id"     : client_id,
    "client_secret" : client_secret
  });
  
  // do Manual Oauth dance
  const authorizationCode = await getAuthCode();

  // Receive Access Token, Access token expiration date, refresh token
  const accessTokenData = await getAccessToken(authorizationCode);
  strava.config({"access_token" : accessTokenData.access_token})
  return accessTokenData;
}

const getAuthCode = async () => {
  // Get user to go to link in browser, authorise and copy response URL
  const oauthURL = strava.oauth.getRequestAccessURL({scope:"activity:write,read"})
  
  console.log(`Go to URL ${oauthURL} and authorise application to upload for you`)
  console.log("Once you have authorised you will be redirected to a 'localhost' address. Don't worry if you see a 'This site can’t be reached' message.")
  
  const auth_code_url = await simplePrompt('Copy the URL of this page and paste the URL here : ')

  // TODO verify scope

  // Request access token (short lived)
  const authorizationCodeMatches = auth_code_url.match(/code=([^&]+)/)
  if (!authorizationCodeMatches) {
    console.log('unable to find auth code in provided URL')
    process.exit(1);
  }
  return authorizationCodeMatches[1]
}

const getAccessToken = async (authorizationCode) => {
  console.log('got auth code, swapping for Access token')
  try {
    return await strava.oauth.getToken(authorizationCode)
  } catch (e) {
    console.log(`failed to get Access token : ${e.message}`)
    process.exit(1);
  }
}

/*
 * Main
 */

(async () => {
  // verify we have some files to process
  // verify/set up directories for processed files

  // set up strava client config
  const accessTokenData = await setStravaConfig();
  console.log(accessTokenData)

  // foreach file
  //    check usage limits and sleep if needed
  //    check token and refresh if needed
  //    will token expire before usage limit next available, do I need to throttle?
  //    upload file - can we do multiple in parallel?
  //    Wait for it to complete


  // const strava = require('strava-v3');
  // const payload = await strava.uploads.post({
  //     data_type: 'gpx',
  //     file: 'data/your_file.gpx',
  //     name: 'Epic times',
  //     statusCallback: (err,payload) => {
  //         //do something with your payload
  //     }
  // });



})();