'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Loads a shared GFMS module from a packaged resource or the development tree.
 *
 * @param {string} moduleName - Shared module filename.
 * @returns {Object} The loaded shared module.
 * @throws {Error} If the shared module cannot be found.
 * @example
 * const tagging = loadSharedModule('tagging.js');
 */
function loadSharedModule(moduleName) {
  const packagedPath = process.resourcesPath
    ? path.join(process.resourcesPath, 'shared', moduleName)
    : '';
  const developmentPath = path.resolve(__dirname, '../../../shared', moduleName);
  const modulePath =
    packagedPath && fs.existsSync(packagedPath)
      ? packagedPath
      : developmentPath;

  return require(modulePath);
}

module.exports = { loadSharedModule };
