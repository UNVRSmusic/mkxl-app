// Patch data structure
export interface MicroKorgPatch {
  id?: number;
  name: string;
  programNumber?: number;
  category?: string;
  tags?: string[];
  favorite?: boolean;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
  sysexData: Uint8Array;

  // Parsed parameters
  parameters: PatchParameters;
}

export interface PatchParameters {
  // Oscillator 1
  osc1: {
    waveform: number; // 0-63 (various waveforms)
    octave: number; // 0-2 (16', 8', 4')
    pitch: number; // 0-127 (detune)
    control1: number; // 0-127
    control2: number; // 0-127
  };

  // Oscillator 2
  osc2: {
    waveform: number;
    octave: number;
    pitch: number;
    control1: number;
    control2: number;
    modSelect: number; // 0-2 (Ring, Sync, Off)
  };

  // Mixer
  mixer: {
    osc1Level: number; // 0-127
    osc2Level: number; // 0-127
    noiseLevel: number; // 0-127
  };

  // Filter
  filter: {
    type: number; // 0-2 (LPF, HPF, BPF)
    cutoff: number; // 0-127
    resonance: number; // 0-127
    egIntensity: number; // -64 to +63
    keyboardTrack: number; // 0-127
  };

  // Filter EG
  filterEG: {
    attack: number; // 0-127
    decay: number; // 0-127
    sustain: number; // 0-127
    release: number; // 0-127
  };

  // Amp
  amp: {
    level: number; // 0-127
    panpot: number; // 0-127 (L64 - R63)
    keyboardTrack: number; // 0-127
  };

  // Amp EG
  ampEG: {
    attack: number; // 0-127
    decay: number; // 0-127
    sustain: number; // 0-127
    release: number; // 0-127
  };

  // LFO
  lfo: {
    waveform: number; // 0-5 (Saw, Square, Triangle, etc.)
    keySync: boolean;
    frequency: number; // 0-127
    tempoSync: boolean;
  };

  // Patch settings
  patch: {
    volume: number; // 0-127
    transpose: number; // -24 to +24
    detune: number; // -50 to +50
    portamento: number; // 0-127
    assignMode: number; // 0-3 (Poly, Mono, Unison, etc.)
  };

  // Effects
  effects: {
    type1: number; // Mod FX type
    type2: number; // Delay type
    type3: number; // EQ type
    modFxDepth: number; // 0-127
    delayTime: number; // 0-127
    delayDepth: number; // 0-127
    eqLowGain: number; // -12 to +12
    eqHighGain: number; // -12 to +12
  };

  // Arpeggiator
  arpeggiator: {
    on: boolean;
    pattern: number; // 0-5
    octaveRange: number; // 0-3 (1-4 octaves)
    gate: number; // 0-127
  };
}

// MIDI Device info
export interface MIDIDevice {
  id: number;
  name: string;
  manufacturer?: string;
  version?: string;
}

export interface MIDIDevices {
  inputs: MIDIDevice[];
  outputs: MIDIDevice[];
}

// Database types
export interface PatchTag {
  id: number;
  name: string;
  color?: string;
}

export interface PatchCategory {
  id: number;
  name: string;
  icon?: string;
}

// UI State
export interface EditorState {
  selectedPatchId: number | null;
  currentPatch: MicroKorgPatch | null;
  isConnected: boolean;
  connectedDevice: {
    input: MIDIDevice | null;
    output: MIDIDevice | null;
  };
  isDirty: boolean;
  undoStack: MicroKorgPatch[];
  redoStack: MicroKorgPatch[];
}

// SysEx message structure
export interface SysExMessage {
  status: number; // 0xF0
  manufacturer: number[]; // [0x42] for Korg
  channel: number;
  model: number; // 0x58 for microKORG
  command: number;
  data: Uint8Array;
  checksum?: number;
  eox: number; // 0xF7
}

// API types for cloud sharing
export interface CloudPatch extends Omit<MicroKorgPatch, "sysexData"> {
  userId: string;
  username: string;
  downloads: number;
  likes: number;
  comments?: Comment[];
  sysexDataBase64: string; // Base64 encoded sysex
}

export interface Comment {
  id: number;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}
