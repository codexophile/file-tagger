const fs = require( 'fs' );

const $addFileOption = ( filePath, filesListEl ) => {

  const $option = $( `<option>${ filePath }</option>` );
  filesListEl.add( $option[ 0 ] );

  fs.access( filePath, ( err ) => {
    if ( err ) {
      $option.addClass( 'error' );
    } else {
      $option.addClass( 'no-error' );
    }
  } );

  return $option;

};

const clearFileList = ( filesListEl ) => {
  while ( filesListEl.firstChild ) {
    filesListEl.removeChild( filesListEl.firstChild );
  }
};

module.exports = {
  $addFileOption,
  clearFileList
};