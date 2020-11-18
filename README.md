


## Prerequisites 

### Download an export of all your data from Endomondo
* The script will work to upload any directory of tcx files, but the main use case for this repo is migrating workouts from Endomondo to Strava
* From within your Endomondo account settings, you can request a full archive download of all of your data. Once requested, it currently seems to take a few days for this to be prepared, but it will eventually be ready to download. 

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




