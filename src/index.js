const { app, BrowserWindow, ipcMain } = require( 'electron' );
const path = require( 'node:path' );

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if ( require( 'electron-squirrel-startup' ) ) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow( {
    y: -800,
    x: 300,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join( __dirname, 'preload.js' ),
      nodeIntegration: true,
      contextIsolation: false
    },
  } );

  // and load the index.html of the app.
  mainWindow.maximize();
  mainWindow.loadFile( path.join( __dirname, 'index.html' ) );

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Pass arguments to the renderer process
  mainWindow.webContents.on( 'did-finish-load', () => {
    mainWindow.webContents.send( 'command-line-args', process.argv.slice( 2 ) );
  } );

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then( () => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on( 'activate', () => {
    if ( BrowserWindow.getAllWindows().length === 0 ) {
      createWindow();
    }
  } );
} );

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on( 'window-all-closed', () => {
  if ( process.platform !== 'darwin' ) {
    app.quit();
  }
} );

// Listen for the 'files-dropped' event from the renderer process
ipcMain.on( 'files-dropped', ( event, filePaths ) => {
  console.log( 'Files dropped:', filePaths );

  // Perform your task with the file paths here
  filePaths.forEach( filePath => {
    console.log( `Processing file: ${ filePath }` );
    // You can now read the file, move it, or perform other operations
  } );
} );
