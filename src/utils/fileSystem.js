const fs = require( 'fs' );
const ini = require( 'ini' );

const readIniFile = ( path ) => {
  const content = fs.readFileSync( path, 'utf-8' );
  return ini.parse( content );
};

module.exports = {
  readIniFile
};