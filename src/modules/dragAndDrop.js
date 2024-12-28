const setupDragAndDrop = ( dropZone, filesListEl, addFileCallback ) => {
  const preventDefault = ( e ) => {
    e.preventDefault();
    e.stopPropagation();
  };

  dropZone.addEventListener( 'dragover', ( e ) => {
    preventDefault( e );
    dropZone.classList.add( 'dragover' );
  } );

  dropZone.addEventListener( 'dragleave', ( e ) => {
    preventDefault( e );
    dropZone.classList.remove( 'dragover' );
  } );

  dropZone.addEventListener( 'drop', ( e ) => {
    preventDefault( e );
    dropZone.classList.remove( 'dragover' );

    const files = Array.from( e.dataTransfer.files );
    files.forEach( file => {
      addFileCallback( file.path, filesListEl );
    } );
  } );
};

module.exports = {
  setupDragAndDrop
};
