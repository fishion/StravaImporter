'use strict;'

const stravaAPI  = require('strava-v3');
const stravaAuth = require('./strava-auth');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const ONE_SEC = 1000;
const FIVE_SEC = 5*ONE_SEC;
const ONE_MIN = 60*ONE_SEC;
const FIFTEEN_MINS = 15*ONE_MIN;
const ONE_DAY = 24*60*ONE_MIN

// Strava API usage is limited on a per-application basis using both a 15-minute and daily request limit.
// The default rate limit allows 100 requests every 15 minutes (short term), with up to 1,000 requests per day (long term).
// An application’s 15-minute limit is reset at natural 15-minute intervals corresponding to 0, 15, 30 and 45 minutes after the hour. 
// The daily limit resets at midnight UTC.
const _rateLimit = async (ratelimits) => {
  if (!ratelimits || ratelimits.shortTermLimit == 0) return false; // not initialised

  console.log(`${ratelimits.shortTermUsage} of ${ratelimits.shortTermLimit} short term API calls made`);
  console.log(`${ratelimits.longTermUsage} of ${ratelimits.longTermLimit} long term API calls made`);

  if (ratelimits.shortTermUsage / ratelimits.shortTermLimit > 0.9){
    const cooldown = FIFTEEN_MINS - ( new Date().getTime() % FIFTEEN_MINS );
    console.log(`getting close to short term limit. Waiting for ${cooldown / ONE_SEC} seconds`)
    await sleep(cooldown + FIVE_SEC)
  }
  if (ratelimits.longTermUsage / ratelimits.longTermLimit > 0.95){
    const cooldown = ONE_DAY - (new Date().getTime() % ONE_DAY)
    console.log(`getting close to long term limit. Waiting till midnight (UTC) to continue (${cooldown / ONE_MIN} mins)`)
    await sleep(cooldown + FIVE_SEC)
  }
  return false;
}

const _refreshToken = async (accessTokenData) => {
  const exp = new Date( accessTokenData.expires_at * ONE_SEC ).getTime()
  const now = new Date().getTime();

  if (exp > (now + ONE_MIN)) return false; // no need to refresh

  if (exp > now && exp < now + ONE_MIN) {
    console.log('Token about to expire. Sleep until it has');
    await sleep(exp - now + ONE_SEC);
  }
  console.log('*** refreshing access token');
  return await stravaAPI.oauth.refreshToken(accessTokenData.refresh_token);
}


module.exports = (() => {
  let _accessTokenData = false;
  let _authdClient = false;

  const _getAuthdClient = async () => {
    if (!_authdClient) {
      // get an authenticated access token
      _accessTokenData = await stravaAuth(); //console.log(_accessTokenData); process.exit(1);
      _authdClient = new stravaAPI.client(_accessTokenData.access_token); // Get an authenticated strava instance
    }
    // check we're not going over rate limits
    await _rateLimit(_authdClient.rateLimiting); 
    // check token expiry and refresh if needed
    const newAccessTokenData = await _refreshToken(_accessTokenData); 
    if (newAccessTokenData){
      _accessTokenData = newAccessTokenData;
      _authdClient = new stravaAPI.client(newAccessTokenData.access_token);
    }
  
    return _authdClient;
  }

  const _unexpectedCallback = (e,p) => {
    if (e) console.log(`Not sure why this is being called : e : ${e}, p : ${p}`)
  }


  return {
    uploads : {
      post : async (args) => {
        const authdClient = await _getAuthdClient();
        return await authdClient.uploads.post(args, _unexpectedCallback);
      }
    },
    athlete : {
      listActivities : async (args) => {
        const authdClient = await _getAuthdClient();
        return await authdClient.athlete.listActivities(args, _unexpectedCallback);
      }
    },
    activities : {
      update : async (args) => {
        const authdClient = await _getAuthdClient();
        return await authdClient.activities.update(args, _unexpectedCallback);
      }
    }
  }
})()




