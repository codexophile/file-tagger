const processInputFiles = ( inputFilesString, filesListEl, addFileCallback ) => {
  if ( !inputFilesString ) return;

  const inputFilesArray = inputFilesString.trim().split( /\r?\n/ );
  inputFilesArray.forEach( file => {
    addFileCallback( file, filesListEl );
  } );
};

module.exports = {
  processInputFiles
};