'use strict';

const fs = require('fs');
const path = require('path');
const { loadSharedModule } = require('./shared-module');
const { parsePeopleTags } = loadSharedModule('people-tags.js');

const avatarRoot =
  'C:\\mega\\IDEs\\eclectic\\global-file-management-system\\everything-assistant-ahk\\avatars\\';

/**
 * Finds a matching avatar for a person in the shared avatar directory.
 *
 * @param {string} groupName - Person group name.
 * @param {string} personTag - Person tag, including its leading @.
 * @returns {string} Matching avatar path, or an empty string.
 */
function findAvatarPath(groupName, personTag) {
  try {
    if (!fs.existsSync(avatarRoot)) return '';

    const category = fs
      .readdirSync(avatarRoot, { withFileTypes: true })
      .find(
        entry =>
          entry.isDirectory() &&
          entry.name.toLowerCase() === groupName.toLowerCase(),
      );
    if (!category) return '';

    const personId = personTag.slice(1).toLowerCase();
    const avatar = fs
      .readdirSync(path.join(avatarRoot, category.name), {
        withFileTypes: true,
      })
      .find(
        entry =>
          entry.isFile() &&
          path.parse(entry.name).name.toLowerCase() === personId,
      );
    return avatar ? path.join(avatarRoot, category.name, avatar.name) : '';
  } catch (error) {
    console.error(
      `Error finding avatar for ${personTag} in ${groupName}:`,
      error,
    );
    return '';
  }
}

/**
 * Loads grouped people from a YAML database and enriches missing photos.
 *
 * @param {string} peoplePath - Path to the YAML people database.
 * @returns {Record<string, Array<Object>>} Parsed people grouped by category.
 */
function loadPeopleFromFile(peoplePath) {
  try {
    if (!fs.existsSync(peoplePath)) {
      fs.writeFileSync(
        peoplePath,
        'groups:\n  People:\n    - tag: "@example"\n      name: "Example Person"\n      photo: ""\n      links: []\n',
        'utf-8',
      );
    }

    const groups = parsePeopleTags(fs.readFileSync(peoplePath, 'utf-8'));
    Object.entries(groups).forEach(([groupName, people]) => {
      people.forEach(person => {
        if (!person.photo) person.photo = findAvatarPath(groupName, person.tag);
      });
    });

    return groups;
  } catch (error) {
    console.error(`Error reading people database ${peoplePath}:`, error);
    alert(
      `Failed to load people database from ${peoplePath}.\nError: ${error.message}`,
    );
    return {};
  }
}

module.exports = { loadPeopleFromFile, findAvatarPath };
