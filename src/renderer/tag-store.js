// --- START OF FILE renderer/tag-store.js ---
"use strict";
const fs = require("fs");
const ini = require("ini");
const { sortObjectGroupsAlphabetically } = require("./utils"); // Import utility

function loadTagsFromIni(tagsIniPath) {
  try {
    if (!fs.existsSync(tagsIniPath)) {
      console.warn(
        `tags.ini not found at ${tagsIniPath}. Creating an empty file.`
      );
      // Create an empty file or a default structure if preferred
      fs.writeFileSync(tagsIniPath, "[ExampleGroup]\nExampleTag=\n", "utf-8");
    }
    const iniContent = fs.readFileSync(tagsIniPath, "utf-8");
    const config = ini.parse(iniContent);
    return sortObjectGroupsAlphabetically(config);
  } catch (error) {
    console.error(`Error reading or parsing ${tagsIniPath}:`, error);
    alert(`Failed to load tags from ${tagsIniPath}.\nError: ${error.message}`);
    return {}; // Return empty object on error
  }
}

function saveNewTag(tagsIniPath, groupName, tagName) {
  try {
    // Re-read the file before writing to minimize race conditions (though not fully preventing them)
    const iniContent = fs.readFileSync(tagsIniPath, "utf-8");
    const config = ini.parse(iniContent);

    if (!config[groupName]) {
      config[groupName] = {}; // Create group if it doesn't exist
      console.warn(
        `Group "${groupName}" did not exist in tags.ini, creating it.`
      );
    } else if (
      typeof config[groupName] !== "object" ||
      config[groupName] === null
    ) {
      console.warn(
        `Group "${groupName}" exists but is not an object. Overwriting.`
      );
      config[groupName] = {}; // Overwrite if it's not a valid object
    }

    // Check for existence using hasOwnProperty for robustness within the valid object
    if (Object.prototype.hasOwnProperty.call(config[groupName], tagName)) {
      console.warn(
        `Tag "${tagName}" already exists in INI for group "${groupName}".`
      );
      alert(`Tag "${tagName}" already exists in the INI file.`);
      return false; // Indicate failure
    }

    // Add the new tag key. Value is typically empty or irrelevant.
    config[groupName][tagName] = "";

    // Sort keys within the modified group before stringifying
    const sortedGroup = {};
    Object.keys(config[groupName])
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(config[groupName], key)) {
          sortedGroup[key] = config[groupName][key];
        }
      });
    config[groupName] = sortedGroup;

    // Stringify and write back (ini.stringify preserves structure)
    // Sort top-level groups as well before saving
    const sortedConfig = sortObjectGroupsAlphabetically(config);
    const newIniContent = ini.stringify(sortedConfig);
    fs.writeFileSync(tagsIniPath, newIniContent, "utf-8");

    console.log(
      `Tag "${tagName}" added to group "${groupName}" in ${tagsIniPath}`
    );
    return true; // Indicate success
  } catch (error) {
    console.error(
      `Failed to save new tag "${tagName}" to ${tagsIniPath}:`,
      error
    );
    alert(`Error saving tag to ${tagsIniPath}: ${error.message}`);
    return false; // Indicate failure
  }
}

module.exports = {
  loadTagsFromIni,
  saveNewTag,
};
// --- END OF FILE renderer/tag-store.js ---
