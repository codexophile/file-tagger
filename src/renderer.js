(async function () {
  ("use strict");

  // Add drag and drop visual feedback
  const dropZone = document.querySelector("#drop-zone");

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

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
  });

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
        // Add shake animation for errors
        $option[0].style.animation = "shake 0.5s ease";
      } else {
        $option.addClass("no-error");
        // Add success animation
        $option[0].style.animation = "slideIn 0.3s ease";
      }
    });

    return $option;
  }

  const fs = require("fs");
  const ini = require("ini");
  window.$ = window.jQuery = require("jquery");
  const path = require("path");
  const { ipcRenderer, clipboard } = require("electron");
  const { exec } = require("child_process");

  const filesListEl = document.querySelector("#filesList");

  const args = await getArgs();
  if (args[0]) {
    const inputFilesString = args[1];
    const inputFilesArray = inputFilesString.trim().split(/\r?\n/);
    prepareInputFilesSection(inputFilesArray);
  }

  document.querySelector(`#edit-tags-btn`).addEventListener("click", () => {
    // Get the path to tags.ini one level up from the current directory
    const tagsIniPath = path.join(__dirname, "..", "tags.ini");

    // Launch Notepad with the tags.ini file
    exec(`notepad "${tagsIniPath}"`, (error) => {
      if (error) {
        console.error(`Error opening tags.ini: ${error}`);
        alert(`Could not open tags.ini: ${error.message}`);
      }
    });
  });
  // Handle the proceed button click
  document.querySelector("#proceed-btn").addEventListener("click", () => {
    const newTagsArray = getNewTagsArray();

    const filesArray = Array.from(filesListEl.options);

    filesArray.forEach((fileOption) => {
      const fullName = fileOption.textContent;

      const {
        name: fileName,
        ext: extension,
        dir: dirPath,
      } = path.parse(fullName);

      const regexForTags = /\[\w+\]/g;
      const currentTagsArray = fileName.match(regexForTags) || [];
      const fileNameWithoutTags = fileName.replaceAll(regexForTags, "").trim();

      const combinedUniqueTagsArray = [
        ...new Set([...currentTagsArray, ...newTagsArray]),
      ];
      const tagsString = combinedUniqueTagsArray.join("");

      const newFileName = `${fileNameWithoutTags} ${tagsString}${extension}`;
      const newPath = path.join(dirPath, newFileName);
      fs.rename(fullName, newPath, (error) => {
        if (error) {
          alert(error);
        } else {
          fileOption.remove();
          $addFileOption(newPath);
        }
      });
    });
  });
  document.querySelector(`#copy-tags-btn`).addEventListener("click", () => {
    const newTagsArray = getNewTagsArray();
    const textToBeCopied = newTagsArray.join("");
    if (textToBeCopied) clipboard.writeText(textToBeCopied);
  });
  document
    .querySelector(`#copy-current-tags-btn`)
    .addEventListener("click", () => {
      const allTags = [];
      const regexForTags = /\[\w+\]/g;

      // Iterate through all options in the select element
      Array.from(filesListEl.options).forEach((fileOption) => {
        // Get the file name from the option's text content
        const fileName = fileOption.textContent;

        // Extract tags from the file name
        const tags = fileName.match(regexForTags) || [];

        // Add tags to the collection
        allTags.push(...tags);
      });

      // Create a Set to get unique tags and then join them into a string
      const uniqueTags = [...new Set(allTags)].join("");
      clipboard.writeText(uniqueTags);
    });
  // Handle file removal
  document.querySelector("#remove-btn").addEventListener("click", () => {
    filesListEl.remove(filesListEl.selectedIndex);
    filesListEl.selectedIndex = 0;
  });
  document.querySelector("#clear-btn").addEventListener("click", () => {
    $(filesListEl).find("option").remove();
  });

  // Read and parse the ini file
  const iniContent = fs.readFileSync("./tags.ini", "utf-8");
  const config = ini.parse(iniContent);
  const sortedData = sortObjectGroupsAlphabetically(config);

  const mainEl = document.querySelector("#main");

  // Populate the UI with tags from the ini file
  Object.entries(sortedData).forEach(([group, groupData]) => {
    const $groupEl = $(
      `<div class="group"><span class="heading">${group}</span></div>`
    ).appendTo(mainEl);

    Object.keys(groupData).forEach((key) => {
      $(`<input type="checkbox" id="${key}">`).appendTo($groupEl);
      $(`<label for="${key}">${key}</label>`)
        .appendTo($groupEl)
        .on("contextmenu", (event) => {
          const esQuery = `[${event.target.textContent}]`;
          const tempWindow = window.open(`es://"${esQuery}"`);
          tempWindow.close();
        });
    });
  });

  //* Search and filter

  // Add this code inside your existing IIFE in renderer.js, after the UI is populated with tags

  // Add elements for search functionality
  const noTagsMessage = document.createElement("div");
  noTagsMessage.id = "no-tags-message";
  noTagsMessage.textContent = "No matching tags found";
  mainEl.appendChild(noTagsMessage);

  // Setup tag search functionality
  const tagSearchInput = document.querySelector("#tag-search");
  const clearSearchButton = document.querySelector("#clear-search");

  // Function to filter tags based on search input
  function filterTags(searchText) {
    const searchLower = searchText.toLowerCase();
    let anyVisible = false;
    let visibleGroups = 0;

    // Add class to label elements for easier selection
    const labels = document.querySelectorAll(".group label");
    labels.forEach((label) => {
      if (!label.classList.contains("tag-label")) {
        label.classList.add("tag-label");
      }
    });

    // Handle groups and their tags
    const groups = document.querySelectorAll(".group");
    groups.forEach((group) => {
      const heading = group.querySelector(".heading").textContent;
      const tags = group.querySelectorAll(".tag-label");

      let groupHasVisibleTags = false;

      tags.forEach((tag) => {
        const tagText = tag.textContent;

        if (searchLower === "" || tagText.toLowerCase().includes(searchLower)) {
          tag.classList.remove("hidden");
          groupHasVisibleTags = true;
          anyVisible = true;

          // Highlight matching text if there's a search
          if (searchLower !== "") {
            const regex = new RegExp(`(${escapeRegExp(searchText)})`, "gi");
            tag.innerHTML = tagText.replace(
              regex,
              '<span class="highlight">$1</span>'
            );
          } else {
            tag.textContent = tagText; // Reset the content
          }
        } else {
          tag.classList.add("hidden");
        }
      });

      if (groupHasVisibleTags || heading.toLowerCase().includes(searchLower)) {
        group.classList.remove("hidden");
        visibleGroups++;
      } else {
        group.classList.add("hidden");
      }
    });

    // Show/hide "No tags found" message
    if (!anyVisible) {
      noTagsMessage.classList.add("visible");
    } else {
      noTagsMessage.classList.remove("visible");
    }
  }

  // Helper function to escape special characters in string for regex
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Event listener for search input
  tagSearchInput.addEventListener("input", () => {
    filterTags(tagSearchInput.value);
  });

  // Event listener for clear button
  clearSearchButton.addEventListener("click", () => {
    tagSearchInput.value = "";
    filterTags("");
    tagSearchInput.focus();
  });

  // Add keyboard shortcut (Ctrl+F or Cmd+F) to focus search box
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "f") {
      event.preventDefault();
      tagSearchInput.focus();
    }

    // Press Escape to clear search
    if (event.key === "Escape" && document.activeElement === tagSearchInput) {
      tagSearchInput.value = "";
      filterTags("");
    }
  });

  // Update label selection when filtering is applied
  // This ensures that existing checkboxes still work correctly
  function $addFileOption(text) {
    const $option = $(`<option>${text}</option>`);
    filesListEl.add($option[0]);

    addFileOptionHoverEffect($option[0]);

    fs.access(text, (err) => {
      if (err) {
        $option.addClass("error");
        // Add shake animation for errors
        $option[0].style.animation = "shake 0.5s ease";
      } else {
        $option.addClass("no-error");
        // Add success animation
        $option[0].style.animation = "slideIn 0.3s ease";
      }
    });

    return $option;
  }

  //* drag and drop

  // Prevent the default behavior when a file is dragged over the window
  window.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  window.addEventListener("drop", (event) => {
    event.preventDefault();

    clearFilesList();
    clearActiveTags();

    const files = Array.from(event.dataTransfer.files);
    const droppedFilesArray = files.map((file) => file.path);
    prepareInputFilesSection(droppedFilesArray);

    // Send the file paths to the main process
    // ipcRenderer.send( 'files-dropped', files.map( file => file.path ) )
  });

  //*__________________________________________________________________________________________________________________

  function clearActiveTags() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  function clearFilesList() {
    $(filesListEl).find("option").remove();
  }

  function getArgs() {
    return new Promise((resolve) => {
      ipcRenderer.on("command-line-args", (event, args) => {
        resolve(args);
      });
    });
  }

  function prepareInputFilesSection(inputFilesArray) {
    // Populate the file list dropdown
    inputFilesArray.forEach((file) => {
      $addFileOption(file);
    });
  }

  function $addFileOption(text) {
    const $option = $(`<option>${text}</option>`);
    filesListEl.add($option[0]);

    fs.access(text, (err) => {
      if (err) {
        $option.addClass("error");
      } else {
        $option.addClass("no-error");
      }
    });

    return $option;
  }

  function getNewTagsArray() {
    return Array.from(document.querySelectorAll("input:checked")).map(
      (item) => `[${item.labels[0].textContent}]`
    );
  }

  function sortObjectGroupsAlphabetically(obj) {
    const sortedObj = {};

    Object.keys(obj).forEach((group) => {
      sortedObj[group] = {};

      // Sort keys alphabetically, ignoring case
      Object.keys(obj[group])
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          sortedObj[group][key] = obj[group][key];
        });
    });

    return sortedObj;
  }
})();
