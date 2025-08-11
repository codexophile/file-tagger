// --- START OF FILE index.js ---

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

let mainWindow; // Keep a reference to the main window

// --- SINGLE INSTANCE LOCK LOGIC ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // This is the second instance. We want this one to run,
  // so we DON'T quit here. The 'second-instance' event will be
  // emitted in the *first* instance, which we'll handle below
  // by quitting that first instance.
  console.log("Second instance detected. The first instance should quit soon.");
} else {
  // This is the first instance. Attach the 'second-instance' listener.
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    console.log("First instance received 'second-instance' event. Quitting.");
    console.log("New instance command line:", commandLine);
    console.log("New instance working directory:", workingDirectory);

    // Quit this (the first) instance immediately.
    app.quit(); // Force quit the original instance
  });

  // Continue setting up the first instance below...
  console.log(
    "First instance acquired lock. Ready for potential second instances."
  );
}
// --- END SINGLE INSTANCE LOCK LOGIC ---

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    // Assign to the outer variable
    y: -800,
    x: 300,
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true, // Be cautious with nodeIntegration
      contextIsolation: false, // Consider setting contextIsolation: true and using a preload script for IPC
    },
  });

  // and load the index.html of the app.
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Pass arguments to the renderer process
  mainWindow.webContents.on("did-finish-load", () => {
    // Send the arguments of the *current* running instance
    mainWindow.webContents.send("command-line-args", process.argv.slice(2));
  });

  // Clean up window reference
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// REMOVE the old second-instance listener, it's handled by the lock logic now.
// app.on("second-instance", (event, commandLine, workingDirectory) => {
//   console.log("Second instance launched:", commandLine, workingDirectory);
// });

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // createWindow will only be called if:
  // 1. This is the first instance (gotTheLock was true).
  // 2. This is the second instance (gotTheLock was false), and it didn't quit immediately.
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
  // On macOS, the app should only quit if invoked by Cmd+Q
  // Or if the 'second-instance' handler explicitly called app.quit()
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
// --- END OF FILE index.js ---
