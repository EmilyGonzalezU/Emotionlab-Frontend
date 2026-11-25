const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  updater: {
    onChecking: (callback) => {
      ipcRenderer.on("update:checking", (_event, data) => {
        callback(data);
      });
    },

    onAvailable: (callback) => {
      ipcRenderer.on("update:available", (_event, data) => {
        callback(data);
      });
    },

    onNotAvailable: (callback) => {
      ipcRenderer.on("update:not-available", (_event, data) => {
        callback(data);
      });
    },

    onProgress: (callback) => {
      ipcRenderer.on("update:progress", (_event, data) => {
        callback(data);
      });
    },

    onDownloaded: (callback) => {
      ipcRenderer.on("update:downloaded", (_event, data) => {
        callback(data);
      });
    },

    onError: (callback) => {
      ipcRenderer.on("update:error", (_event, data) => {
        callback(data);
      });
    },

    download: () => {
      return ipcRenderer.invoke("update:download");
    },

    install: () => {
      return ipcRenderer.invoke("update:install");
    },

    check: () => {
      return ipcRenderer.invoke("update:check");
    },
  },
});
