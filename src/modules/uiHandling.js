const { handleFileRemoval, clearFileList } = require( './fileHandling' );

const setupButtonListeners = ( filesListEl, tagsIniPath ) => {
  // Remove file button listener
  filesListEl.addEventListener( 'click', ( e ) => {
    if ( e.target.classList.contains( 'remove-file' ) ) {
      const fileId = e.target.dataset.fileId;
      handleFileRemoval( fileId );
    }
  } );

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
};

module.exports = {
  setupButtonListeners
};