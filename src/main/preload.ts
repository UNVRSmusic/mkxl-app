import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // MIDI API
  midi: {
    getDevices: () => ipcRenderer.invoke("midi:getDevices"),
    connectDevice: (inputId: number, outputId: number) =>
      ipcRenderer.invoke("midi:connectDevice", inputId, outputId),
    disconnectDevice: () => ipcRenderer.invoke("midi:disconnectDevice"),
    sendProgramChange: (program: number) =>
      ipcRenderer.invoke("midi:sendProgramChange", program),
    requestPatchDump: (program: number) =>
      ipcRenderer.invoke("midi:requestPatchDump", program),
    sendPatch: (patchData: Uint8Array) =>
      ipcRenderer.invoke("midi:sendPatch", patchData),
    sendParameterChange: (parameterId: number, value: number) =>
      ipcRenderer.invoke("midi:sendParameterChange", parameterId, value),
    onPatchReceived: (callback: (patchData: any) => void) =>
      ipcRenderer.on("midi:patchReceived", (_, data) => callback(data)),
    onDeviceConnected: (callback: (deviceInfo: any) => void) =>
      ipcRenderer.on("midi:deviceConnected", (_, info) => callback(info)),
    onDeviceDisconnected: (callback: () => void) =>
      ipcRenderer.on("midi:deviceDisconnected", () => callback()),
  },

  // Database API
  db: {
    getAllPatches: () => ipcRenderer.invoke("db:getAllPatches"),
    getPatchById: (id: number) => ipcRenderer.invoke("db:getPatchById", id),
    savePatch: (patch: any) => ipcRenderer.invoke("db:savePatch", patch),
    deletePatch: (id: number) => ipcRenderer.invoke("db:deletePatch", id),
    searchPatches: (query: string) =>
      ipcRenderer.invoke("db:searchPatches", query),
    getPatchesByTag: (tag: string) =>
      ipcRenderer.invoke("db:getPatchesByTag", tag),
    addTag: (patchId: number, tag: string) =>
      ipcRenderer.invoke("db:addTag", patchId, tag),
    removeTag: (patchId: number, tag: string) =>
      ipcRenderer.invoke("db:removeTag", patchId, tag),
  },
});
