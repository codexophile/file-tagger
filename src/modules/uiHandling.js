const { clearFileList } = require( './fileHandling' );
const path = require( 'path' );
const { exec } = require( 'child_process' );
const fs = require( 'fs' );

const setupButtonListeners = ( filesListEl, tagsIniPath ) => {

  // Remove file button listener
  const removeFileButton = document.querySelector( '#remove-btn' );
  if ( removeFileButton ) {
    removeFileButton.addEventListener( 'click', () => {
      [ ...filesListEl.selectedOptions ].forEach( optionEl => {
        optionEl.remove();
      } );
    } );
  }

  // Clear all files button listener
  const clearButton = document.querySelector( '#clear-files' );
  if ( clearButton ) {
    clearButton.addEventListener( 'click', () => {
      clearFileList( filesListEl );
    } );
  }

  // Save tags button listener
  const saveButton = document.querySelector( '#save-tags' );
  if ( saveButton ) {
    saveButton.addEventListener( 'click', () => {
      saveTagsToIni( tagsIniPath );
    } );
  }

  const editTagsButton = document.querySelector( '#edit-tags-btn' );
  if ( editTagsButton ) {
    editTagsButton.addEventListener( 'click', () => {

      // Get the path to tags.ini one level up from the current directory
      const tagsIniPath = path.join( __dirname, '../..', 'tags.ini' );
      if ( !fs.existsSync( tagsIniPath ) ) {
        alert( `couldn't find tags.ini at ${ tagsIniPath }` );
        return;
      }

      // Launch Notepad with the tags.ini file
      exec( `notepad "${ tagsIniPath }"`, ( error ) => {
        if ( error ) {
          console.error( `Error opening tags.ini: ${ error }` );
          alert( `Could not open tags.ini: ${ error.message }` );
        }
      } );
    } );
  }

};

module.exports = {
  setupButtonListeners
};