const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

//* Single instance lock
// Attempt to acquire the single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  console.log("Another instance is already running. Quitting this one.");
  app.quit();
} else {
  // This is the primary instance, set up the 'second-instance' handler

  let mainWindow = null;

  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("test");
    console.log("Second instance detected. Arguments:", commandLine);

    // Someone tried to run a second instance, focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    // --- Process the command line arguments ---
    // commandLine is an array like process.argv
    // The first element is usually the path to Electron or your app executable.
    // The second element might be your app's main script.
    // Subsequent elements are the arguments passed by the user.
    const usefulArgs = commandLine.slice(app.isPackaged ? 1 : 2); // Adjust slice index based on packaging
    console.log("Useful arguments received:", usefulArgs);

    // Example: If an argument is a file path, open it
    if (usefulArgs.length > 0) {
      const filePath = usefulArgs[0]; // Assuming the first arg is a file
      // Send the file path to the renderer process or handle directly here
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("open-file-argument", filePath);
      } else {
        // Handle the case where the window might not be ready yet
        // Maybe queue the argument or handle it after the window is created
        console.log("Main window not ready to handle args yet.");
      }
    }
  });
  // Handle creating/removing shortcuts on Windows when installing/uninstalling.
  if (require("electron-squirrel-startup")) {
    app.quit();
  }

  const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      y: -800,
      x: 300,
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // and load the index.html of the app.
    mainWindow.maximize();
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Pass arguments to the renderer process
    mainWindow.webContents.on("did-finish-load", () => {
      mainWindow.webContents.send("command-line-args", process.argv.slice(2));
    });
  };

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    ipcMain.on("request-command-line-args", (event) => {
      console.log("Main process received request for command line args.");
      // process.argv[0] is node executable
      // process.argv[1] is usually the path to your app's main script
      // The actual arguments start from index 2
      const actualArgs = process.argv.slice(2);
      console.log("Sending args to renderer:", actualArgs);
      // Send args back to the specific window that requested them
      event.sender.send("command-line-args", actualArgs);
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  // Listen for the 'files-dropped' event from the renderer process
  ipcMain.on("files-dropped", (event, filePaths) => {
    console.log("Files dropped:", filePaths);

    // Perform your task with the file paths here
    filePaths.forEach((filePath) => {
      console.log(`Processing file: ${filePath}`);
      // You can now read the file, move it, or perform other operations
    });
  });
}
