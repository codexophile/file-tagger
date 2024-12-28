const $addFileOption = ( filePath, filesListEl ) => {
  const fileId = `file-${ Date.now() }`;
  const fileItem = document.createElement( 'div' );
  fileItem.className = 'file-item';
  fileItem.id = fileId;

  fileItem.innerHTML = `
    <span class="file-path">${ filePath }</span>
    <button class="remove-file" data-file-id="${ fileId }">
      Remove
    </button>
  `;

  filesListEl.appendChild( fileItem );
};

const handleFileRemoval = ( fileId ) => {
  const fileElement = document.getElementById( fileId );
  if ( fileElement ) {
    fileElement.remove();
  }
};

const clearFileList = ( filesListEl ) => {
  while ( filesListEl.firstChild ) {
    filesListEl.removeChild( filesListEl.firstChild );
  }
};

module.exports = {
  $addFileOption,
  handleFileRemoval,
  clearFileList
};