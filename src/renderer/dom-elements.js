// --- START OF FILE renderer/dom-elements.js ---
window.$ = window.jQuery = require("jquery"); // Make jQuery global for convenience if needed elsewhere

const elements = {
  dropZone: document.querySelector("#drop-zone"),
  filesListEl: document.querySelector("#filesList"),
  mainTagsContainerEl: document.querySelector("#main"), // Renamed from mainEl for clarity
  tagSearchInput: document.querySelector("#tag-search"),
  clearSearchButton: document.querySelector("#clear-search"),
  editTagsButton: document.querySelector(`#edit-tags-btn`),
  proceedButton: document.querySelector("#proceed-btn"),
  copyTagsButton: document.querySelector(`#copy-tags-btn`),
  copyCurrentTagsButton: document.querySelector(`#copy-current-tags-btn`),
  removeFileButton: document.querySelector("#remove-btn"),
  clearFilesButton: document.querySelector("#clear-btn"),
  tagSearchContainer: document.querySelector("#tag-search-container"), // Added for message placement
  noTagsMessage: null, // Will be created dynamically
};

// --- Initial Setup for elements created here ---
elements.noTagsMessage = document.createElement("div");
elements.noTagsMessage.id = "no-tags-message";
elements.noTagsMessage.textContent = "No matching tags found";
// Insert after search bar instead of appending to main to avoid layout issues
$(elements.tagSearchContainer).after(elements.noTagsMessage);

module.exports = elements;
// --- END OF FILE renderer/dom-elements.js ---
