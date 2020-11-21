'use strict;'

const fs = require('fs/promises');

const DATA_DIR    = './data';
const SOURCE_DIR  = 'Workouts';
const SUCCESS_DIR = 'Workouts_Success';
const FAIL_DIR    = 'Workouts_Failures';

const verifyData = async () => {
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

  // verify there's some data there
  const tcxfiles = await getTcxFiles()
  console.log(`found ${tcxfiles.length} tcx files in data source`);
  if (tcxfiles.length == 0) throw('no tcx files found');

  // verify we have success and failure dirs too - create if not.
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


const getTcxFiles = async () => {
  const source_dir = await fs.opendir(`${DATA_DIR}/${SOURCE_DIR}`);
  let tcxfiles = [];
  for await (const dirent of source_dir) {
    if (dirent.isFile() && dirent.name.match(/\.tcx$/)) tcxfiles.push(dirent);
  }
  return tcxfiles;
}


module.exports = {
  verifyData : verifyData,
  getTcxFiles : getTcxFiles
}