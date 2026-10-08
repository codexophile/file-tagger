'use strict';

const fs = require('fs');
const path = require('path');

const avatarRoot = 'C:\\mega\\IDEs\\AutoHotkey v2\\everything-assistant\\avatars';

function findAvatarPath(groupName, personTag) {
  try {
    if (!fs.existsSync(avatarRoot)) return '';

    const category = fs.readdirSync(avatarRoot, { withFileTypes: true })
      .find(entry => entry.isDirectory() &&
        entry.name.toLowerCase() === groupName.toLowerCase());
    if (!category) return '';

    const personId = personTag.slice(1).toLowerCase();
    const avatar = fs.readdirSync(path.join(avatarRoot, category.name), { withFileTypes: true })
      .find(entry => entry.isFile() &&
        path.parse(entry.name).name.toLowerCase() === personId);
    return avatar
      ? path.join(avatarRoot, category.name, avatar.name)
      : '';
  } catch (error) {
    console.error(`Error finding avatar for ${personTag} in ${groupName}:`, error);
    return '';
  }
}

function loadPeopleFromFile(peoplePath) {
  try {
    if (!fs.existsSync(peoplePath)) {
      fs.writeFileSync(peoplePath, '[People]\n@example\nname=Example Person\n', 'utf-8');
    }

    const groups = {};
    let currentGroup = null;
    let currentPerson = null;

    fs.readFileSync(peoplePath, 'utf-8')
      .split(/\r?\n/)
      .forEach(rawLine => {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) return;

        const groupMatch = line.match(/^\[([^\]]+)\]$/);
        if (groupMatch) {
          currentGroup = groupMatch[1].trim();
          groups[currentGroup] = groups[currentGroup] || [];
          currentPerson = null;
          return;
        }

        if (line.startsWith('@')) {
          if (!currentGroup) return;
          currentPerson = {
            tag: line,
            name: '',
            photo: findAvatarPath(currentGroup, line),
            links: [],
          };
          groups[currentGroup].push(currentPerson);
          return;
        }

        if (!currentPerson) return;
        const separator = line.indexOf('=');
        if (separator < 1) return;
        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line.slice(separator + 1).trim();
        if (key === 'name' || key === 'photo') currentPerson[key] = value;
        if (key === 'links') {
          currentPerson.links = value
            ? value.split(',').map(link => link.trim()).filter(Boolean)
            : [];
        }
      });

    return groups;
  } catch (error) {
    console.error(`Error reading people database ${peoplePath}:`, error);
    alert(`Failed to load people database from ${peoplePath}.\nError: ${error.message}`);
    return {};
  }
}

module.exports = { loadPeopleFromFile, findAvatarPath };
