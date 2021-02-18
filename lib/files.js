'use strict;'

const fs = require('fs/promises');

const DATA_DIR    = 'data';
const SOURCE_DIR  = 'Workouts';
const SUCCESS_DIR = 'Workouts_Success';
const FAIL_DIR    = 'Workouts_Failures';

const _verifySourceDir = async () => {
  // verify data source dirs exist already
  try {
    const datadir = await fs.stat(`${DATA_DIR}`);
    if (!datadir.isDirectory()) throw('no data directory')
    const sourcedir = await fs.stat(`${DATA_DIR}/${SOURCE_DIR}`);
    if (!sourcedir.isDirectory()) throw('no Workout source directory')
  } catch (e) {
    console.log("Data files not found. Please create a directory named 'data' in project root folder, and a sub-directory called 'Workouts' containing your tcx files to be uploaded")
    process.exit(1);
  }
}

const _verifyOutputDirs = async () => {
  // verify we have success and failure dirs - create if not.
  const processDirs = [SUCCESS_DIR, FAIL_DIR]
  for (const dir of processDirs){
    try {
      const subdir = await fs.stat(`${DATA_DIR}/${dir}`)
      if (!subdir.isDirectory()) throw('no data directory')
      console.log(`found ${DATA_DIR}/${dir} directory`)
    } catch (e){
      try {
        console.log(`creating ${DATA_DIR}/${dir} directory`);
        await fs.mkdir(`${DATA_DIR}/${dir}`)
      } catch (e) {
        console.log(`Failed to create ${DATA_DIR}/${dir} aborting`)
        process.exit(1);
      }
    }
  }
}

const _mv = async (file, dir) => {
  try {
    await fs.rename(`${DATA_DIR}/${SOURCE_DIR}/${file}`, `${DATA_DIR}/${dir}/${file}`);
    console.log(`${file} moved to ${dir} dir`)
  } catch (e) {
    console.log(`Failed to move ${file} to ${dir} dirctory. Aborting`)
    process.exit(1);
  }
}

const _getFilesOfType = async (filetype) => {
  await _verifySourceDir();
  const source_dir = await fs.opendir(`${DATA_DIR}/${SOURCE_DIR}`);
  let files = [];
  for await (const dirent of source_dir) {
    if ( dirent.isFile() && dirent.name.match(new RegExp(`\.${filetype}$`)) ) files.push(dirent);
  }
  if (files.length > 0) await _verifyOutputDirs();
  return files;
}

const _getPropsFromJson = async (file) => {
  const json = JSON.parse(await fs.readFile(file));
  const props = {}
  for (const prop of json){
    if (prop.sport) props.sport = prop.sport
    if (prop.created_date) props.created_date = prop.created_date
    if (prop.start_time) props.start_time = prop.start_time
    if (prop.end_time) props.end_time = prop.end_time
    if (prop.duration_s) props.duration_s = prop.duration_s
    if (prop.distance_km) props.distance_km = prop.distance_km
    if (prop.notes) props.notes = prop.notes
  }
  return props;
}


module.exports = {
  getTcxFiles       : async () => await _getFilesOfType('tcx') ,
  getJsonFiles      : async () => await _getFilesOfType('json'),
  getPropsFromJson  : _getPropsFromJson,
  getFullPath       : file => `${DATA_DIR}/${SOURCE_DIR}/${file}`,
  success           : async file => await _mv(file, SUCCESS_DIR),
  failure           : async file => await _mv(file, FAIL_DIR),
}