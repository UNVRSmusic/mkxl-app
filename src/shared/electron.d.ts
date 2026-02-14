// Global type declarations for Electron API exposed via preload script

export interface ElectronAPI {
  midi: {
    getDevices: () => Promise<import("./types").MIDIDevices>;
    connectDevice: (inputId: number, outputId: number) => Promise<void>;
    disconnectDevice: () => Promise<void>;
    sendProgramChange: (program: number) => Promise<void>;
    requestPatchDump: (program: number) => Promise<any>;
    sendPatch: (patchData: Uint8Array) => Promise<void>;
    sendParameterChange: (parameterId: number, value: number) => Promise<void>;
    onPatchReceived: (callback: (patchData: any) => void) => void;
    onDeviceConnected: (callback: (deviceInfo: any) => void) => void;
    onDeviceDisconnected: (callback: () => void) => void;
  };

  db: {
    getAllPatches: () => Promise<import("./types").MicroKorgPatch[]>;
    getPatchById: (
      id: number,
    ) => Promise<import("./types").MicroKorgPatch | null>;
    savePatch: (patch: any) => Promise<number>;
    deletePatch: (id: number) => Promise<void>;
    searchPatches: (
      query: string,
    ) => Promise<import("./types").MicroKorgPatch[]>;
    getPatchesByTag: (
      tag: string,
    ) => Promise<import("./types").MicroKorgPatch[]>;
    addTag: (patchId: number, tag: string) => Promise<void>;
    removeTag: (patchId: number, tag: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
