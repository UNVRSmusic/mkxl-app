import { useStore } from "../store";
import { SysExParser } from "../../shared/SysExParser";
import ParameterControl from "./ParameterControl";

export default function PatchEditor() {
  const { currentPatch, updatePatchParameter, pushUndo, isConnected } =
    useStore();

  if (!currentPatch) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-xl mb-2">No patch selected</p>
          <p className="text-sm">
            Select a patch from the library or create a new one
          </p>
        </div>
      </div>
    );
  }

  const handleParameterChange = async (path: string, value: number) => {
    // Push current state to undo stack before making change
    pushUndo();

    // Update parameter in store
    updatePatchParameter(path, value);

    // Send parameter change to microKORG if connected
    if (isConnected) {
      // This is simplified - would need to map path to microKORG parameter ID
      // For now, we'll send the full patch after a delay
      // TODO: Implement proper parameter mapping
    }
  };

  const handleSendToHardware = async () => {
    if (!isConnected) {
      alert("Please connect to microKORG first");
      return;
    }

    try {
      const sysex = SysExParser.encodeSysEx(currentPatch);
      await window.electronAPI.midi.sendPatch(sysex);
      alert("Patch sent to microKORG!");
    } catch (error) {
      console.error("Failed to send patch:", error);
      alert("Failed to send patch to microKORG");
    }
  };

  const p = currentPatch.parameters;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{currentPatch.name}</h2>
          {currentPatch.category && (
            <p className="text-gray-500 mt-1">{currentPatch.category}</p>
          )}
        </div>

        <button
          onClick={handleSendToHardware}
          disabled={!isConnected}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send to microKORG
        </button>
      </div>

      {/* Oscillators */}
      <div className="grid grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="panel-header">Oscillator 1</h3>
          <div className="grid grid-cols-3 gap-4">
            <ParameterControl
              label="Waveform"
              value={p.osc1.waveform}
              min={0}
              max={63}
              onChange={(v) => handleParameterChange("osc1.waveform", v)}
            />
            <ParameterControl
              label="Octave"
              value={p.osc1.octave}
              min={0}
              max={2}
              onChange={(v) => handleParameterChange("osc1.octave", v)}
              displayValue={(v) => ["16'", "8'", "4'"][v]}
            />
            <ParameterControl
              label="Pitch"
              value={p.osc1.pitch}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc1.pitch", v)}
            />
            <ParameterControl
              label="Control 1"
              value={p.osc1.control1}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc1.control1", v)}
            />
            <ParameterControl
              label="Control 2"
              value={p.osc1.control2}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc1.control2", v)}
            />
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-header">Oscillator 2</h3>
          <div className="grid grid-cols-3 gap-4">
            <ParameterControl
              label="Waveform"
              value={p.osc2.waveform}
              min={0}
              max={63}
              onChange={(v) => handleParameterChange("osc2.waveform", v)}
            />
            <ParameterControl
              label="Octave"
              value={p.osc2.octave}
              min={0}
              max={2}
              onChange={(v) => handleParameterChange("osc2.octave", v)}
              displayValue={(v) => ["16'", "8'", "4'"][v]}
            />
            <ParameterControl
              label="Pitch"
              value={p.osc2.pitch}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc2.pitch", v)}
            />
            <ParameterControl
              label="Control 1"
              value={p.osc2.control1}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc2.control1", v)}
            />
            <ParameterControl
              label="Control 2"
              value={p.osc2.control2}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("osc2.control2", v)}
            />
            <ParameterControl
              label="Mod Select"
              value={p.osc2.modSelect}
              min={0}
              max={2}
              onChange={(v) => handleParameterChange("osc2.modSelect", v)}
              displayValue={(v) => ["Off", "Ring", "Sync"][v]}
            />
          </div>
        </div>
      </div>

      {/* Mixer */}
      <div className="panel">
        <h3 className="panel-header">Mixer</h3>
        <div className="grid grid-cols-3 gap-4">
          <ParameterControl
            label="OSC 1 Level"
            value={p.mixer.osc1Level}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("mixer.osc1Level", v)}
          />
          <ParameterControl
            label="OSC 2 Level"
            value={p.mixer.osc2Level}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("mixer.osc2Level", v)}
          />
          <ParameterControl
            label="Noise Level"
            value={p.mixer.noiseLevel}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("mixer.noiseLevel", v)}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="panel">
        <h3 className="panel-header">Filter</h3>
        <div className="grid grid-cols-4 gap-4">
          <ParameterControl
            label="Type"
            value={p.filter.type}
            min={0}
            max={2}
            onChange={(v) => handleParameterChange("filter.type", v)}
            displayValue={(v) => ["LPF", "HPF", "BPF"][v]}
          />
          <ParameterControl
            label="Cutoff"
            value={p.filter.cutoff}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("filter.cutoff", v)}
          />
          <ParameterControl
            label="Resonance"
            value={p.filter.resonance}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("filter.resonance", v)}
          />
          <ParameterControl
            label="EG Intensity"
            value={p.filter.egIntensity + 64}
            min={0}
            max={127}
            onChange={(v) =>
              handleParameterChange("filter.egIntensity", v - 64)
            }
            displayValue={(v) => (v - 64).toString()}
          />
          <ParameterControl
            label="Keyboard Track"
            value={p.filter.keyboardTrack}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("filter.keyboardTrack", v)}
          />
        </div>
      </div>

      {/* Envelopes */}
      <div className="grid grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="panel-header">Filter EG</h3>
          <div className="grid grid-cols-4 gap-4">
            <ParameterControl
              label="Attack"
              value={p.filterEG.attack}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("filterEG.attack", v)}
            />
            <ParameterControl
              label="Decay"
              value={p.filterEG.decay}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("filterEG.decay", v)}
            />
            <ParameterControl
              label="Sustain"
              value={p.filterEG.sustain}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("filterEG.sustain", v)}
            />
            <ParameterControl
              label="Release"
              value={p.filterEG.release}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("filterEG.release", v)}
            />
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-header">Amp EG</h3>
          <div className="grid grid-cols-4 gap-4">
            <ParameterControl
              label="Attack"
              value={p.ampEG.attack}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("ampEG.attack", v)}
            />
            <ParameterControl
              label="Decay"
              value={p.ampEG.decay}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("ampEG.decay", v)}
            />
            <ParameterControl
              label="Sustain"
              value={p.ampEG.sustain}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("ampEG.sustain", v)}
            />
            <ParameterControl
              label="Release"
              value={p.ampEG.release}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("ampEG.release", v)}
            />
          </div>
        </div>
      </div>

      {/* LFO & Amp */}
      <div className="grid grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="panel-header">LFO</h3>
          <div className="grid grid-cols-2 gap-4">
            <ParameterControl
              label="Waveform"
              value={p.lfo.waveform}
              min={0}
              max={5}
              onChange={(v) => handleParameterChange("lfo.waveform", v)}
            />
            <ParameterControl
              label="Frequency"
              value={p.lfo.frequency}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("lfo.frequency", v)}
            />
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-header">Amplifier</h3>
          <div className="grid grid-cols-2 gap-4">
            <ParameterControl
              label="Level"
              value={p.amp.level}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("amp.level", v)}
            />
            <ParameterControl
              label="Panpot"
              value={p.amp.panpot}
              min={0}
              max={127}
              onChange={(v) => handleParameterChange("amp.panpot", v)}
              displayValue={(v) =>
                v === 64 ? "C" : v < 64 ? `L${64 - v}` : `R${v - 64}`
              }
            />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div className="panel">
        <h3 className="panel-header">Effects</h3>
        <div className="grid grid-cols-4 gap-4">
          <ParameterControl
            label="Mod FX Depth"
            value={p.effects.modFxDepth}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("effects.modFxDepth", v)}
          />
          <ParameterControl
            label="Delay Time"
            value={p.effects.delayTime}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("effects.delayTime", v)}
          />
          <ParameterControl
            label="Delay Depth"
            value={p.effects.delayDepth}
            min={0}
            max={127}
            onChange={(v) => handleParameterChange("effects.delayDepth", v)}
          />
        </div>
      </div>
    </div>
  );
}
