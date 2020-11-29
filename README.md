


## Prerequisites 

### Download an export of all your data from Endomondo
* The script will work to upload any directory of tcx files, but the main use case for this repo is migrating workouts from Endomondo to Strava
* From within your Endomondo account settings, you can request a full archive download of all of your data. Once requested, it currently seems to take a few days for this to be prepared, but it will eventually be ready to download. 
* The script will expect to find a directory called 'data' in the application root. Create this directory 'data', Unzip the downloaded archive, and move the contents of the directory 'endomondo_$date' into it. You should now have a directory 'Workouts' containing the tcx files (as well as json files which will be ignored) in the data directory. 

### Install node etc and package dependencies
* Tested on node version (14.15.1)
* Recommended to install latest lts version via nvm (https://github.com/nvm-sh/nvm/blob/master/README.md)

  >nvm install --lts

  >nvm install-latest-npm

* Install dependencies
  >npm install

### Get a Strava Client ID and Secret
1. Follow instructions on "How to create and account" (https://developers.strava.com/docs/getting-started/#account)
1. Make a note of your Client ID and Client Secret - you'll be prompted for them later. If you prefer, you can export them as environment variables STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET

### run the script
1. run "node index.js" to start the upload script
1. Follow the instructions of the script to give the script appropriate permissions
1. Strava API is rate limited (100 API calls in any 15 min period, 1000 in a day) so depending on how many workouts you have to upload, it may take some time to complete. Script gives plenty of output to confirm when it is rate limited.
1. As script runs, it moves successfully processed files to 'Workouts_Success'. Any failures will be moved to 'Workout_Failures'. This way, the script can be safely stopped part way through and restarted if necessary.

## NOTE : Activity mapping
* TCX format files only seem to support ‘biking’, ‘running’, ‘hiking’, ‘walking’ and ‘swimming’ activities with everything else marked as 'other'. These are only activity values recognised by Strava tcx imports and the only activities identified in the Endomondo tcx exports. The script doesn't make any attempt to correct this and when imported to Strava these 'other' activities appear to default to 'run'.
* Some manual cleanup may be needed to resolve this post-import. It's easy to identify which files have '<Activity Sport="Other">' using grep, and then use the Endomondo calendar interface (while it still exists) to review what they should be and update manually in Strava.
* The correct activity names are in fact exported alongside the tcx files in json files. Strava doesn't support importing these directly, but some post-processing may be possible to automatically fix the data in bulk.