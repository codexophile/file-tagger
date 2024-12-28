const { ipcRenderer } = require( 'electron' );

const getCommandLineArgs = () => {
  return new Promise( resolve => {
    ipcRenderer.on( 'command-line-args', ( event, args ) => {
      resolve( args );
    } );
  } );
};

module.exports = {
  getCommandLineArgs
};