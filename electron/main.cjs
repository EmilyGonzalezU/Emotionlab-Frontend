const { app, BrowserWindow, session, ipcMain, protocol, net, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([{
  scheme: "emotionlab",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

const {
  configureUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateState,
} = require("./updater.cjs");

let mainWindow = null;

/**
 * Crea la ventana principal de EmotionLab.
 */
async function createWindow() {
  const frontendRoot = path.resolve(__dirname, "..", "dist");
  const frontendPath = path.join(frontendRoot, "index.html");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "EmotionLab",
    icon: path.join(__dirname, "../public/icon.ico"),
    autoHideMenuBar: true,
    show: false,
    backgroundColor: "#f8fafc",

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: true,
    },
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    try {
      const destination = new URL(url);
      if (destination.protocol !== "emotionlab:" || destination.hostname !== "bundle") {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const external = new URL(url);
      const isS3Host = /^(?:[a-z0-9.-]+\.)?s3(?:\.dualstack)?\.us-east-1\.amazonaws\.com$/i.test(external.hostname)
        || /^s3\.us-east-1\.amazonaws\.com$/i.test(external.hostname);
      const hasSignature = external.searchParams.has("X-Amz-Signature")
        || (external.searchParams.has("AWSAccessKeyId") && external.searchParams.has("Signature"));
      if (external.protocol === "https:" && isS3Host && hasSignature) {
        void shell.openExternal(external.toString()).catch((error) => {
          console.warn("No se pudo abrir el enlace de descarga:", error.message);
        });
      }
    } catch (error) {
      console.warn("Se rechazó una URL externa no válida:", error.message);
    }
    return { action: "deny" };
  });

  /**
   * Content Security Policy
   *
   * Producción:
   * React/Electron → API Gateway → Lambda → AWS
   *
   * Desarrollo:
   * se mantienen localhost y Vite para poder trabajar localmente.
   */
  const apiConfigPath = path.join(__dirname, "..", "dist", "api-config.json");
  let apiOrigin = "";
  if (fs.existsSync(apiConfigPath)) {
    apiOrigin = JSON.parse(fs.readFileSync(apiConfigPath, "utf8")).apiOrigin || "";
  } else if (app.isPackaged) {
    throw new Error("Falta dist/api-config.json. Compile con VITE_API_URL configurada.");
  }

  const apiSources = ["'self'", apiOrigin, ...(!app.isPackaged ? ["http://localhost:5000", "http://127.0.0.1:5000", "ws://localhost:5173", "ws://127.0.0.1:5173"] : [])].filter(Boolean).join(" ");
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${apiSources}`,
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
          "Content-Security-Policy": [csp],
        },
      });
    }
  );

  /**
   * Frontend compilado por Vite.
   */
  console.log("📄 Frontend path:", frontendPath);

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

  try {
    await mainWindow.loadURL("emotionlab://bundle/index.html");
  } catch (error) {
    console.error(
      "❌ Error cargando frontend:",
      error.message
    );
  }

  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  /**
   * DevTools solamente durante desarrollo.
   */
  if (!app.isPackaged) {
    try {
      mainWindow.webContents.openDevTools({
        mode: "detach",
      });
    } catch (error) {
      console.warn(
        "⚠️ No se pudieron abrir DevTools:",
        error.message
      );
    }
  }

  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      console.error(
        "❌ Fallo al cargar frontend:",
        errorCode,
        errorDescription
      );
    }
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  /**
   * Configuración del actualizador.
   *
   * Se activa únicamente en la aplicación empaquetada.
   */
  if (app.isPackaged) {
    configureUpdater(mainWindow);

    /**
     * Esperamos unos segundos para permitir que
     * Electron termine de inicializarse antes
     * de consultar GitHub Releases.
     */
    setTimeout(() => {
      checkForUpdates();
    }, 3000);
  }
}

/**
 * IPC — Actualizaciones
 *
 * React → preload.cjs → main.cjs → updater.cjs
 */

ipcMain.handle("update:check", async () => {
  await checkForUpdates();
  return getUpdateState();
});

ipcMain.handle("update:download", async () => {
  downloadUpdate();
  return getUpdateState();
});

ipcMain.handle("update:install", async () => {
  installUpdate();
  return getUpdateState();
});

ipcMain.handle("update:state", async () => {
  return getUpdateState();
});

/**
 * Evita abrir múltiples instancias de EmotionLab.
 */
const gotSingleInstanceLock =
  app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.log(
    "⚠️ Otra instancia de EmotionLab ya está corriendo. Saliendo."
  );

  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }

    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    console.log("=================================");
    console.log("EmotionLab - Electron");
    console.log("=================================");
    console.log(
      "Modo:",
      app.isPackaged ? "PRODUCCIÓN" : "DESARROLLO"
    );

    if (app.isPackaged) {
      console.log(
        "☁️ Backend: AWS API Gateway + Lambda"
      );
    } else {
      console.log(
        "💻 Desarrollo: frontend Electron"
      );
      console.log(
        "ℹ️ El backend local no es iniciado por Electron."
      );
    }

    protocol.handle("emotionlab", async (request) => {
      const requested = new URL(request.url);
      if (requested.hostname !== "bundle" || !["GET", "HEAD"].includes(request.method)) {
        return new Response("Not found", { status: 404 });
      }
      let pathname;
      try {
        pathname = decodeURIComponent(requested.pathname);
      } catch {
        return new Response("Bad request", { status: 400 });
      }
      const target = path.resolve(path.join(__dirname, "..", "dist"), `.${pathname}`);
      const relative = path.relative(path.join(__dirname, "..", "dist"), target);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new Response("Forbidden", { status: 403 });
      }
      try {
        return await net.fetch(pathToFileURL(target).toString());
      } catch {
        return new Response("Not found", { status: 404 });
      }
    });
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    await createWindow();

    app.on("activate", async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  });
}

/**
 * Cierre de ventanas.
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Limpieza final.
 */
app.on("before-quit", () => {
  console.log("👋 Cerrando EmotionLab...");
});

app.on("will-quit", () => {
  console.log("👋 EmotionLab finalizado.");
});

/**
 * Manejo de errores no controlados.
 */
process.on("uncaughtException", (error) => {
  console.error(
    "💥 Uncaught Exception:",
    error
  );
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "💥 Unhandled Rejection:",
    reason
  );
});
