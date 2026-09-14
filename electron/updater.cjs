const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let updateState = {
  status: "idle",
  version: null,
  percent: 0,
  transferred: 0,
  total: 0,
  error: null,
};

function send(channel, data = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channel, {
    ...data,
    ...updateState,
  });
}

function configureUpdater(window) {
  mainWindow = window;

  // No descargar silenciosamente antes de que el usuario lo sepa.
  autoUpdater.autoDownload = false;

  // Evita instalar automáticamente mientras Windows está cerrando sesión.
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => {
    updateState = {
      ...updateState,
      status: "checking",
      error: null,
    };

    send("update:checking");
  });

  autoUpdater.on("update-available", (info) => {
    updateState = {
      ...updateState,
      status: "available",
      version: info.version,
      percent: 0,
      error: null,
    };

    send("update:available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseName: info.releaseName,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    updateState = {
      ...updateState,
      status: "not-available",
      version: info.version,
      percent: 0,
      error: null,
    };

    send("update:not-available", {
      version: info.version,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    updateState = {
      ...updateState,
      status: "downloading",
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
    };

    send("update:progress", {
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
      bytesPerSecond: progress.bytesPerSecond || 0,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateState = {
      ...updateState,
      status: "downloaded",
      version: info.version,
      percent: 100,
      error: null,
    };

    send("update:downloaded", {
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    console.error("❌ Error del actualizador:", error);

    updateState = {
      ...updateState,
      status: "error",
      error: error?.message || "Error desconocido durante la actualización.",
    };

    send("update:error", {
      message: error?.message || "Error desconocido durante la actualización.",
    });
  });
}

async function checkForUpdates() {
  if (!autoUpdater) {
    return;
  }

  try {
    console.log("🔎 Buscando actualizaciones...");

    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error(
      "❌ No se pudo comprobar actualizaciones:",
      error.message
    );
  }
}

function downloadUpdate() {
  try {
    console.log("⬇️ Iniciando descarga de actualización...");
    autoUpdater.downloadUpdate();
  } catch (error) {
    console.error(
      "❌ No se pudo iniciar la descarga:",
      error.message
    );
  }
}

function installUpdate() {
  try {
    console.log("🔄 Instalando actualización...");

    autoUpdater.quitAndInstall({
      isSilent: false,
      isForceRunAfter: true,
    });
  } catch (error) {
    console.error(
      "❌ No se pudo instalar la actualización:",
      error.message
    );
  }
}

function getUpdateState() {
  return {
    ...updateState,
  };
}

module.exports = {
  configureUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateState,
};