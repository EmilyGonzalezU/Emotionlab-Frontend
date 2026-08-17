const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow = null;
let backendProcess = null;
let backendStarted = false;

function getBackendPath() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "backend",
      "EmotionLabBackend.exe"
    );
  } else {
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
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  try {
    console.log("🛑 Deteniendo backend...");

    const pid = backendProcess.pid;

    if (process.platform === "win32") {
      try {
        spawn("taskkill", ["/pid", String(pid), "/f", "/t"], {
          windowsHide: true,
          stdio: "ignore",
        });
      } catch (e) {
        console.error("Error ejecutando taskkill:", e.message);
      }
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch (e) {
        try {
          backendProcess.kill("SIGTERM");
        } catch (e2) {
          console.error("Error SIGTERM:", e2.message);
        }
      }
    }

    backendProcess = null;
    backendStarted = false;
    console.log("✅ Backend detenido");
  } catch (error) {
    console.error("❌ Error deteniendo backend:", error.message);
    backendProcess = null;
    backendStarted = false;
  }
}

function startBackend() {
  if (backendStarted || backendProcess) {
    console.log("ℹ️ Backend ya está iniciado, omitiendo.");
    return;
  }

  try {
    let backendPath = getBackendPath();

    console.log("=================================");
    console.log("EmotionLab - Inicio del backend");
    console.log("=================================");
    console.log("Modo:", app.isPackaged ? "PRODUCCIÓN" : "DESARROLLO");
    console.log("app.isPackaged:", app.isPackaged);
    console.log("process.resourcesPath:", process.resourcesPath);
    console.log("__dirname:", __dirname);
    console.log("BackendPath candidato:", backendPath);

    if (!fs.existsSync(backendPath)) {
      console.error("❌ NO SE ENCONTRÓ EL BACKEND EN:", backendPath);

      const alternativo = path.join(
        process.resourcesPath,
        "backend",
        "dist",
        "EmotionLabBackend",
        "EmotionLabBackend.exe"
      );
      if (app.isPackaged && fs.existsSync(alternativo)) {
        console.log("ℹ️ Usando ruta alternativa del backend");
        backendPath = alternativo;
      } else {
        console.error("==================================================");
        console.error("Backend no encontrado. Verifica la estructura:");
        if (app.isPackaged) {
          console.error(
            "  resources/backend/EmotionLabBackend.exe"
          );
        } else {
          console.error(
            "  packaging/backend/dist/EmotionLabBackend/EmotionLabBackend.exe"
          );
          console.error("  O bien:");
          console.error(
            "  ../Emotionlab-Backend/dist/EmotionLabBackend/EmotionLabBackend.exe"
          );
        }
        console.error("==================================================");
        return;
      }
    }

    console.log("✅ Backend encontrado en:", backendPath);

    const backendDir = path.dirname(backendPath);
    console.log("📁 Working directory del backend:", backendDir);

    backendProcess = spawn(backendPath, [], {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
      windowsHide: true,
      cwd: backendDir,
    });

    backendStarted = true;

    backendProcess.stdout.on("data", (data) => {
      const str = data.toString().trim();
      if (str) {
        console.log(`[Backend] ${str}`);
      }
    });

    backendProcess.stderr.on("data", (data) => {
      const str = data.toString().trim();
      if (str) {
        console.error(`[Backend STDERR] ${str}`);
      }
    });

    backendProcess.on("error", (error) => {
      console.error("❌ Error iniciando backend:", error.message);
      backendStarted = false;
      backendProcess = null;
    });

    backendProcess.on("exit", (code, signal) => {
      console.log(
        `ℹ️ Backend finalizado. Código: ${code}, señal: ${signal}`
      );
      backendProcess = null;
      backendStarted = false;
    });

    backendProcess.on("close", (code, signal) => {
      console.log(
        `ℹ️ Backend cerrado completamente. Código: ${code}, señal: ${signal}`
      );
      backendProcess = null;
      backendStarted = false;
    });

    console.log("🚀 Proceso del backend iniciado (PID:", backendProcess.pid + ")");
  } catch (error) {
    console.error("❌ Error crítico iniciando el backend:", error.message);
    backendStarted = false;
    backendProcess = null;
  }
}

const BACKEND_HEALTH_URL = "http://127.0.0.1:5000/health";

async function waitForBackendReady(maxMs = 45000) {
  const start = Date.now();
  const intervalMs = 500;
  while (Date.now() - start < maxMs) {
    try {
      const resp = await fetch(BACKEND_HEALTH_URL, {
        method: "GET",
        timeout: 300,
      });
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data && data.status === "ok") {
          console.log("✅ Backend Flask listo (/health = ok)");
          return true;
        }
      }
    } catch (e) {
      // Aún no está listo — esperamos y reintentamos
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.error("⏱️ Timeout esperando backend Flask (>" + maxMs + "ms)");
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "EmotionLab",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:5000 http://127.0.0.1:5000 ws://localhost:5173 ws://127.0.0.1:5173",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
  ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });

  const frontendPath = path.join(__dirname, "..", "dist", "index.html");

  console.log("📄 Frontend path:", frontendPath);

  // Mostramos splash de "cargando" mientras el backend arranca
  mainWindow.loadURL("about:blank");
  mainWindow.webContents.executeJavaScript(
    `document.body.innerHTML = '<div style="font-family:Arial;padding:60px 40px;text-align:center;color:#17315E;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;"><div><h2 style="margin:0 0 12px 0;">EmotionLab</h2><p style="color:#475569;margin:0;">Iniciando servicios… por favor espera unos segundos.</p></div></div>';`
  );
  mainWindow.show();

  if (!fs.existsSync(frontendPath)) {
    console.error("❌ No se encontró index.html en:", frontendPath);
    console.error("   Asegúrate de ejecutar: npm run build");
    mainWindow.webContents.executeJavaScript(
      `document.body.innerHTML = '<div style="font-family:Arial;padding:40px;color:#b91c1c;"><h2>Error al cargar EmotionLab</h2><p>No se encontraron los archivos del frontend.</p><p style="color:#6b7280;">Asegúrate de ejecutar <code>npm run build</code> antes de iniciar Electron.</p></div>';`
    );
    return;
  }

  // Esperamos a que Flask responda antes de abrir el frontend, para evitar
  // "Failed to fetch" en el login inicial.
  console.log("⏳ Esperando backend Flask...");
  await waitForBackendReady(45000);

  mainWindow.loadFile(frontendPath).catch((err) => {
    console.error("❌ Error cargando frontend:", err.message);
  });

  if (!app.isPackaged) {
    try {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    } catch (e) {}
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

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
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.log("⚠️ Otra instancia de EmotionLab ya está corriendo. Saliendo.");
  stopBackend();
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", (e) => {
  if (backendProcess) {
    stopBackend();
  }
});

app.on("will-quit", (e) => {
  if (backendProcess) {
    stopBackend();
  }
});

process.on("exit", () => {
  if (backendProcess) {
    stopBackend();
  }
});

process.on("SIGINT", () => {
  stopBackend();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopBackend();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  stopBackend();
});
