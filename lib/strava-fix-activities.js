'use strict;'

const files = require('./files');

/* Map of sports in json files to sports which exist in strava. This object can be extended by user as needed.
   Available sports in Strava :
   
   AlpineSki, BackcountrySki, Canoeing, Crossfit, EBikeRide, Elliptical, Golf, Handcycle, Hike, IceSkate,
   InlineSkate, Kayaking, Kitesurf, NordicSki, Ride, RockClimbing, RollerSki, Rowing, Run, Sail, Skateboard,
   Snowboard, Snowshoe, Soccer, StairStepper, StandUpPaddling, Surfing, Swim, Velomobile, VirtualRide,
   VirtualRun, Walk, WeightTraining, Wheelchair, Windsurf, Workout, Yoga.

   Some should have been mapped correctly already in the upload process : ‘biking’, ‘running’, ‘hiking’, ‘walking’ and ‘swimming’
   but this will check all of them anyway
*/
const SPORTMAP = {
  BADMINTON: "Workout",
  BIKING: "Ride",
  CROSSFIT: "Crossfit",
  CYCLING_SPORT: "Ride",
  CYCLING_TRANSPORTATION: "Ride",
  FITNESS_WALKING: "Walk",
  GOLFING: "Workout",
  GYMNASTICS: "Workout",
  HIKING: "Hike",
  KAYAKING: "Kayaking",
  MOUNTAIN_BIKING: "Ride",
  ROWING_INDOOR: "Rowing",
  RUNNING: "Run",
  SKIING_CROSS_COUNTRY: "NordicSki",
  SKIING_DOWNHILL: "AlpineSki",
  SNOWBOARDING: "Snowboard",
  SNOWSHOEING: "Snowshoe",
  SPINNING: "VirtualRide",
  SQUASH: "Workout",
  STAIR_CLIMBING: "StairStepper",
  SWIMMING: "Swim",
  TENNIS: "Workout",
  TREADMILL_RUNNING: "VirtualRun",
  TREADMILL_WALKING: "VirtualRun",
  WALKING: "Walk",
  WEIGHT_TRAINING: "WeightTraining",
  YOGA: "Yoga",
}

const _firstUpper = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

module.exports = async (strava) => {
  const sportsFound = {};

  // get json files
  const jsonfiles = await files.getJsonFiles();
  console.log(`found ${jsonfiles.length} json files in data source`);
  if (jsonfiles.length == 0) return;

  // Loop over files, check we can get a sport from them, find in strava, compare the activity, update if needed
  const stravaActivities = {};
  let pageNumber = 0;
  let pagesRemaining = true;
  for (const file of jsonfiles){
    // get json activity data and error check
    const jsonActivity = await files.getPropsFromJson(files.getFullPath(file.name))
    if (!jsonActivity.sport) {
      console.log(`couldn't find sport in file ${file.name}`);
      await files.failure(file.name);
      continue;
    }
    sportsFound[jsonActivity.sport] = sportsFound[jsonActivity.sport] ? sportsFound[jsonActivity.sport] + 1 : 1;
    if (!SPORTMAP[jsonActivity.sport]){
      console.log(`Sport '${jsonActivity.sport}' in file ${file.name} not mapped. Extend map object to update activity`);
      await files.failure(file.name);
      continue;
    }
    jsonActivity.stravaExternalID = file.name.replace(/\.json$/,'.tcx');

    
    // Try to find the activity in Strava
    const PER_PAGE = 50;
    while (!stravaActivities[jsonActivity.stravaExternalID] && pagesRemaining){
      console.log(`fetching page number ${pageNumber}`)
      const activityPage = await strava.athlete.listActivities({
        page: ++pageNumber,
        per_page: PER_PAGE,
      });
      if (activityPage.length != PER_PAGE){
        console.log(`page ${pageNumber} was last page of activities`)
        pagesRemaining = false;
      }
      for (const stravaActivity of activityPage){
        stravaActivities[stravaActivity.external_id] = stravaActivity;
      }
    }
    
    if (!stravaActivities[jsonActivity.stravaExternalID] && !pagesRemaining){
      console.log(`Looked everywhere and couldn't find ${jsonActivity.created_date} in Strava`)
      await files.failure(file.name);
      continue;
    }

    // If we're here, we have the mapped JSON activity, and we've located the activity in Strava
    const thisStravaActivity = stravaActivities[jsonActivity.stravaExternalID];
    //console.log(`found ${jsonActivity.created_date} : ${thisStravaActivity.id}`);

    try {
      console.log(`**** ${jsonActivity.created_date} is ${jsonActivity.sport} and ${thisStravaActivity.type} in Strava. Updating to ${SPORTMAP[jsonActivity.sport]} and setting name and description`);
      await strava.activities.update({
        id: thisStravaActivity.id,
        type: SPORTMAP[jsonActivity.sport],
        name: thisStravaActivity.name.replace(new RegExp(thisStravaActivity.type), _firstUpper(jsonActivity.sport)),
        description: jsonActivity.notes
      });
      await files.success(file.name);
    } catch (e) {
      console.log(`failed to update activity ${jsonActivity.created_date} from ${thisStravaActivity.type} to ${SPORTMAP[jsonActivity.sport]} : ${e}`)
      await files.failure(file.name);
    }
  }

  console.log('sports found : '); console.log(sportsFound);  

}