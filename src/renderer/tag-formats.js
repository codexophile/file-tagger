'use strict';

// These source strings are kept simple so non-JavaScript tools can reuse them.
const LEGACY_TAG_PATTERN = String.raw`\[[^\[\]]+\]`;
const MULTI_TAG_PATTERN = String.raw`\[[^\[\],\s]+(?:[\s,]+[^\[\],\s]+)+\]`;

const LEGACY_TAG_REGEX = new RegExp(LEGACY_TAG_PATTERN, 'g');
const MULTI_TAG_REGEX = new RegExp(MULTI_TAG_PATTERN, 'g');
const ANY_TAG_REGEX = new RegExp(
  `(?:${MULTI_TAG_PATTERN})|(?:${LEGACY_TAG_PATTERN})`,
  'g'
);
const NEW_FORMAT_TAG_NAME_REGEX = /^[^\[\],\s]+$/;

function parseTags(text) {
  const tags = [];
  const matches = text.match(ANY_TAG_REGEX) || [];

  matches.forEach(tagBlock => {
    const contents = tagBlock.slice(1, -1);
    if (MULTI_TAG_REGEX.test(tagBlock)) {
      MULTI_TAG_REGEX.lastIndex = 0;
      contents
        .split(/[\s,]+/)
        .filter(Boolean)
        .forEach(tag => tags.push(`[${tag}]`));
    } else {
      tags.push(tagBlock);
    }
  });

  ANY_TAG_REGEX.lastIndex = 0;
  return tags;
}

function formatNewTagGroup(tagNames) {
  return `[${tagNames.join(' ')}]`;
}

function canUseNewFormat(tagNames) {
  return tagNames.length > 0 && tagNames.every(tagName =>
    NEW_FORMAT_TAG_NAME_REGEX.test(tagName)
  );
}

module.exports = {
  LEGACY_TAG_PATTERN,
  MULTI_TAG_PATTERN,
  LEGACY_TAG_REGEX,
  MULTI_TAG_REGEX,
  ANY_TAG_REGEX,
  parseTags,
  formatNewTagGroup,
  canUseNewFormat,
};
