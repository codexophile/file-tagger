// --- START OF FILE renderer/main.js ---
(async function () {
  "use strict";

  // --- Core Dependencies ---
  const path = require("path");
  // Note: jQuery is loaded globally in dom-elements.js for now
  // const $ = require("jquery"); // Can require locally if needed

  // --- Application Modules ---
  const domElements = require("./dom-elements");
  const ipcHandler = require("./ipc-handler");
  const fileList = require("./file-list");
  const tagStore = require("./tag-store");
  const tagUI = require("./tag-ui");
  const dragDrop = require("./drag-drop");
  const actionHandlers = require("./action-handlers");

  // --- Constants ---
  // Assumes index.html and tags.ini are in the project root directory
  const tagsIniPath = path.resolve(__dirname, "tags.ini");
  console.log(`Using tags.ini path: ${tagsIniPath}`);

  // --- Initialization ---

  // 1. Load Tags from INI
  let currentTagData = tagStore.loadTagsFromIni(tagsIniPath);

  // 2. Populate Initial Tag UI
  tagUI.populateTagUI(
    tagsIniPath,
    domElements.mainTagsContainerEl,
    currentTagData
  );

  // 3. Setup Drag and Drop
  // Pass necessary functions from other modules
  dragDrop.setupDragDrop(
    domElements.dropZone,
    domElements.filesListEl, // Pass the element itself
    fileList.clearFilesList,
    fileList.prepareInputFilesSection,
    () => tagUI.clearActiveTags(domElements.mainTagsContainerEl), // Wrap clearActiveTags
    () => tagUI.cancelAllInlineAddTags(domElements.mainTagsContainerEl) // Wrap cancel function
  );

  // 4. Setup Action Handlers (Buttons, Search, Keys)
  // Pass dependencies needed by the handlers
  actionHandlers.setupActionHandlers(
    domElements,
    tagsIniPath,
    fileList,
    tagUI,
    tagStore // Pass tagStore for saving/loading if actions need it directly
  );

  // 5. Handle Command Line Arguments (Asynchronously)
  try {
    const args = await ipcHandler.getArgs();
    // Args from main process usually don't include the script name itself
    // The first arg (index 0) would be the first actual parameter passed
    if (args && args.length > 0 && args[0]) {
      console.log("Processing command line arguments:", args);
      const inputFilesString = args[0]; // Assuming files are passed as the first arg, newline separated
      const inputFilesArray = inputFilesString.trim().split(/\r?\n/);

      // Clear existing state before loading from args
      fileList.clearFilesList(domElements.filesListEl);
      tagUI.clearActiveTags(domElements.mainTagsContainerEl);
      tagUI.cancelAllInlineAddTags(domElements.mainTagsContainerEl);

      // Load files
      fileList.prepareInputFilesSection(
        domElements.filesListEl,
        inputFilesArray
      );
    } else {
      console.log("No valid command line arguments to process.");
    }
  } catch (err) {
    console.error("Error processing command line arguments:", err);
    // Potentially show an error to the user
  }

  // 6. Initial Filter (in case search box has initial value, unlikely but safe)
  tagUI.filterTags(
    domElements.mainTagsContainerEl,
    domElements.noTagsMessage,
    domElements.tagSearchInput.value
  );

  console.log("Renderer initialization complete.");
})(); // End IIFE
// --- END OF FILE renderer/main.js ---
