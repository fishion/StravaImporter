'use strict;'

const simplePrompt = require('./simple-prompt')


module.exports = async (strava) => {

  const client_id = process.env.STRAVA_CLIENT_ID ?
    process.env.STRAVA_CLIENT_ID :
    await simplePrompt('What is your Appliation client id')
  const client_secret = process.env.STRAVA_CLIENT_SECRET ?
    process.env.STRAVA_CLIENT_SECRET : 
    await simplePrompt('What is your Application client secret?')

  strava.config({
    "redirect_uri"  : "http://localhost/exchange_token",
    "client_id"     : client_id,
    "client_secret" : client_secret
  });
  
  // do Manual Oauth dance : Get user to go to link in browser, authorise and copy response URL
  const oauthURL = strava.oauth.getRequestAccessURL({scope:"activity:write,read"})
  console.log(`Go to URL ${oauthURL} and authorise application to upload for you`)
  console.log("Once you have authorised you will be redirected to a 'localhost' address (don't worry if you see a 'This site can’t be reached' message)")
  const auth_code_url = await simplePrompt('Copy the whole URL of the page from the browser and paste it here : ')
  
  // Extract authorisation code (TODO verify scope)
  const authorizationCodeMatches = auth_code_url.match(/code=([^&]+)/)
  if (!authorizationCodeMatches) {
    console.log('unable to find auth code in provided URL')
    process.exit(1);
  }
  const authorizationCode = authorizationCodeMatches[1]

  // Request Access Token, Access token expiration date, refresh token
  try {
    console.log('swapping auth code for Access token')
    const accessTokenData = await strava.oauth.getToken(authorizationCode)
    console.log('Authentication successful')
    return accessTokenData;
  } catch (e) {
    console.log(`failed to get Access token : ${e.message}`)
    process.exit(1);
  }
}






