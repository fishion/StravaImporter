'use strict;'

const files = require('./files');
const parser = require('fast-xml-parser');
const fs = require('fs');

const _endDistance = (distance) => {
  const r = Math.floor(distance * 1000);

  if (isNaN(r))
    return 0;

  return r;
}

const _fixTime = (timeString) => {
  return timeString.replace(' ', 'T');
}

module.exports = async () => {
  const sportsFound = {};

  // get tcx files
  const tsxfiles = await files.getTcxFiles();
  console.log(`found ${tsxfiles.length} TCX files in data source`);
  if (tsxfiles.length == 0) return;

  for (const file of tsxfiles) {
    const content = fs.readFileSync(files.getFullPath(file.name), { encoding: 'utf-8' });
    const json = parser.parse(content, {
      ignoreAttributes: false,
      ignoreNameSpace: false,
    });

    const lap = json?.TrainingCenterDatabase?.Activities?.Activity?.Lap;

    if (lap) {
      const trackpoint = lap?.Track?.Trackpoint;

      if (trackpoint && Array.isArray(trackpoint)) {
        console.log("Working as intended", file.name);
      }
      else {
        console.log("Needs fix", file.name);
        const jsonActivity = await files.getPropsFromJson(files.getFullPath(file.name.replace('tcx', 'json')))

        lap.Track = {
          Trackpoint: [{
            Time: _fixTime(jsonActivity.start_time),
            DistanceMeters: 0,
          }, {
            Time: _fixTime(jsonActivity.end_time),
            DistanceMeters: _endDistance(jsonActivity.distance_km)
          }]
        };

        const j2x = new parser.j2xParser({
          attributeNamePrefix: '@_',
          ignoreAttributes: false,
        });

        const res = '<?xml version="1.0" encoding="UTF-8"?>' + j2x.parse(json);
        fs.writeFileSync(files.getFullPath(file.name), res, { encoding: 'utf-8' });
      }
    }
  }
}
