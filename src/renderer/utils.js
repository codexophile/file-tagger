// --- START OF FILE renderer/utils.js ---
"use strict";

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sortObjectGroupsAlphabetically(obj) {
  const sortedGroups = {};
  if (!obj) return sortedGroups; // Handle null/undefined input

  const groupKeys = Object.keys(obj).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  groupKeys.forEach((group) => {
    sortedGroups[group] = {};
    const groupData = obj[group] || {}; // Ensure groupData is an object

    // Ensure groupData is treated as an object before getting keys
    if (typeof groupData === "object" && groupData !== null) {
      Object.keys(groupData)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          // Only copy if it's a direct property (filters out prototype stuff)
          if (Object.prototype.hasOwnProperty.call(groupData, key)) {
            sortedGroups[group][key] = groupData[key];
          }
        });
    } else {
      // Handle cases where a group might not be an object in the ini
      console.warn(
        `Group "${group}" in INI is not an object, skipping keys sorting.`
      );
    }
  });

  return sortedGroups;
}

module.exports = {
  escapeRegExp,
  sortObjectGroupsAlphabetically,
};
// --- END OF FILE renderer/utils.js ---
