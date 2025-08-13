// --- START OF FILE renderer/action-handlers.js ---
'use strict';
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { clipboard } = require('electron');
const $ = require('jquery');

// These will be passed in during setup
let domElements;
let tagsIniPath;
let fileListModule;
let tagUIModule;
const tagStore = require('./tag-store');

function setupActionHandlers(
  _domElements,
  _tagsIniPath,
  _fileListModule,
  _tagUIModule
) {
  // Store references
  domElements = _domElements;
  tagsIniPath = _tagsIniPath;
  fileListModule = _fileListModule;
  tagUIModule = _tagUIModule;

  // --- Attach Listeners ---

  domElements.editTagsButton.addEventListener('click', handleEditTags);
  domElements.proceedButton.addEventListener('click', handleProceed);
  domElements.copyTagsButton.addEventListener('click', handleCopyNewTags);
  domElements.copyCurrentTagsButton.addEventListener(
    'click',
    handleCopyCurrentTags
  );
  domElements.removeFileButton.addEventListener('click', handleRemoveFile);
  domElements.clearFilesButton.addEventListener('click', handleClearFiles);
  domElements.clearSearchButton.addEventListener('click', handleClearSearch);
  domElements.tagSearchInput.addEventListener('input', handleSearchInput);
  if (domElements.addGroupButton) {
    domElements.addGroupButton.addEventListener('click', handleAddGroup);
  }

  // Global keydowns previously in main IIFE
  document.addEventListener('keydown', handleGlobalKeydown);

  console.log('Action handlers initialized.');
}

// --- Handler Functions ---

function handleEditTags() {
  exec(`notepad "${tagsIniPath}"`, error => {
    if (error) {
      console.error(`Error opening tags.ini: ${error}`);
      alert(`Could not open ${tagsIniPath}: ${error.message}`);
    }
  });
}

function handleAddGroup() {
  const $btn = $(domElements.addGroupButton);
  // If an inline UI already exists, focus it
  const $existing = $('#add-group-inline');
  if ($existing.length) {
    $existing.find('input').trigger('focus');
    return;
  }

  // Disable button while inline UI is open
  $btn.prop('disabled', true);

  // Build inline UI
  const $container = $(`
    <span id="add-group-inline" class="add-tag-inline-container">
      <input type="text" class="add-group-input-inline" placeholder="New group name">
      <button class="action-button-small save" title="Create Group">✔️</button>
      <button class="action-button-small cancel" title="Cancel">❌</button>
    </span>
  `);

  // Insert after the button
  $container.insertAfter($btn);

  const $input = $container.find('input');
  const $save = $container.find('button.save');
  const $cancel = $container.find('button.cancel');

  function cleanup() {
    $container.remove();
    $btn.prop('disabled', false).trigger('focus');
  }

  function saveGroup() {
    const raw = $input.val();
    const groupName = (raw || '').trim();
    if (!groupName) {
      alert('Group name cannot be empty.');
      $input.trigger('focus');
      return;
    }
    if (/[^\w\s\-]/.test(groupName) || /[\[\]]/.test(groupName)) {
      alert(
        'Group name can only contain letters, numbers, spaces, dashes, and underscores, and cannot include [ or ].'
      );
      $input.trigger('focus');
      return;
    }

    if (!tagStore.saveNewGroup(tagsIniPath, groupName)) {
      // Error already shown
      $input.trigger('focus');
      return;
    }

    // Update UI
    tagUIModule.addGroupToUI(
      tagsIniPath,
      domElements.mainTagsContainerEl,
      groupName
    );
    // Update filter state to reflect current search text
    tagUIModule.filterTags(
      domElements.mainTagsContainerEl,
      domElements.noTagsMessage,
      domElements.tagSearchInput.value
    );
    cleanup();
  }

  $save.on('click', saveGroup);
  $cancel.on('click', cleanup);
  $input.on('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveGroup();
    }
  });
  $input.on('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
    }
  });

  // Focus input initially
  $input.trigger('focus');
}

function handleProceed() {
  const newTagsArray = tagUIModule.getNewTagsArray(
    domElements.mainTagsContainerEl
  );
  const filesArray = fileListModule.getFilesArray(domElements.filesListEl);
  const fileOptions = Array.from(domElements.filesListEl.options); // Get option elements for styling

  if (newTagsArray.length === 0) {
    alert('No tags selected to apply.');
    return;
  }
  if (filesArray.length === 0) {
    alert('No files to process.');
    return;
  }

  let errorsOccurred = false;
  let filesProcessed = 0;
  const totalFiles = filesArray.length;
  let filesActuallyRenamed = 0; // Count files that needed renaming

  console.log(`Starting tag application for ${totalFiles} file(s)...`);

  fileOptions.forEach((fileOption, index) => {
    const fullName = fileOption.textContent;
    const originalOption = fileOption; // Keep reference to option element

    fs.access(fullName, fs.constants.F_OK | fs.constants.W_OK, err => {
      // Check write access too
      if (err) {
        console.error(`File not accessible or writable: ${fullName}`, err);
        $(originalOption)
          .removeClass('no-error')
          .addClass('error')
          .css('animation', 'shake 0.5s ease');
        errorsOccurred = true;
        checkCompletion();
        return;
      }

      const {
        name: fileName,
        ext: extension,
        dir: dirPath,
      } = path.parse(fullName);
      const regexForTags = /\[[^\]]+\]/g;
      const currentTagsArray = fileName.match(regexForTags) || [];
      const fileNameWithoutTags = fileName.replace(regexForTags, '').trim();

      // Ensure uniqueness and sort
      const combinedUniqueTagsArray = [
        ...new Set([...currentTagsArray, ...newTagsArray]),
      ].sort();
      const tagsString = combinedUniqueTagsArray.join(' '); // Space separated

      // Construct new name carefully, avoid double spaces
      let newFileName = fileNameWithoutTags;
      if (tagsString) {
        newFileName += ` ${tagsString}`;
      }
      newFileName += extension;
      const newPath = path.join(dirPath, newFileName.trim()); // Trim final result

      if (fullName === newPath) {
        console.log(`Skipping rename (no change): ${fullName}`);
        $(originalOption)
          .removeClass('error')
          .addClass('no-error')
          .css('animation', ''); // Ensure correct state
        checkCompletion();
        return; // Skip rename if name is unchanged
      }

      console.log(`Attempting rename: "${fullName}" -> "${newPath}"`);
      filesActuallyRenamed++; // Increment rename counter

      fs.rename(fullName, newPath, error => {
        if (error) {
          console.error(`Error renaming ${fullName} to ${newPath}:`, error);
          $(originalOption)
            .removeClass('no-error')
            .addClass('error')
            .css('animation', 'shake 0.5s ease');
          errorsOccurred = true;
        } else {
          console.log(`Successfully renamed: ${newPath}`);
          originalOption.textContent = newPath;
          originalOption.value = newPath; // Update value as well
          $(originalOption)
            .removeClass('error')
            .addClass('no-error')
            .css('animation', '');
        }
        checkCompletion();
      });
    });
  });

  function checkCompletion() {
    filesProcessed++;
    if (filesProcessed === totalFiles) {
      console.log('Tag application process finished.');
      if (errorsOccurred) {
        alert(
          'Some files could not be accessed or renamed. Check list and console for details.'
        );
      } else if (filesActuallyRenamed > 0) {
        // Only show success if actual renames happened
        // alert("Tags applied successfully!"); // Optional: Can be noisy
        tagUIModule.clearActiveTags(domElements.mainTagsContainerEl); // Clear selection on success
        console.log('Tags applied successfully and selection cleared.');
      } else if (filesActuallyRenamed === 0 && !errorsOccurred) {
        console.log('Processing complete. No files required renaming.');
        tagUIModule.clearActiveTags(domElements.mainTagsContainerEl); // Still clear selection
      }
    }
  }
}

function handleCopyNewTags() {
  const newTagsArray = tagUIModule.getNewTagsArray(
    domElements.mainTagsContainerEl
  );
  const textToBeCopied = newTagsArray.join(' ');
  if (textToBeCopied) {
    clipboard.writeText(textToBeCopied.trim());
    console.log('Copied selected tags:', textToBeCopied.trim());
    // Optional: provide visual feedback
  } else {
    console.log('No tags selected to copy.');
  }
}

function handleCopyCurrentTags() {
  const uniqueTagsString = fileListModule.getCurrentTagsFromFiles(
    domElements.filesListEl
  );
  if (uniqueTagsString) {
    clipboard.writeText(uniqueTagsString);
    console.log('Copied current tags from files:', uniqueTagsString);
    // Optional: provide visual feedback
  } else {
    console.log('No tags found in current file list to copy.');
  }
}

function handleRemoveFile() {
  fileListModule.removeSelectedFile(domElements.filesListEl);
}

function handleClearFiles() {
  fileListModule.clearFilesList(domElements.filesListEl);
}

function handleSearchInput() {
  tagUIModule.filterTags(
    domElements.mainTagsContainerEl,
    domElements.noTagsMessage,
    domElements.tagSearchInput.value
  );
}

function handleClearSearch() {
  domElements.tagSearchInput.value = '';
  tagUIModule.filterTags(
    domElements.mainTagsContainerEl,
    domElements.noTagsMessage,
    ''
  );
  domElements.tagSearchInput.focus();
}

function handleGlobalKeydown(event) {
  // Ctrl+F / Cmd+F for search focus
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault();
    domElements.tagSearchInput.focus();
    domElements.tagSearchInput.select(); // Select existing text
  }
  // Escape key handling
  if (event.key === 'Escape') {
    // If search input has focus and text, clear it, otherwise blur or cancel add tag
    if (document.activeElement === domElements.tagSearchInput) {
      if (domElements.tagSearchInput.value !== '') {
        handleClearSearch(); // Clears search and resets filter
      } else {
        domElements.tagSearchInput.blur(); // Blur if already empty
      }
    } else {
      // Check if an inline add UI is active and cancel it
      const activeAddUI = domElements.mainTagsContainerEl.querySelector(
        '.add-tag-inline-container:not(.hidden-add-tag)' // Should check visibility differently now
      );
      // Use jQuery to find visible inline add UIs
      const $visibleAddUI = $(domElements.mainTagsContainerEl)
        .find('.add-tag-inline-container:visible')
        .first();

      if ($visibleAddUI.length > 0) {
        // Find the associated button to pass to the cancel handler
        const $addButton = $visibleAddUI.prev('.add-tag-btn.hidden-add-tag');
        tagUIModule.handleCancelAddTag(
          $visibleAddUI,
          $addButton.length ? $addButton : null
        );
      }
    }
  }
}

module.exports = {
  setupActionHandlers,
};
// --- END OF FILE renderer/action-handlers.js ---
