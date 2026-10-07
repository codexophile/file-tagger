'use strict';

const $ = require('jquery');
const { pathToFileURL } = require('url');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function getPhotoSource(photo) {
  if (!photo || /^(data:|https?:|file:)/i.test(photo)) return photo;
  return pathToFileURL(photo).href;
}

function createPersonElement(person, groupName) {
  const id = `person-${groupName}-${person.tag.slice(1)}-${Date.now()}`
    .replace(/[^\w-]/g, '-');
  const photo = person.photo
    ? `<img class="person-photo" src="${escapeHtml(getPhotoSource(person.photo))}" alt="">`
    : '<div class="person-photo placeholder-photo" aria-hidden="true">👤</div>';
  const links = person.links.length
    ? `<div class="person-links">${person.links.map(link =>
        `<a href="${escapeHtml(link)}" target="_blank" rel="noreferrer">${escapeHtml(link)}</a>`
      ).join('')}</div>`
    : '';
  const description = person.name
    ? `<span class="person-name">${escapeHtml(person.name)}</span>`
    : '';

  return $(`<div class="person-card" data-search="${escapeHtml(
    `${person.tag} ${person.name} ${person.links.join(' ')}`
  )}">
    <input type="checkbox" id="${escapeHtml(id)}" value="${escapeHtml(person.tag)}">
    <label for="${escapeHtml(id)}" class="person-label">
      ${photo}
      <span class="person-details">
        <span class="person-tag">${escapeHtml(person.tag)}</span>
        ${description}
        ${links}
      </span>
    </label>
  </div>`);
}

function populatePeopleUI(mainElement, peopleData) {
  const $main = $(mainElement).empty();
  Object.entries(peopleData).forEach(([groupName, people]) => {
    const $group = $(`<div class="group people-group" data-group-name="${escapeHtml(groupName)}">
      <span class="heading">${escapeHtml(groupName)}</span>
    </div>`);
    people.forEach(person => $group.append(createPersonElement(person, groupName)));
    $main.append($group);
  });
}

function filterPeople(mainElement, noTagsMessageElement, searchText) {
  const search = searchText.toLowerCase().trim();
  let anyVisible = false;
  mainElement.querySelectorAll('.group').forEach(group => {
    let groupVisible = false;
    group.querySelectorAll('.person-card').forEach(card => {
      const visible = !search || card.dataset.search.toLowerCase().includes(search);
      card.style.display = visible ? '' : 'none';
      groupVisible ||= visible;
      anyVisible ||= visible;
    });
    group.classList.toggle('hidden', !groupVisible);
  });
  noTagsMessageElement.classList.toggle('visible', !anyVisible && Boolean(search));
}

module.exports = { populatePeopleUI, filterPeople };
