import { useState, useEffect } from "react";
import { useStore } from "../store";

export default function Header() {
  const { midiDevices, connectedInput, connectedOutput, isConnected } =
    useStore();
  const [selectedInputId, setSelectedInputId] = useState<number | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<number | null>(null);

  const handleConnect = async () => {
    if (selectedInputId !== null && selectedOutputId !== null) {
      try {
        await window.electronAPI.midi.connectDevice(
          selectedInputId,
          selectedOutputId,
        );
      } catch (error) {
        console.error("Failed to connect:", error);
        alert("Failed to connect to MIDI device");
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.midi.disconnectDevice();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  useEffect(() => {
    const loadDevices = async () => {
      const devices = await window.electronAPI.midi.getDevices();
      useStore.getState().setMidiDevices(devices);
    };
    loadDevices();
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary-400">
            microKORG Enhanced Editor
          </h1>

          <div className="flex items-center gap-2 ml-8">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isConnected ? (
            <>
              <select
                value={selectedInputId ?? ""}
                onChange={(e) => setSelectedInputId(Number(e.target.value))}
                className="text-sm"
              >
                <option value="">Select MIDI Input...</option>
                {midiDevices.inputs.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedOutputId ?? ""}
                onChange={(e) => setSelectedOutputId(Number(e.target.value))}
                className="text-sm"
              >
                <option value="">Select MIDI Output...</option>
                {midiDevices.outputs.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleConnect}
                disabled={selectedInputId === null || selectedOutputId === null}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-300">
                <div>In: {connectedInput?.name}</div>
                <div>Out: {connectedOutput?.name}</div>
              </div>
              <button
                onClick={handleDisconnect}
                className="btn-secondary text-sm"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
