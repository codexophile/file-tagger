'use strict';

const { displayName } = require('./people-ui');

/**
 * Renders profile records as selectable tags with account metadata.
 *
 * @param {HTMLElement} mainElement - Profile tab container.
 * @param {Record<string, Array<Object>>} profileData - Grouped profiles.
 * @returns {void}
 * @example
 * populateProfileUI(document.querySelector('#main'), profiles);
 */
function populateProfileUI(mainElement, profileData) {
  mainElement.innerHTML = '';
  Object.entries(profileData).forEach(([groupName, profiles]) => {
    const group = document.createElement('div');
    group.className = 'group profile-group';
    group.dataset.groupName = groupName;
    group.innerHTML = `<span class="heading"></span>`;
    group.querySelector('.heading').textContent = groupName;
    profiles.forEach(profile => {
      const id = `profile-${groupName}-${profile.id}-${Date.now()}`.replace(/[^\w-]/g, '-');
      const label = profile.name || displayName(profile.id);
      const accounts = Object.entries(profile.accounts || {})
        .flatMap(([platform, values]) => values.map(value =>
          `${platform}: ${Object.values(value).filter(Boolean).join(' ')}`))
        .join(' | ');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.value = `@${profile.id}`;
      const labelElement = document.createElement('label');
      labelElement.htmlFor = id;
      labelElement.className = 'profile-label';
      labelElement.dataset.search = `${profile.id} ${label} ${accounts}`.toLowerCase();
      labelElement.textContent = accounts ? `${label} (${accounts})` : label;
      group.append(input, labelElement);
    });
    mainElement.appendChild(group);
  });
}

/**
 * Filters profile labels using the shared search field.
 *
 * @param {HTMLElement} mainElement - Profile tab container.
 * @param {HTMLElement} noTagsMessageElement - Empty state element.
 * @param {string} searchText - Search text.
 * @returns {void}
 */
function filterProfiles(mainElement, noTagsMessageElement, searchText) {
  const search = searchText.toLowerCase().trim();
  let visible = false;
  mainElement.querySelectorAll('.profile-group').forEach(group => {
    let groupVisible = false;
    group.querySelectorAll('.profile-label').forEach(label => {
      const match = !search || label.dataset.search.includes(search);
      label.style.display = match ? '' : 'none';
      label.previousElementSibling.style.display = match ? '' : 'none';
      groupVisible ||= match;
      visible ||= match;
    });
    group.classList.toggle('hidden', !groupVisible);
  });
  noTagsMessageElement.classList.toggle('visible', Boolean(search) && !visible);
}

module.exports = { populateProfileUI, filterProfiles };
