const { clearFileList } = require( './fileHandling' );
const { getNewTagsArray } = require( './tagHandling' );
const path = require( 'path' );
const { exec } = require( 'child_process' );
const fs = require( 'fs' );
const { clipboard } = require( 'electron' );

const setupButtonListeners = ( filesListEl, tagsIniPath ) => {

  document.querySelector( `#copy-tags-btn` ).addEventListener( 'click', () => {
    const queryForSelectedTagEls = `.group input[type="checkbox"]:checked + label`;
    const selectedTagEls = document.querySelectorAll( queryForSelectedTagEls );
    const selectedTagArr = Array.from( selectedTagEls ).map( el => `[${ el.textContent }]` );
    const selectedTagString = selectedTagArr.join( '' );
    if ( selectedTagString )
      clipboard.writeText( selectedTagString );
  } );

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
  const clearButton = document.querySelector( '#clear-btn' );
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