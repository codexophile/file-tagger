const { readIniFile } = require( '../utils/fileSystem' );
const { sortObjectGroupsAlphabetically, populateTagsUI } = require( './tagHandling' );

const initializeApplication = ( mainEl, tagsIniPath ) => {
  const config = readIniFile( tagsIniPath );
  const sortedData = sortObjectGroupsAlphabetically( config );
  populateTagsUI( mainEl, sortedData );
};

module.exports = {
  initializeApplication
};