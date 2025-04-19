// --- START OF FILE renderer/ipc-handler.js ---
"use strict";
const { ipcRenderer } = require("electron");

function getArgs() {
  return new Promise((resolve, reject) => {
    let resolved = false;
    // Listener for the args
    const listener = (event, args) => {
      console.log("Renderer received command-line-args:", args);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(args);
      }
    };
    ipcRenderer.once("command-line-args", listener);

    // Timeout as a fallback
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true; // Prevent listener from resolving later
        ipcRenderer.removeListener("command-line-args", listener); // Clean up listener
        console.warn(
          "Timeout waiting for command-line-args event. No args received via IPC."
        );
        // Resolve with an empty array or reject, depending on desired behavior
        resolve([]); // Resolve with empty args on timeout
        // reject(new Error("Timeout waiting for command-line-args"));
      }
    }, 3000); // 3 seconds timeout

    // Request the args from the main process
    console.log("Renderer requesting command-line-args from main...");
    ipcRenderer.send("request-command-line-args");
  });
}

module.exports = {
  getArgs,
};
// --- END OF FILE renderer/ipc-handler.js ---
