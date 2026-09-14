const { app, BrowserWindow, session, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const {
  configureUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
} = require("./updater.cjs");

let mainWindow = null;
let backendProcess = null;
let backendStarted = false;

/* ============================================================
   ACTUALIZADOR
   ============================================================ */

ipcMain.handle("update:check", async () => {
  if (!app.isPackaged) {
    console.log("ℹ️ Actualizaciones deshabilitadas en desarrollo.");
    return { ok: false, reason: "development" };
  }

  try {
    await checkForUpdates();
    return { ok: true };
  } catch (error) {
    console.error(
      "❌ Error comprobando actualización:",
      error.message
    );

    return {
      ok: false,
      error: error.message,
    };
  }
});

ipcMain.handle("update:download", async () => {
  if (!app.isPackaged) {
    console.log("ℹ️ Descarga de actualización deshabilitada en desarrollo.");
    return { ok: false, reason: "development" };
  }

  try {
    downloadUpdate();

    return { ok: true };
  } catch (error) {
    console.error(
      "❌ Error iniciando descarga:",
      error.message
    );

    return {
      ok: false,
      error: error.message,
    };
  }
});

ipcMain.handle("update:install", async () => {
  if (!app.isPackaged) {
    console.log("ℹ️ Instalación de actualización deshabilitada en desarrollo.");
    return { ok: false, reason: "development" };
  }

  try {
    console.log("🔄 Preparando instalación de actualización...");

    stopBackend();

    // Damos tiempo a Windows para liberar completamente
    // el proceso y sus archivos.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    installUpdate();

    return { ok: true };
  } catch (error) {
    console.error(
      "❌ Error instalando actualización:",
      error.message
    );

    return {
      ok: false,
      error: error.message,
    };
  }
});

/* ============================================================
   BACKEND
   ============================================================ */

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "backend",
      "EmotionLabBackend.exe"
    );
  }

  const pathDesdePackaging = path.join(
    __dirname,
    "..",
    "packaging",
    "backend",
    "dist",
    "EmotionLabBackend",
    "EmotionLabBackend.exe"
  );

  const pathDesdeBackendProyecto = path.join(
    __dirname,
    "..",
    "..",
    "Emotionlab-Backend",
    "dist",
    "EmotionLabBackend",
    "EmotionLabBackend.exe"
  );

  if (fs.existsSync(pathDesdePackaging)) {
    return pathDesdePackaging;
  }

  return pathDesdeBackendProyecto;
}

function stopBackend() {
  if (!backendProcess) {
    backendStarted = false;
    return;
  }

  try {
    console.log("🛑 Deteniendo backend...");

    const pid = backendProcess.pid;

    if (process.platform === "win32") {
      try {
        spawn(
          "taskkill",
          ["/pid", String(pid), "/f", "/t"],
          {
            windowsHide: true,
            stdio: "ignore",
          }
        );
      } catch (error) {
        console.error(
          "❌ Error ejecutando taskkill:",
          error.message
        );
      }
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch (error) {
        try {
          backendProcess.kill("SIGTERM");
        } catch (error2) {
          console.error(
            "❌ Error SIGTERM:",
            error2.message
          );
        }
      }
    }

    backendProcess = null;
    backendStarted = false;

    console.log("✅ Backend detenido");
  } catch (error) {
    console.error(
      "❌ Error deteniendo backend:",
      error.message
    );

    backendProcess = null;
    backendStarted = false;
  }
}

function startBackend() {
  if (backendStarted || backendProcess) {
    console.log(
      "ℹ️ Backend ya está iniciado, omitiendo."
    );

    return;
  }

  try {
    let backendPath = getBackendPath();

    console.log("=================================");
    console.log("EmotionLab - Inicio del backend");
    console.log("=================================");
    console.log(
      "Modo:",
      app.isPackaged ? "PRODUCCIÓN" : "DESARROLLO"
    );
    console.log(
      "app.isPackaged:",
      app.isPackaged
    );
    console.log(
      "process.resourcesPath:",
      process.resourcesPath
    );
    console.log(
      "__dirname:",
      __dirname
    );
    console.log(
      "BackendPath candidato:",
      backendPath
    );

    if (!fs.existsSync(backendPath)) {
      console.error(
        "❌ NO SE ENCONTRÓ EL BACKEND EN:",
        backendPath
      );

      const alternativo = path.join(
        process.resourcesPath,
        "backend",
        "dist",
        "EmotionLabBackend",
        "EmotionLabBackend.exe"
      );

      if (
        app.isPackaged &&
        fs.existsSync(alternativo)
      ) {
        console.log(
          "ℹ️ Usando ruta alternativa del backend"
        );

        backendPath = alternativo;
      } else {
        console.error(
          "=================================================="
        );

        console.error(
          "Backend no encontrado. Verifica la estructura:"
        );

        if (app.isPackaged) {
          console.error(
            "  resources/backend/EmotionLabBackend.exe"
          );
        } else {
          console.error(
            "  packaging/backend/dist/EmotionLabBackend/EmotionLabBackend.exe"
          );

          console.error(
            "  O bien:"
          );

          console.error(
            "  ../Emotionlab-Backend/dist/EmotionLabBackend/EmotionLabBackend.exe"
          );
        }

        console.error(
          "=================================================="
        );

        return;
      }
    }

    console.log(
      "✅ Backend encontrado en:",
      backendPath
    );

    const backendDir = path.dirname(
      backendPath
    );

    console.log(
      "📁 Working directory del backend:",
      backendDir
    );

    backendProcess = spawn(
      backendPath,
      [],
      {
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        windowsHide: true,
        cwd: backendDir,
      }
    );

    backendStarted = true;

    backendProcess.stdout.on(
      "data",
      (data) => {
        const str = data
          .toString()
          .trim();

        if (str) {
          console.log(
            `[Backend] ${str}`
          );
        }
      }
    );

    backendProcess.stderr.on(
      "data",
      (data) => {
        const str = data
          .toString()
          .trim();

        if (str) {
          console.error(
            `[Backend STDERR] ${str}`
          );
        }
      }
    );

    backendProcess.on(
      "error",
      (error) => {
        console.error(
          "❌ Error iniciando backend:",
          error.message
        );

        backendStarted = false;
        backendProcess = null;
      }
    );

    backendProcess.on(
      "exit",
      (code, signal) => {
        console.log(
          `ℹ️ Backend finalizado. Código: ${code}, señal: ${signal}`
        );

        backendProcess = null;
        backendStarted = false;
      }
    );

    backendProcess.on(
      "close",
      (code, signal) => {
        console.log(
          `ℹ️ Backend cerrado completamente. Código: ${code}, señal: ${signal}`
        );

        backendProcess = null;
        backendStarted = false;
      }
    );

    console.log(
      "🚀 Proceso del backend iniciado (PID:",
      backendProcess.pid + ")"
    );
  } catch (error) {
    console.error(
      "❌ Error crítico iniciando backend:",
      error.message
    );

    backendStarted = false;
    backendProcess = null;
  }
}

/* ============================================================
   VENTANA PRINCIPAL
   ============================================================ */

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,

    title: "EmotionLab",

    autoHideMenuBar: true,

    show: false,

    backgroundColor: "#f8fafc",

    webPreferences: {
      preload: path.join(
        __dirname,
        "preload.cjs"
      ),

      nodeIntegration: false,

      contextIsolation: true,

      sandbox: true,

      webSecurity: true,

      allowRunningInsecureContent: false,

      backgroundThrottling: false,
    },
  });

  /*
   * El updater solamente se configura para
   * aplicaciones empaquetadas.
   */
  if (app.isPackaged) {
    configureUpdater(mainWindow);
  }

  /* ==========================================================
     CONTENT SECURITY POLICY
     ========================================================== */

  const csp = [
    "default-src 'self'",

    "script-src 'self'",

    "style-src 'self' 'unsafe-inline'",

    "img-src 'self' data: blob:",

    "font-src 'self' data:",

    [
      "connect-src 'self'",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "ws://localhost:5173",
      "ws://127.0.0.1:5173",
      "https://*.execute-api.us-east-1.amazonaws.com",
      "https://cognito-idp.us-east-1.amazonaws.com",
    ].join(" "),
    
    "media-src 'self'",

    "object-src 'none'",

    "frame-src 'none'",

    "worker-src 'self' blob:",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,

          "Content-Security-Policy": [
            csp,
          ],
        },
      });
    }
  );

  /* ==========================================================
     FRONTEND
     ========================================================== */

  const frontendPath = path.join(
    __dirname,
    "..",
    "dist",
    "index.html"
  );

  console.log(
    "📄 Frontend path:",
    frontendPath
  );

  if (!fs.existsSync(frontendPath)) {
    console.error(
      "❌ No se encontró index.html en:",
      frontendPath
    );

    console.error(
      "   Asegúrate de ejecutar: npm run build"
    );

    return;
  }

  mainWindow
    .loadFile(frontendPath)
    .catch((error) => {
      console.error(
        "❌ Error cargando frontend:",
        error.message
      );
    });

  mainWindow.once(
    "ready-to-show",
    () => {
      mainWindow.show();
    }
  );

  /* ==========================================================
     DEVTOOLS
     ========================================================== */

  if (!app.isPackaged) {
    try {
      mainWindow.webContents.openDevTools({
        mode: "detach",
      });
    } catch (error) {
      // No hacer nada.
    }
  }

  /* ==========================================================
     CIERRE DE VENTANA
     ========================================================== */

  mainWindow.on(
    "closed",
    () => {
      mainWindow = null;
    }
  );

  /* ==========================================================
     ERROR DE CARGA
     ========================================================== */

  mainWindow.webContents.on(
    "did-fail-load",
    (
      _event,
      errorCode,
      errorDescription
    ) => {
      console.error(
        "❌ Fallo al cargar frontend:",
        errorCode,
        errorDescription
      );
    }
  );
}

/* ============================================================
   SINGLE INSTANCE
   ============================================================ */

const gotSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.log(
    "⚠️ Otra instancia de EmotionLab ya está corriendo. Saliendo."
  );

  stopBackend();

  app.quit();
} else {
  app.on(
    "second-instance",
    () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }

        mainWindow.focus();
      }
    }
  );

  /* ==========================================================
     ELECTRON READY
     ========================================================== */

  app.whenReady().then(async () => {
    /*
     * Primero iniciamos el backend.
     */
    startBackend();

    /*
     * Después cargamos React/Electron.
     */
    await createWindow();

    /*
     * En producción comprobamos si existe
     * una nueva versión.
     *
     * Esperamos unos segundos para que la aplicación
     * termine de iniciar correctamente.
     */
    if (app.isPackaged) {
      setTimeout(() => {
        checkForUpdates();
      }, 3000);
    }

    app.on(
      "activate",
      () => {
        if (
          BrowserWindow.getAllWindows()
            .length === 0
        ) {
          createWindow();
        }
      }
    );
  });
}

/* ============================================================
   CIERRE DE ELECTRON
   ============================================================ */

app.on(
  "window-all-closed",
  () => {
    stopBackend();

    if (process.platform !== "darwin") {
      app.quit();
    }
  }
);

app.on(
  "before-quit",
  () => {
    if (backendProcess) {
      stopBackend();
    }
  }
);

app.on(
  "will-quit",
  () => {
    if (backendProcess) {
      stopBackend();
    }
  }
);

/* ============================================================
   PROCESOS
   ============================================================ */

process.on(
  "exit",
  () => {
    if (backendProcess) {
      stopBackend();
    }
  }
);

process.on(
  "SIGINT",
  () => {
    stopBackend();
    process.exit(0);
  }
);

process.on(
  "SIGTERM",
  () => {
    stopBackend();
    process.exit(0);
  }
);

/* ============================================================
   ERRORES NO CONTROLADOS
   ============================================================ */

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "💥 Uncaught Exception:",
      error
    );

    stopBackend();
  }
);