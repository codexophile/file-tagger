'use strict';

const fs = require('fs');
const { loadSharedModule } = require('./shared-module');
const { parseProfiles } = loadSharedModule('people-tags.js');

/**
 * Loads grouped profiles from the YAML database.
 *
 * @param {string} profilesPath - Profile database path.
 * @returns {Record<string, Array<Object>>} Parsed profiles.
 * @example
 * loadProfilesFromFile('C:\\data\\profiles.yaml');
 */
function loadProfilesFromFile(profilesPath) {
  try {
    if (!fs.existsSync(profilesPath)) return {};
    return parseProfiles(fs.readFileSync(profilesPath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading profiles database ${profilesPath}:`, error);
    alert(`Failed to load profiles database from ${profilesPath}.\nError: ${error.message}`);
    return {};
  }
}

module.exports = { loadProfilesFromFile };
