import { useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PatchEditor from "./components/PatchEditor";
import Visualizer from "./components/Visualizer";
import { useStore } from "./store";
import { SysExParser } from "../shared/SysExParser";

function App() {
  const {
    setMidiDevices,
    setLibraryPatches,
    setCurrentPatch,
    setConnectedDevices,
  } = useStore();

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Setup MIDI event listeners
    window.electronAPI.midi.onPatchReceived((sysexData) => {
      const patch = SysExParser.parseSysEx(new Uint8Array(sysexData));
      setCurrentPatch(patch as any);
    });

    window.electronAPI.midi.onDeviceConnected((deviceInfo) => {
      setConnectedDevices(deviceInfo.input, deviceInfo.output);
    });

    window.electronAPI.midi.onDeviceDisconnected(() => {
      setConnectedDevices(null, null);
    });
  }, []);

  const initializeApp = async () => {
    try {
      // Load MIDI devices
      const devices = await window.electronAPI.midi.getDevices();
      setMidiDevices(devices);

      // Load patches from database
      const patches = await window.electronAPI.db.getAllPatches();
      setLibraryPatches(patches);

      // Load default patch
      const defaultPatch = SysExParser.createDefaultPatch();
      setCurrentPatch(defaultPatch);
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-auto p-6">
          <PatchEditor />
        </main>

        <aside className="w-80 border-l border-gray-700 overflow-auto">
          <Visualizer />
        </aside>
      </div>
    </div>
  );
}

export default App;
