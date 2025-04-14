// --- START OF FILE renderer.js ---

(async function () {
  ("use strict");

  // --- Dependencies ---
  const fs = require("fs");
  const ini = require("ini");
  window.$ = window.jQuery = require("jquery");
  const path = require("path");
  const { ipcRenderer, clipboard } = require("electron");
  const { exec } = require("child_process");

  // --- Constants ---
  const tagsIniPath = path.join(__dirname, "..", "tags.ini");

  // --- DOM Elements ---
  const dropZone = document.querySelector("#drop-zone");
  const filesListEl = document.querySelector("#filesList");
  const mainEl = document.querySelector("#main");
  const tagSearchInput = document.querySelector("#tag-search");
  const clearSearchButton = document.querySelector("#clear-search");
  const noTagsMessage = document.createElement("div");

  // --- Initial Setup ---
  noTagsMessage.id = "no-tags-message";
  noTagsMessage.textContent = "No matching tags found";
  // Insert after search bar instead of appending to main to avoid layout issues
  $("#tag-search-container").after(noTagsMessage);

  // --- Drag and Drop ---
  dropZone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  });
  dropZone.addEventListener("drop", handleFileDrop);
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", handleFileDrop);

  // --- File List Option Styling ---
  function addFileOptionHoverEffect(option) {
    option.addEventListener("mouseenter", () => {
      option.style.transform = "translateX(5px)";
    });
    option.addEventListener("mouseleave", () => {
      option.style.transform = "translateX(0)";
    });
  }

  function $addFileOption(text) {
    const $option = $(`<option>${text}</option>`);
    filesListEl.add($option[0]);
    addFileOptionHoverEffect($option[0]);

    fs.access(text, (err) => {
      if (err) {
        $option.addClass("error");
        $option[0].style.animation = "shake 0.5s ease";
      } else {
        $option.addClass("no-error");
      }
    });
    return $option;
  }

  // --- Command Line Args & Initial File Load ---
  try {
    const args = await getArgs();
    if (args && args.length > 1 && args[1]) {
      const inputFilesString = args[1];
      const inputFilesArray = inputFilesString.trim().split(/\r?\n/);
      prepareInputFilesSection(inputFilesArray);
    }
  } catch (err) {
    console.error("Error processing command line arguments:", err);
  }

  // --- Button Event Listeners ---
  document.querySelector(`#edit-tags-btn`).addEventListener("click", () => {
    exec(`notepad "${tagsIniPath}"`, (error) => {
      if (error) {
        console.error(`Error opening tags.ini: ${error}`);
        alert(`Could not open tags.ini: ${error.message}`);
      }
    });
  });

  document.querySelector("#proceed-btn").addEventListener("click", () => {
    const newTagsArray = getNewTagsArray();
    if (newTagsArray.length === 0) {
      alert("No tags selected to apply."); // Provide feedback
      return;
    }

    const filesArray = Array.from(filesListEl.options);
    if (filesArray.length === 0) {
      alert("No files to process."); // Provide feedback
      return;
    }

    let errorsOccurred = false;
    let filesProcessed = 0;
    const totalFiles = filesArray.length;

    filesArray.forEach((fileOption) => {
      const fullName = fileOption.textContent;

      fs.access(fullName, fs.constants.F_OK, (err) => {
        if (err) {
          console.error(`File not accessible: ${fullName}`, err);
          fileOption.classList.add("error");
          errorsOccurred = true;
          filesProcessed++;
          if (filesProcessed === totalFiles && errorsOccurred) {
            alert(
              "Some files could not be accessed or renamed. Check console for details."
            );
          }
          return;
        }

        const {
          name: fileName,
          ext: extension,
          dir: dirPath,
        } = path.parse(fullName);

        const regexForTags = /\[[^\]]+\]/g;
        const currentTagsArray = fileName.match(regexForTags) || [];
        const fileNameWithoutTags = fileName.replace(regexForTags, "").trim();

        const combinedUniqueTagsArray = [
          ...new Set([...currentTagsArray, ...newTagsArray]),
        ];
        const tagsString = combinedUniqueTagsArray.sort().join(" ");

        const newFileName =
          `${fileNameWithoutTags} ${tagsString}${extension}`.trim();
        const newPath = path.join(dirPath, newFileName);

        if (fullName === newPath) {
          filesProcessed++;
          if (filesProcessed === totalFiles && errorsOccurred) {
            alert(
              "Some files could not be accessed or renamed. Check console for details."
            );
          } else if (filesProcessed === totalFiles && !errorsOccurred) {
            // Optionally show a success message if needed, but might be noisy
            // alert("Tags applied successfully!");
            clearActiveTags(); // Clear selection on success
          }
          return; // Skip rename if name is unchanged
        }

        fs.rename(fullName, newPath, (error) => {
          filesProcessed++;
          if (error) {
            console.error(`Error renaming ${fullName} to ${newPath}:`, error);
            fileOption.classList.add("error");
            errorsOccurred = true;
          } else {
            fileOption.textContent = newPath;
            fileOption.value = newPath;
            fileOption.classList.remove("error");
            fileOption.classList.add("no-error");
          }

          // Check completion and show final message
          if (filesProcessed === totalFiles) {
            if (errorsOccurred) {
              alert(
                "Some files could not be renamed. Check list and console for details."
              );
            } else {
              // alert("Tags applied successfully!"); // Success message
              clearActiveTags(); // Clear selection on success
            }
          }
        });
      });
    });
  });

  document.querySelector(`#copy-tags-btn`).addEventListener("click", () => {
    const newTagsArray = getNewTagsArray();
    const textToBeCopied = newTagsArray.join(" ");
    if (textToBeCopied) clipboard.writeText(textToBeCopied.trim());
  });

  document
    .querySelector(`#copy-current-tags-btn`)
    .addEventListener("click", () => {
      const allTags = new Set();
      const regexForTags = /\[[^\]]+\]/g;

      Array.from(filesListEl.options).forEach((fileOption) => {
        const fileName = path.basename(fileOption.textContent);
        const tags = fileName.match(regexForTags) || [];
        tags.forEach((tag) => allTags.add(tag));
      });

      const uniqueTagsString = [...allTags].sort().join(" ");
      clipboard.writeText(uniqueTagsString.trim());
    });

  document.querySelector("#remove-btn").addEventListener("click", () => {
    const selectedIndex = filesListEl.selectedIndex;
    if (selectedIndex !== -1) {
      filesListEl.remove(selectedIndex);
      if (filesListEl.options.length > 0) {
        filesListEl.selectedIndex = Math.max(0, selectedIndex - 1);
      }
    }
  });

  document.querySelector("#clear-btn").addEventListener("click", () => {
    clearFilesList();
  });

  // --- Tag Population & UI Generation ---
  loadAndPopulateTags();

  // --- Search and Filter ---
  tagSearchInput.addEventListener("input", () => {
    filterTags(tagSearchInput.value);
  });

  clearSearchButton.addEventListener("click", () => {
    tagSearchInput.value = "";
    filterTags("");
    tagSearchInput.focus();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "f") {
      event.preventDefault();
      tagSearchInput.focus();
    }
    // Allow Esc to cancel inline tag add as well
    if (event.key === "Escape") {
      if (document.activeElement === tagSearchInput) {
        tagSearchInput.value = "";
        filterTags("");
      } else {
        // Check if an inline add UI is active and cancel it
        const activeAddUI = document.querySelector(
          ".add-tag-inline-container:not(.hidden-add-tag)"
        );
        if (activeAddUI) {
          handleCancelAddTag(activeAddUI);
        }
      }
    }
  });

  // --- Helper Functions ---

  function loadAndPopulateTags() {
    $(mainEl).find(".group").remove(); // Clear existing groups

    try {
      const iniContent = fs.readFileSync(tagsIniPath, "utf-8");
      const config = ini.parse(iniContent);
      const sortedData = sortObjectGroupsAlphabetically(config);

      Object.entries(sortedData).forEach(([group, groupData]) => {
        const $groupEl = $(`<div class="group" data-group-name="${group}">
                                    <span class="heading">${group}</span>
                                  </div>`).appendTo(mainEl);

        // Add existing tags
        Object.keys(groupData).forEach((key) => {
          createTagElement(key, $groupEl);
        });

        // Add the "Add Tag" button (+) to the group
        const $addTagBtn = $(
          `<button class="add-tag-btn" title="Add new tag to '${group}'">+</button>`
        );
        $addTagBtn.on("click", (e) => {
          // Prevent click propagating if needed, though unlikely here
          // e.stopPropagation();
          // Hide *this specific* button and show the input UI
          $(e.currentTarget).addClass("hidden-add-tag");
          showAddTagInput(group, $groupEl, $(e.currentTarget)); // Pass the button itself
        });
        $groupEl.append($addTagBtn); // Append button at the end of the group
      });

      filterTags(tagSearchInput.value); // Re-apply filter
    } catch (error) {
      console.error("Error reading or parsing tags.ini:", error);
      alert(
        `Failed to load tags from ${tagsIniPath}.\nError: ${error.message}`
      );
    }
  }

  function createTagElement(tagKey, $groupEl, insertBeforeElement = null) {
    const safeGroupName = $groupEl
      .data("group-name")
      .replace(/[^a-zA-Z0-9-_]/g, "");
    const safeTagKey = tagKey.replace(/[^a-zA-Z0-9-_]/g, "");
    const uniqueId = `${safeGroupName}-${safeTagKey}-${Date.now()}`; // Add timestamp for uniqueness

    const $checkbox = $(`<input type="checkbox" id="${uniqueId}">`);
    const $label = $(`<label for="${uniqueId}">${tagKey}</label>`)
      .addClass("tag-label")
      .on("contextmenu", handleTagContextMenu);

    // Insert before a specific element (like the Add button or another tag)
    if (insertBeforeElement && insertBeforeElement.length > 0) {
      $checkbox.insertBefore(insertBeforeElement);
      $label.insertAfter($checkbox); // Label comes right after its checkbox
    } else {
      // Default: Append to the group container (might need adjustment if add button exists)
      const $addBtn = $groupEl.find(".add-tag-btn");
      if ($addBtn.length > 0) {
        $checkbox.insertBefore($addBtn);
        $label.insertAfter($checkbox);
      } else {
        $groupEl.append($checkbox);
        $groupEl.append($label);
      }
    }

    return { $checkbox, $label };
  }

  function handleTagContextMenu(event) {
    event.preventDefault();
    const tagName = event.target.textContent;
    const esQuery = `[${tagName}]`;
    try {
      const tempWindow = window.open(`es://"${esQuery}"`);
      if (tempWindow) {
        setTimeout(() => tempWindow.close(), 500);
      } else {
        clipboard.writeText(esQuery);
        alert(
          `Copied tag "${esQuery}" to clipboard. (Could not launch Everything)`
        );
      }
    } catch (err) {
      console.error("Error trying to open es:// link:", err);
      clipboard.writeText(esQuery);
      alert(
        `Copied tag "${esQuery}" to clipboard. (Error launching Everything)`
      );
    }
  }

  function showAddTagInput(groupName, $groupEl, $addButton) {
    // Remove any existing add input UI in *this* group first
    $groupEl.find(".add-tag-inline-container").remove();

    // Create the container, input, and buttons
    const $container = $('<span class="add-tag-inline-container"></span>'); // Use span for inline
    const $input = $('<input type="text" placeholder="New tag name">');
    const $saveBtn = $(
      '<button class="action-button-small save" title="Save Tag">✔️</button>'
    );
    const $cancelBtn = $(
      '<button class="action-button-small cancel" title="Cancel">❌</button>'
    );

    // Append elements to the container
    $container.append($input).append($saveBtn).append($cancelBtn);

    // Insert the container right after the (now hidden) add button's original position
    $container.insertAfter($addButton);

    // --- Event Handlers for the new UI ---
    $saveBtn.on("click", () => {
      handleSaveNewTag($input, $container, groupName, $groupEl, $addButton);
    });

    $cancelBtn.on("click", () => {
      handleCancelAddTag($container, $addButton);
    });

    // Handle Enter key in input field
    $input.on("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent form submission/other defaults
        handleSaveNewTag($input, $container, groupName, $groupEl, $addButton);
      }
    });
    // Handle Escape key in input field (redundant with global listener, but good practice)
    $input.on("keydown", (e) => {
      if (e.key === "Escape") {
        handleCancelAddTag($container, $addButton);
      }
    });

    // Focus the input field
    $input.trigger("focus");
  }

  function handleSaveNewTag(
    $input,
    $container,
    groupName,
    $groupEl,
    $addButton
  ) {
    const newTagName = $input.val().trim();

    // --- Validation ---
    if (!newTagName) {
      alert("Tag name cannot be empty.");
      $input.trigger("focus");
      return;
    }
    if (/[\[\]]/.test(newTagName)) {
      alert("Tag names cannot contain '[' or ']' characters.");
      $input.trigger("focus");
      return;
    }

    // Check for duplicates within this specific group
    let tagExists = false;
    $groupEl.find("label.tag-label").each(function () {
      if ($(this).text().toLowerCase() === newTagName.toLowerCase()) {
        tagExists = true;
        return false; // exit $.each loop
      }
    });

    if (tagExists) {
      alert(`Tag "${newTagName}" already exists in the "${groupName}" group.`);
      $input.trigger("focus");
      return;
    }
    // --- End Validation ---

    // Attempt to save the tag to the INI file
    if (saveNewTag(groupName, newTagName)) {
      // --- Add to UI ---
      // Find the correct insertion point (before the add button/container)
      const $insertBefore = $container.length ? $container : $addButton;
      createTagElement(newTagName, $groupEl, $insertBefore);

      // Sort tags visually within the group
      sortTagsInGroup($groupEl);

      // --- Cleanup ---
      $container.remove(); // Remove the input UI
      $addButton.removeClass("hidden-add-tag"); // Show the '+' button again

      // Optional: Provide subtle feedback
      console.log(`Tag "${newTagName}" added successfully.`);
      // Maybe flash the new tag briefly?
      const newLabel = $groupEl.find(`label:contains("${newTagName}")`);
      if (newLabel.length) {
        newLabel
          .css({ backgroundColor: "var(--accent-primary)", color: "white" })
          .animate(
            {
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            },
            1000
          );
      }
    } else {
      // Error saving (alert handled in saveNewTag)
      $input.trigger("focus"); // Keep input focus on error
    }
  }

  function handleCancelAddTag(containerOrSelector, $addButton = null) {
    const $container = $(containerOrSelector); // Ensure it's a jQuery object
    const $groupEl = $container.closest(".group");

    $container.remove(); // Remove the input UI

    // Find the corresponding add button within the same group and show it
    const $buttonToShow =
      $addButton || $groupEl.find(".add-tag-btn.hidden-add-tag");
    if ($buttonToShow.length > 0) {
      $buttonToShow.removeClass("hidden-add-tag");
    }
  }

  function saveNewTag(groupName, tagName) {
    try {
      const iniContent = fs.readFileSync(tagsIniPath, "utf-8");
      const config = ini.parse(iniContent);

      if (!config[groupName]) {
        config[groupName] = {}; // Create group if it doesn't exist
        console.warn(
          `Group "${groupName}" did not exist in tags.ini, creating it.`
        );
      }

      // Double-check for existence before adding
      if (config[groupName].hasOwnProperty(tagName)) {
        // Check using hasOwnProperty for robustness
        console.warn(
          `Tag "${tagName}" already exists in INI for group "${groupName}". This shouldn't happen if UI checks worked.`
        );
        alert(`Tag "${tagName}" already exists in the INI file.`);
        return false; // Indicate failure as it shouldn't proceed
      }

      // Add the new tag key. Value is typically empty or irrelevant.
      config[groupName][tagName] = "";

      // Sort keys within the group before stringifying for consistency
      const sortedGroup = {};
      Object.keys(config[groupName])
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          sortedGroup[key] = config[groupName][key];
        });
      config[groupName] = sortedGroup;

      // Stringify and write back (ini.stringify preserves structure)
      // Ensure empty sections are written if needed, handle potential options
      const newIniContent = ini.stringify(config);
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

  function sortTagsInGroup($groupEl) {
    const $addBtn = $groupEl.find(".add-tag-btn").detach(); // Detach add btn
    const $addUI = $groupEl.find(".add-tag-inline-container").detach(); // Detach any active add UI

    // Select pairs of checkbox + label for sorting
    const $tagItems = $groupEl
      .find("input[type='checkbox'] + label.tag-label")
      .map(function () {
        // For each label, return an array containing its corresponding checkbox and the label itself
        const $label = $(this);
        const $checkbox = $label.prev("input[type='checkbox']");
        return [[$checkbox[0], $label[0]]]; // Wrap in array for map, then access [0]
      })
      .get(); // Get as a standard JS array of [checkbox, label] pairs

    // Sort the pairs based on the label text
    $tagItems.sort(function (a, b) {
      const textA = $(a[1]).text().toLowerCase(); // a[1] is the label
      const textB = $(b[1]).text().toLowerCase(); // b[1] is the label
      return textA.localeCompare(textB);
    });

    // Re-append sorted items (checkbox first, then label)
    $tagItems.forEach((pair) => {
      $groupEl.append(pair[0]); // Append checkbox
      $groupEl.append(pair[1]); // Append label
    });

    // Re-append add UI (if it was active) and the add button
    if ($addUI.length) $groupEl.append($addUI);
    if ($addBtn.length) $groupEl.append($addBtn);
  }

  function filterTags(searchText) {
    const searchLower = searchText.toLowerCase().trim();
    let anyVisible = false;

    const groups = document.querySelectorAll(".group");
    groups.forEach((group) => {
      const heading = group.querySelector(".heading");
      // Exclude the add-tag button and UI from tag filtering logic
      const tags = group.querySelectorAll(".tag-label:not(.hidden)"); // Select visible labels only initially might be better
      const addTagBtn = group.querySelector(".add-tag-btn");
      const addTagInlineUI = group.querySelector(".add-tag-inline-container");

      let groupHasVisibleTags = false;

      group.querySelectorAll(".tag-label").forEach((tagLabel) => {
        // Iterate all labels to hide/show correctly
        const tagText = tagLabel.textContent;
        const checkbox = document.getElementById(tagLabel.getAttribute("for"));

        if (searchLower === "" || tagText.toLowerCase().includes(searchLower)) {
          tagLabel.classList.remove("hidden");
          if (checkbox) checkbox.style.display = ""; // Show checkbox (use style.display for inputs)
          groupHasVisibleTags = true;
          anyVisible = true; // Mark that at least one tag anywhere is visible

          // Highlight
          if (searchLower !== "") {
            const regex = new RegExp(`(${escapeRegExp(searchText)})`, "gi");
            tagLabel.innerHTML = tagText.replace(
              regex,
              '<span class="highlight">$1</span>'
            );
          } else {
            // Remove highlight spans by resetting textContent
            if (tagLabel.querySelector(".highlight")) {
              tagLabel.textContent = tagText;
            }
          }
        } else {
          tagLabel.classList.add("hidden");
          if (checkbox) checkbox.style.display = "none"; // Hide checkbox
          // Remove highlight if hiding
          if (tagLabel.querySelector(".highlight")) {
            tagLabel.textContent = tagText;
          }
        }
      });

      // Group visibility logic
      const groupNameMatches =
        heading && heading.textContent.toLowerCase().includes(searchLower);
      if (groupHasVisibleTags || (searchLower !== "" && groupNameMatches)) {
        group.classList.remove("hidden");
        // Always show add button and inline UI if the group is visible
        if (addTagBtn) addTagBtn.classList.remove("hidden");
        if (addTagInlineUI) addTagInlineUI.classList.remove("hidden");
      } else if (searchLower === "") {
        // If search is empty, show everything
        group.classList.remove("hidden");
        if (addTagBtn) addTagBtn.classList.remove("hidden");
        if (addTagInlineUI) addTagInlineUI.classList.remove("hidden"); // Also show add UI if it was open
      } else {
        group.classList.add("hidden");
        // Hide add button and UI when group is hidden by search
        if (addTagBtn) addTagBtn.classList.add("hidden");
        if (addTagInlineUI) addTagInlineUI.classList.add("hidden");
      }
    });

    // Show/hide "No tags found" message
    if (!anyVisible && searchLower !== "") {
      noTagsMessage.classList.add("visible");
    } else {
      noTagsMessage.classList.remove("visible");
    }
  }

  function escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function handleFileDrop(event) {
    event.preventDefault();
    dropZone.classList.remove("drag-over");

    clearFilesList();
    clearActiveTags();
    // Cancel any active inline tag add operations
    document
      .querySelectorAll(".add-tag-inline-container")
      .forEach((el) => handleCancelAddTag(el));

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const droppedFilesArray = files.map((file) => file.path);
      prepareInputFilesSection(droppedFilesArray);
      ipcRenderer.send("files-dropped", droppedFilesArray); // Send to main process if needed
    }
  }

  function clearActiveTags() {
    document
      .querySelectorAll('#main input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
  }

  function clearFilesList() {
    $(filesListEl).find("option").remove();
  }

  function getArgs() {
    return new Promise((resolve) => {
      // Listen for the args
      ipcRenderer.once("command-line-args", (event, args) => {
        console.log("Received command-line-args:", args);
        resolve(args);
      });

      // Immediately ask the main process for the args.
      // The main process should listen for 'request-command-line-args'
      // and send back 'command-line-args'.
      // We add this request part because the 'did-finish-load' in main
      // might fire *before* the listener in renderer is ready.
      console.log("Requesting command-line-args from main...");
      ipcRenderer.send("request-command-line-args");

      // Add a timeout as a fallback
      setTimeout(() => {
        console.warn("Timeout waiting for command-line-args event.");
        resolve(process.argv.slice(1)); // Fallback to process.argv in renderer (might be less reliable)
      }, 2000); // 2 seconds timeout
    });
  }

  function prepareInputFilesSection(inputFilesArray) {
    inputFilesArray.forEach((file) => {
      $addFileOption(file);
    });
    if (filesListEl.options.length > 0) {
      filesListEl.selectedIndex = 0;
    }
  }

  function getNewTagsArray() {
    return Array.from(
      document.querySelectorAll("#main input[type='checkbox']:checked")
    ).map((item) => `[${item.labels[0].textContent}]`);
  }

  function sortObjectGroupsAlphabetically(obj) {
    const sortedGroups = {};
    const groupKeys = Object.keys(obj).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    groupKeys.forEach((group) => {
      sortedGroups[group] = {};
      const groupData = obj[group] || {};

      Object.keys(groupData)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          sortedGroups[group][key] = groupData[key];
        });
    });

    return sortedGroups;
  }

  // --- Add this listener in main.js ---
  // Make sure the main process responds to the request for args
  // This should be inside the app.whenReady().then(...) block in main.js
  /*
  ipcMain.on('request-command-line-args', (event) => {
      // process.argv includes the electron executable path, then script path, then actual args
      // Send only the actual arguments passed to the app
      event.sender.send('command-line-args', process.argv.slice(2));
  });
  */
  // --- Make sure the corresponding listener exists in your main.js ---
  // See comment block above
})(); // End IIFE

// --- END OF FILE renderer.js ---
