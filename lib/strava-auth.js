'use strict;'

const strava  = require('strava-v3');
const simplePrompt = require('./simple-prompt')


const getAccessToken = async () => {
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
  console.log('swap auth code for Access token')
  let accessTokenData;
  try {
    accessTokenData = await strava.oauth.getToken(authorizationCode)
    strava.config({"access_token" : accessTokenData.access_token})
  } catch (e) {
    console.log(`failed to get Access token : ${e.message}`)
    process.exit(1);
  }

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

module.exports = { getAccessToken: getAccessToken };