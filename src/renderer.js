const { setupDragAndDrop } = require( './modules/dragAndDrop' );
const { $addFileOption } = require( './modules/fileHandling' );
const { setupTagEditing } = require( './modules/tagHandling' );
const { setupButtonListeners } = require( './modules/uiHandling' );
const { initializeApplication } = require( './modules/initializer' );
const { processInputFiles } = require( './modules/fileProcessor' );
const { getCommandLineArgs } = require( './utils/args' );
const { tagsIniPath } = require( './config/paths' );

( async function () {
  'use strict';

  // Setup jQuery
  window.$ = window.jQuery = require( 'jquery' );

  // Get DOM elements
  const filesListEl = document.querySelector( '#filesList' );
  const dropZone = document.querySelector( '#drop-zone' );
  const mainEl = document.querySelector( '#main' );

  // Initialize core functionality
  setupDragAndDrop( dropZone, filesListEl, $addFileOption );
  setupTagEditing( tagsIniPath );
  setupButtonListeners( filesListEl, tagsIniPath );
  initializeApplication( mainEl, tagsIniPath );

  // Process command line arguments
  const args = await getCommandLineArgs();
  processInputFiles( args[ 0 ], filesListEl, $addFileOption );

} )();