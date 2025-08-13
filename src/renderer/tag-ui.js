// --- START OF FILE renderer/tag-ui.js ---
'use strict';
const $ = require('jquery');
const { clipboard } = require('electron');
const { escapeRegExp } = require('./utils');
const { saveNewTag } = require('./tag-store'); // For saving inline adds

// --- Private Helper Functions ---

function handleTagContextMenu(event) {
  event.preventDefault();
  const tagName = event.target.textContent;
  const esQuery = `[${tagName}]`;
  try {
    // Attempt to open Everything search link
    const tempWindow = window.open(`es://"${esQuery}"`);
    if (tempWindow) {
      // Close the blank tab/window that might open
      setTimeout(() => {
        try {
          tempWindow.close();
        } catch (e) {}
      }, 500);
    } else {
      throw new Error('window.open returned null or undefined.'); // Trigger catch block
    }
  } catch (err) {
    console.error(
      'Error trying to open es:// link or clipboard fallback:',
      err
    );
    clipboard.writeText(esQuery);
    alert(
      `Copied tag query "${esQuery}" to clipboard.\n(Could not launch Everything search directly)`
    );
  }
}

function handleSaveNewTag(
  tagsIniPath,
  $input,
  $container,
  groupName,
  $groupEl,
  $addButton
) {
  const newTagName = $input.val().trim();

  // --- Validation ---
  if (!newTagName) {
    alert('Tag name cannot be empty.');
    $input.trigger('focus');
    return;
  }
  if (/[\[\]]/.test(newTagName)) {
    alert("Tag names cannot contain '[' or ']' characters.");
    $input.trigger('focus');
    return;
  }

  // Check for duplicates visually within this group
  let tagExists = false;
  $groupEl.find('label.tag-label').each(function () {
    if ($(this).text().toLowerCase() === newTagName.toLowerCase()) {
      tagExists = true;
      return false; // exit $.each loop
    }
  });

  if (tagExists) {
    alert(`Tag "${newTagName}" already exists in the "${groupName}" group.`);
    $input.trigger('focus');
    return;
  }
  // --- End Validation ---

  // Attempt to save the tag to the INI file
  if (saveNewTag(tagsIniPath, groupName, newTagName)) {
    // --- Add to UI ---
    const $insertBefore = $container.length ? $container : $addButton;
    const { $label } = createTagElement(newTagName, $groupEl, $insertBefore); // Get the new label

    // Sort tags visually within the group
    sortTagsInGroup($groupEl);

    // --- Cleanup ---
    $container.remove();
    $addButton.removeClass('hidden-add-tag');

    // Optional: Flash the new tag
    if ($label && $label.length) {
      $label
        .css({
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        })
        .animate({ backgroundColor: '', color: '' }, 1500); // Animate back to default
    }
    console.log(`Tag "${newTagName}" added to UI and saved.`);
  } else {
    // Error saving (alert handled in saveNewTag)
    $input.trigger('focus'); // Keep input focus on error
  }
}

function handleCancelAddTag($container, $addButton = null) {
  const $groupEl = $container.closest('.group');
  $container.remove(); // Remove the input UI

  // Find the corresponding add button if not passed explicitly
  const $buttonToShow =
    $addButton || $groupEl.find('.add-tag-btn.hidden-add-tag');
  if ($buttonToShow && $buttonToShow.length > 0) {
    $buttonToShow.removeClass('hidden-add-tag');
  }
}

function showAddTagInput(tagsIniPath, groupName, $groupEl, $addButton) {
  // Remove any existing add input UI in *this* group first
  $groupEl.find('.add-tag-inline-container').each(function () {
    handleCancelAddTag($(this)); // Use cancel logic to ensure button is shown
  });

  // Create the container, input, and buttons
  const $container = $('<span class="add-tag-inline-container"></span>');
  const $input = $(
    '<input type="text" class="add-tag-input-inline" placeholder="New tag name">'
  );
  const $saveBtn = $(
    '<button class="action-button-small save" title="Save Tag">✔️</button>'
  );
  const $cancelBtn = $(
    '<button class="action-button-small cancel" title="Cancel">❌</button>'
  );

  $container.append($input).append($saveBtn).append($cancelBtn);
  $container.insertAfter($addButton); // Insert right after the '+' button

  // --- Event Handlers for the new UI ---
  $saveBtn.on('click', () => {
    handleSaveNewTag(
      tagsIniPath,
      $input,
      $container,
      groupName,
      $groupEl,
      $addButton
    );
  });
  $cancelBtn.on('click', () => {
    handleCancelAddTag($container, $addButton);
  });
  $input.on('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveNewTag(
        tagsIniPath,
        $input,
        $container,
        groupName,
        $groupEl,
        $addButton
      );
    }
  });
  $input.on('keydown', e => {
    if (e.key === 'Escape') {
      e.stopPropagation(); // Prevent global Escape handler if needed
      handleCancelAddTag($container, $addButton);
    }
  });

  $input.trigger('focus');
}

// --- Group Helpers ---

function addGroupToUI(tagsIniPath, mainTagsContainerEl, groupName) {
  const $groupEl = $(`<div class="group" data-group-name="${groupName}">
                                <span class="heading">${groupName}</span>
                              </div>`);

  // Add the "Add Tag" button (+) to the group
  const $addTagBtn = $(`<button class="add-tag-btn" title="Add new tag to '${groupName}'">+</button>`);
  $addTagBtn.on("click", (e) => {
    $(e.currentTarget).addClass("hidden-add-tag");
    showAddTagInput(tagsIniPath, groupName, $groupEl, $(e.currentTarget));
  });
  $groupEl.append($addTagBtn);

  // Insert group in sorted order among existing groups
  insertGroupSorted($(mainTagsContainerEl), $groupEl);
}

function insertGroupSorted($container, $newGroup) {
  const newName = ($newGroup.data("group-name") || "").toLowerCase();
  const $groups = $container.children('.group');

  let inserted = false;
  $groups.each(function() {
    const $existing = $(this);
    const existingName = ($existing.data('group-name') || '').toLowerCase();
    if (newName.localeCompare(existingName) < 0) {
      $newGroup.insertBefore($existing);
      inserted = true;
      return false; // break
    }
  });
  if (!inserted) {
    $container.append($newGroup);
  }
}

// --- Exported Functions ---

function createTagElement(tagKey, $groupEl, insertBeforeElement = null) {
  const safeGroupName = ($groupEl.data('group-name') || 'nogroup').replace(
    /[^a-zA-Z0-9-_]/g,
    ''
  );
  const safeTagKey = tagKey.replace(/[^a-zA-Z0-9-_]/g, '');
  const uniqueId = `${safeGroupName}-${safeTagKey}-${Date.now()}`;

  const $checkbox = $(`<input type="checkbox" id="${uniqueId}">`);
  const $label = $(`<label for="${uniqueId}">${tagKey}</label>`)
    .addClass('tag-label')
    .on('contextmenu', handleTagContextMenu); // Attach context menu handler

  // Determine insertion point more robustly
  let $insertionTarget = insertBeforeElement;
  if (!$insertionTarget || $insertionTarget.length === 0) {
    // If no specific target, try inserting before the add button or UI
    $insertionTarget = $groupEl.find('.add-tag-inline-container').first();
    if ($insertionTarget.length === 0) {
      $insertionTarget = $groupEl.find('.add-tag-btn').first();
    }
  }

  if ($insertionTarget && $insertionTarget.length > 0) {
    $checkbox.insertBefore($insertionTarget);
  } else {
    // Fallback: append to the group container
    $groupEl.append($checkbox);
  }
  // Always insert label immediately after its checkbox
  $label.insertAfter($checkbox);

  return { $checkbox, $label }; // Return elements for potential further manipulation
}

function sortTagsInGroup($groupEl) {
  const $addBtn = $groupEl.find('.add-tag-btn').detach();
  const $addUI = $groupEl.find('.add-tag-inline-container').detach();

  const $tagItems = $groupEl
    .find("input[type='checkbox']")
    .map(function () {
      const $checkbox = $(this);
      const $label = $checkbox.next('label.tag-label');
      if ($label.length) {
        // Return an object containing both elements and the text for sorting
        return {
          checkbox: $checkbox[0],
          label: $label[0],
          text: $label.text().toLowerCase(),
        };
      }
      return null; // Skip if no corresponding label found
    })
    .get() // Get as a standard JS array
    .filter(item => item !== null); // Remove any null entries

  // Sort the items based on the cached label text
  $tagItems.sort((a, b) => a.text.localeCompare(b.text));

  // Re-append sorted items (checkbox first, then label)
  $tagItems.forEach(item => {
    $groupEl.append(item.checkbox);
    $groupEl.append(item.label);
  });

  // Re-append add UI (if it was active) and the add button
  if ($addUI.length) $groupEl.append($addUI);
  if ($addBtn.length) $groupEl.append($addBtn);
}

function populateTagUI(tagsIniPath, mainTagsContainerEl, tagData) {
  $(mainTagsContainerEl).find('.group').remove(); // Clear existing groups first

  Object.entries(tagData).forEach(([group, groupData]) => {
  const $groupEl = $(`<div class=\"group\" data-group-name=\"${group}\">\n                                <span class=\"heading\">${group}</span>\n                              </div>`).appendTo(mainTagsContainerEl);

    // Add existing tags
    if (typeof groupData === 'object' && groupData !== null) {
      Object.keys(groupData).forEach(key => {
        createTagElement(key, $groupEl); // Appends by default
      });
    }

    // Add the "Add Tag" button (+) to the group
    const $addTagBtn = $(
      `<button class="add-tag-btn" title="Add new tag to '${group}'">+</button>`
    );
    $addTagBtn.on('click', e => {
      $(e.currentTarget).addClass('hidden-add-tag');
      showAddTagInput(tagsIniPath, group, $groupEl, $(e.currentTarget));
    });
    $groupEl.append($addTagBtn); // Append button at the end

    // Sort tags initially after adding all of them + the button
    sortTagsInGroup($groupEl);
  });
}

function filterTags(mainTagsContainerEl, noTagsMessageEl, searchText) {
  const searchLower = searchText.toLowerCase().trim();
  let anyVisible = false;

  const groups = mainTagsContainerEl.querySelectorAll('.group');
  groups.forEach(group => {
    const heading = group.querySelector('.heading');
    const addTagBtn = group.querySelector('.add-tag-btn');
    const addTagInlineUI = group.querySelector('.add-tag-inline-container');
    let groupHasVisibleTags = false;

    group.querySelectorAll('label.tag-label').forEach(tagLabel => {
      const tagText = tagLabel.textContent;
      const checkbox = document.getElementById(tagLabel.getAttribute('for'));

      if (searchLower === '' || tagText.toLowerCase().includes(searchLower)) {
        tagLabel.style.display = ''; // Use style for labels too for consistency
        if (checkbox) checkbox.style.display = '';
        groupHasVisibleTags = true;
        anyVisible = true;

        // Highlight
        if (searchLower !== '') {
          const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
          // Use textContent to avoid re-highlighting existing spans
          tagLabel.innerHTML = tagLabel.textContent.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
        } else {
          if (tagLabel.querySelector('span.highlight')) {
            tagLabel.textContent = tagText; // Restore original text
          }
        }
      } else {
        tagLabel.style.display = 'none';
        if (checkbox) checkbox.style.display = 'none';
        if (tagLabel.querySelector('span.highlight')) {
          tagLabel.textContent = tagText; // Restore original text if hiding
        }
      }
    });

    // Group visibility logic
    const groupNameMatches =
      heading && heading.textContent.toLowerCase().includes(searchLower);
    const groupShouldBeVisible =
      groupHasVisibleTags ||
      (searchLower !== '' && groupNameMatches) ||
      searchLower === '';

    if (groupShouldBeVisible) {
      group.classList.remove('hidden');
      // Make add button/UI visible if group is visible
      if (addTagBtn) addTagBtn.style.display = '';
      if (addTagInlineUI) addTagInlineUI.style.display = ''; // Use display: span is inline
    } else {
      group.classList.add('hidden');
      if (addTagBtn) addTagBtn.style.display = 'none';
      if (addTagInlineUI) addTagInlineUI.style.display = 'none';
    }
  });

  // Show/hide "No tags found" message
  if (!anyVisible && searchLower !== '') {
    noTagsMessageEl.classList.add('visible');
  } else {
    noTagsMessageEl.classList.remove('visible');
  }
}

function clearActiveTags(mainTagsContainerEl) {
  mainTagsContainerEl
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach(checkbox => {
      checkbox.checked = false;
    });
}

function getNewTagsArray(mainTagsContainerEl) {
  return Array.from(
    mainTagsContainerEl.querySelectorAll('input[type="checkbox"]:checked')
  )
    .map(item => {
      // Find the associated label using 'for' attribute or next sibling
      let label = item.labels ? item.labels[0] : null;
      if (!label) {
        const nextEl = item.nextElementSibling;
        if (
          nextEl &&
          nextEl.tagName === 'LABEL' &&
          nextEl.getAttribute('for') === item.id
        ) {
          label = nextEl;
        }
      }
      return label ? `[${label.textContent}]` : ''; // Get text from label
    })
    .filter(tag => tag !== ''); // Filter out potential empty tags if label not found
}

function cancelAllInlineAddTags(mainTagsContainerEl) {
  mainTagsContainerEl
    .querySelectorAll('.add-tag-inline-container')
    .forEach(el => {
      handleCancelAddTag($(el)); // Pass jQuery object
    });
}

module.exports = {
  populateTagUI,
  filterTags,
  clearActiveTags,
  getNewTagsArray,
  cancelAllInlineAddTags, // Export the cancel function
  handleCancelAddTag, // Export for direct use (e.g., Esc key)
  sortTagsInGroup, // Export if needed externally, maybe not
  createTagElement, // Export if needed externally, maybe not
  addGroupToUI,
};
// --- END OF FILE renderer/tag-ui.js ---
