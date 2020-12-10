'use strict;'

const stravaAPI  = require('strava-v3');
const stravaAuth = require('./strava-auth');

const { promisify } = require('util');
const sleep = promisify(setTimeout);

const FIVE_MINS = 5*60*1000;
const FIFTEEN_MINS = 15*60*1000;
const ONE_DAY = 24*60*60*1000

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
    console.log(`getting close to short term limit. Waiting for ${cooldown / 1000} seconds`)
    await sleep(cooldown + 5000)
  }
  if (ratelimits.longTermUsage / ratelimits.longTermLimit > 0.95){
    const cooldown = ONE_DAY - (new Date() % ONE_DAY)
    console.log(`getting close to long term limit. Waiting till midnight (UTC) to continue (${cooldown / (1000*60)} mins)`)
    await sleep(cooldown + 5000)
  }
  return false;
}
const _refreshToken = async (accessTokenData) => {
  let refreshRequired = false;
  const exp = new Date( accessTokenData.expires_at * 1000 )
  const now = new Date();
  if (exp < now) refreshRequired = true;
  if (exp < now + FIVE_MINS) {
    console.log('Token about to expire. Sleep until it does');
    await sleep(exp - now + 1000);
    refreshRequired = true;
  }

  if (refreshRequired){
    console.log('*** refreshing access token')
    accessTokenData = await stravaAPI.oauth.refreshToken(accessTokenData.refresh_token);
    authdClient = new stravaAPI.client(accessTokenData.access_token);
  }
}


module.exports = (() => {
  let _authdClient = false;
  let _accessTokenData = false;

  const _getAuthdClient = async () => {
    if (!_authdClient) {
      // get an access token
      _accessTokenData = await stravaAuth(); //console.log(_accessTokenData); process.exit(1);
      // Get an authenticated strava instance
      _authdClient = new stravaAPI.client(_accessTokenData.access_token);
    }
    await _rateLimit(_authdClient.rateLimiting); // check we're not going over rate limits
    await _refreshToken(_accessTokenData); // check token expiry and refresh if needed
  
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




