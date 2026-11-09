'use strict';

const { loadSharedModule } = require('./shared-module');

/**
 * Compatibility facade for renderer modules that still import the old path.
 *
 * @module tag-formats
 */
module.exports = loadSharedModule('tagging.js');
