import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { MIDIManager } from "../midi/MIDIManager";
import { DatabaseManager } from "../db/DatabaseManager";

let mainWindow: BrowserWindow | null = null;
let midiManager: MIDIManager | null = null;
let dbManager: DatabaseManager | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1a1a1a",
  });

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize managers
async function initializeApp() {
  try {
    // Initialize database
    const userDataPath = app.getPath("userData");
    dbManager = new DatabaseManager(path.join(userDataPath, "patches.db"));
    await dbManager.initialize();

    // Initialize MIDI
    midiManager = new MIDIManager();

    // Setup MIDI message forwarding to renderer
    midiManager.on("patchReceived", (patchData: Uint8Array) => {
      mainWindow?.webContents.send("midi:patchReceived", patchData);
    });

    midiManager.on("deviceConnected", (deviceInfo: any) => {
      mainWindow?.webContents.send("midi:deviceConnected", deviceInfo);
    });

    midiManager.on("deviceDisconnected", () => {
      mainWindow?.webContents.send("midi:deviceDisconnected");
    });

    console.log("App initialized successfully");
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

// App lifecycle
app.whenReady().then(async () => {
  await initializeApp();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  midiManager?.cleanup();
  dbManager?.close();
});

// IPC Handlers - MIDI
ipcMain.handle("midi:getDevices", async () => {
  return midiManager?.getDevices() || { inputs: [], outputs: [] };
});

ipcMain.handle(
  "midi:connectDevice",
  async (_, inputId: number, outputId: number) => {
    return midiManager?.connectDevice(inputId, outputId);
  },
);

ipcMain.handle("midi:disconnectDevice", async () => {
  midiManager?.disconnectDevice();
});

ipcMain.handle("midi:sendProgramChange", async (_, program: number) => {
  midiManager?.sendProgramChange(program);
});

ipcMain.handle("midi:requestPatchDump", async (_, program: number) => {
  return midiManager?.requestPatchDump(program);
});

ipcMain.handle("midi:sendPatch", async (_, patchData: Uint8Array) => {
  midiManager?.sendPatch(patchData);
});

ipcMain.handle(
  "midi:sendParameterChange",
  async (_, parameterId: number, value: number) => {
    midiManager?.sendParameterChange(parameterId, value);
  },
);

// IPC Handlers - Database
ipcMain.handle("db:getAllPatches", async () => {
  return dbManager?.getAllPatches() || [];
});

ipcMain.handle("db:getPatchById", async (_, id: number) => {
  return dbManager?.getPatchById(id);
});

ipcMain.handle("db:savePatch", async (_, patch: any) => {
  return dbManager?.savePatch(patch);
});

ipcMain.handle("db:deletePatch", async (_, id: number) => {
  return dbManager?.deletePatch(id);
});

ipcMain.handle("db:searchPatches", async (_, query: string) => {
  return dbManager?.searchPatches(query);
});

ipcMain.handle("db:getPatchesByTag", async (_, tag: string) => {
  return dbManager?.getPatchesByTag(tag);
});

ipcMain.handle("db:addTag", async (_, patchId: number, tag: string) => {
  return dbManager?.addTag(patchId, tag);
});

ipcMain.handle("db:removeTag", async (_, patchId: number, tag: string) => {
  return dbManager?.removeTag(patchId, tag);
});
