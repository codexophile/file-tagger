'use strict';

const fs = require('fs');
const path = require('path');
const { loadSharedModule } = require('./shared-module');
const { parsePeopleTags } = loadSharedModule('people-tags.js');

const avatarRoot =
  'C:\\mega\\IDEs\\eclectic\\global-file-management-system\\database\\avatars\\';

/**
 * Finds a matching avatar for a person in the shared avatar directory.
 *
 * @param {string} groupName - Person group name.
 * @param {string} personId - Person id.
 * @returns {string} Matching avatar path, or an empty string.
 */
function findAvatarPath(groupName, personId) {
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

    const normalizedId = personId.replace(/^@/, '').toLowerCase();
    const avatar = fs
      .readdirSync(path.join(avatarRoot, category.name), {
        withFileTypes: true,
      })
      .find(
        entry =>
          entry.isFile() &&
          path.parse(entry.name).name.toLowerCase() === normalizedId,
      );
    return avatar ? path.join(avatarRoot, category.name, avatar.name) : '';
  } catch (error) {
    console.error(
      `Error finding avatar for ${personId} in ${groupName}:`,
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
        'groups:\n  People:\n    - id: "example"\n      name: "Example Person"\n      links: []\n',
        'utf-8',
      );
    }

    const groups = parsePeopleTags(fs.readFileSync(peoplePath, 'utf-8'));
    Object.entries(groups).forEach(([groupName, people]) => {
      people.forEach(person => {
        if (!person.photo) person.photo = findAvatarPath(groupName, person.id);
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
