// --- START OF FILE renderer/file-list.js ---
"use strict";
const fs = require("fs");
const path = require("path");
const $ = require("jquery"); // Use local $ require

function addFileOptionHoverEffect(option) {
  option.addEventListener("mouseenter", () => {
    option.style.transform = "translateX(5px)";
  });
  option.addEventListener("mouseleave", () => {
    option.style.transform = "translateX(0)";
  });
}

function addFileOption(filesListEl, text) {
  const $option = $(`<option>${text}</option>`);
  filesListEl.add($option[0]);
  addFileOptionHoverEffect($option[0]);

  // Use stat for more robust check (access might have permission issues)
  fs.stat(text, (err, stats) => {
    if (err || !stats.isFile()) {
      // Check if it exists and is a file
      console.warn(`File accessibility issue for: ${text}`, err);
      $option.addClass("error");
      $option[0].style.animation = "shake 0.5s ease";
    } else {
      $option.addClass("no-error");
    }
  });
  return $option; // Return jQuery object for consistency if needed elsewhere
}

function clearFilesList(filesListEl) {
  $(filesListEl).empty(); // More concise jQuery way
}

function prepareInputFilesSection(filesListEl, inputFilesArray) {
  inputFilesArray.forEach((file) => {
    addFileOption(filesListEl, file);
  });
  if (filesListEl.options.length > 0) {
    filesListEl.selectedIndex = 0;
  }
}

function getFilesArray(filesListEl) {
  return Array.from(filesListEl.options).map((opt) => opt.textContent);
}

function removeSelectedFile(filesListEl) {
  const selectedIndex = filesListEl.selectedIndex;
  if (selectedIndex !== -1) {
    filesListEl.remove(selectedIndex);
    // Adjust selection after removal
    if (filesListEl.options.length > 0) {
      filesListEl.selectedIndex = Math.max(0, selectedIndex - 1);
    }
  }
}

function getCurrentTagsFromFiles(filesListEl) {
  const allTags = new Set();
  const regexForTags = /\[[^\]]+\]/g;

  Array.from(filesListEl.options).forEach((fileOption) => {
    const fileName = path.basename(fileOption.textContent);
    const tags = fileName.match(regexForTags) || [];
    tags.forEach((tag) => allTags.add(tag));
  });

  return [...allTags].sort().join(" ").trim();
}

module.exports = {
  addFileOption,
  clearFilesList,
  prepareInputFilesSection,
  getFilesArray,
  removeSelectedFile,
  getCurrentTagsFromFiles,
};
// --- END OF FILE renderer/file-list.js ---
