// --- START OF FILE renderer/drag-drop.js ---
"use strict";
const { ipcRenderer } = require("electron");
// We need functions from other modules, these will be passed during setup
// e.g., fileList.clearFilesList, fileList.prepareInputFilesSection, tagUI.clearActiveTags

function setupDragDrop(
  dropZoneEl,
  filesListEl, // Pass the DOM element
  clearFilesListFunc,
  prepareInputFilesSectionFunc,
  clearActiveTagsFunc,
  cancelAllInlineAddTagsFunc
) {
  function handleFileDrop(event) {
    event.preventDefault();
    dropZoneEl.classList.remove("drag-over");

    // Clear UI state before processing new files
    clearFilesListFunc(filesListEl);
    clearActiveTagsFunc(); // Assuming clearActiveTags doesn't need mainEl passed every time
    cancelAllInlineAddTagsFunc(); // Cancel inline edits on drop

    const files = event.dataTransfer?.files; // Use optional chaining
    if (files && files.length > 0) {
      const droppedFilesArray = Array.from(files).map((file) => file.path);
      prepareInputFilesSectionFunc(filesListEl, droppedFilesArray); // Pass element and files
      ipcRenderer.send("files-dropped", droppedFilesArray); // Notify main process
    }
  }

  dropZoneEl.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZoneEl.classList.add("drag-over");
  });
  dropZoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneEl.classList.add("drag-over"); // Keep class while over
  });
  dropZoneEl.addEventListener("dragleave", (e) => {
    // Only remove class if leaving the dropzone itself, not children
    if (e.target === dropZoneEl) {
      dropZoneEl.classList.remove("drag-over");
    }
  });
  dropZoneEl.addEventListener("drop", handleFileDrop);

  // Prevent default behavior for dragover/drop on the window
  // to allow dropping anywhere, but only handle the drop if it lands on the zone
  window.addEventListener("dragover", (event) => event.preventDefault());
  // Handle drop on window ONLY if it didn't land on the specific drop zone
  window.addEventListener("drop", (event) => {
    if (event.target !== dropZoneEl && !dropZoneEl.contains(event.target)) {
      handleFileDrop(event); // Process drop anywhere on the window
    } else {
      event.preventDefault(); // Already handled by dropZone listener
    }
  });

  console.log("Drag and drop listeners initialized.");
}

module.exports = {
  setupDragDrop,
};
// --- END OF FILE renderer/drag-drop.js ---
