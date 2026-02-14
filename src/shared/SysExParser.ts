import { MicroKorgPatch, PatchParameters } from "../shared/types";

/**
 * Utility class for parsing and encoding microKORG SysEx data
 *
 * microKORG SysEx format:
 * F0 42 3g 58 40 dd...dd F7
 * - F0: SysEx start
 * - 42: Korg manufacturer ID
 * - 3g: 30 + MIDI channel (g = 0-F)
 * - 58: microKORG model ID
 * - 40: Program Dump command
 * - dd: Data bytes (264 bytes for full patch)
 * - F7: SysEx end
 */
export class SysExParser {
  /**
   * Parse SysEx data into a MicroKorgPatch object
   */
  static parseSysEx(sysex: Uint8Array): Partial<MicroKorgPatch> {
    // Validate basic structure
    if (sysex[0] !== 0xf0 || sysex[sysex.length - 1] !== 0xf7) {
      throw new Error("Invalid SysEx message: missing start/end bytes");
    }

    if (sysex[1] !== 0x42 || sysex[3] !== 0x58) {
      throw new Error("Invalid SysEx message: not a microKORG message");
    }

    // Extract data portion (skip header and footer)
    const data = sysex.slice(5, -1);

    // Parse patch name (first 12 bytes, ASCII)
    let name = "";
    for (let i = 0; i < 12; i++) {
      const char = data[i];
      if (char >= 32 && char <= 126) {
        name += String.fromCharCode(char);
      }
    }
    name = name.trim() || "Untitled";

    // Parse parameters (simplified - actual microKORG has complex bit-packing)
    const parameters: PatchParameters = {
      osc1: {
        waveform: data[12],
        octave: data[13],
        pitch: data[14],
        control1: data[15],
        control2: data[16],
      },
      osc2: {
        waveform: data[17],
        octave: data[18],
        pitch: data[19],
        control1: data[20],
        control2: data[21],
        modSelect: data[22],
      },
      mixer: {
        osc1Level: data[23],
        osc2Level: data[24],
        noiseLevel: data[25],
      },
      filter: {
        type: data[26],
        cutoff: data[27],
        resonance: data[28],
        egIntensity: data[29] - 64, // Convert to signed
        keyboardTrack: data[30],
      },
      filterEG: {
        attack: data[31],
        decay: data[32],
        sustain: data[33],
        release: data[34],
      },
      amp: {
        level: data[35],
        panpot: data[36],
        keyboardTrack: data[37],
      },
      ampEG: {
        attack: data[38],
        decay: data[39],
        sustain: data[40],
        release: data[41],
      },
      lfo: {
        waveform: data[42],
        keySync: data[43] > 0,
        frequency: data[44],
        tempoSync: data[45] > 0,
      },
      patch: {
        volume: data[46],
        transpose: data[47] - 24,
        detune: data[48] - 50,
        portamento: data[49],
        assignMode: data[50],
      },
      effects: {
        type1: data[51],
        type2: data[52],
        type3: data[53],
        modFxDepth: data[54],
        delayTime: data[55],
        delayDepth: data[56],
        eqLowGain: data[57] - 12,
        eqHighGain: data[58] - 12,
      },
      arpeggiator: {
        on: data[59] > 0,
        pattern: data[60],
        octaveRange: data[61],
        gate: data[62],
      },
    };

    return {
      name,
      parameters,
      sysexData: sysex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Encode a MicroKorgPatch object into SysEx data
   */
  static encodeSysEx(patch: MicroKorgPatch, channel: number = 0): Uint8Array {
    // If we already have sysex data, use it (with potential updates)
    if (patch.sysexData) {
      return patch.sysexData;
    }

    // Create new SysEx message from parameters
    const data = new Uint8Array(264);

    // Patch name (12 bytes, padded with spaces)
    const nameBytes = patch.name.substring(0, 12).padEnd(12, " ");
    for (let i = 0; i < 12; i++) {
      data[i] = nameBytes.charCodeAt(i);
    }

    const p = patch.parameters;

    // Oscillators
    data[12] = p.osc1.waveform;
    data[13] = p.osc1.octave;
    data[14] = p.osc1.pitch;
    data[15] = p.osc1.control1;
    data[16] = p.osc1.control2;

    data[17] = p.osc2.waveform;
    data[18] = p.osc2.octave;
    data[19] = p.osc2.pitch;
    data[20] = p.osc2.control1;
    data[21] = p.osc2.control2;
    data[22] = p.osc2.modSelect;

    // Mixer
    data[23] = p.mixer.osc1Level;
    data[24] = p.mixer.osc2Level;
    data[25] = p.mixer.noiseLevel;

    // Filter
    data[26] = p.filter.type;
    data[27] = p.filter.cutoff;
    data[28] = p.filter.resonance;
    data[29] = p.filter.egIntensity + 64; // Convert to unsigned
    data[30] = p.filter.keyboardTrack;

    // Filter EG
    data[31] = p.filterEG.attack;
    data[32] = p.filterEG.decay;
    data[33] = p.filterEG.sustain;
    data[34] = p.filterEG.release;

    // Amp
    data[35] = p.amp.level;
    data[36] = p.amp.panpot;
    data[37] = p.amp.keyboardTrack;

    // Amp EG
    data[38] = p.ampEG.attack;
    data[39] = p.ampEG.decay;
    data[40] = p.ampEG.sustain;
    data[41] = p.ampEG.release;

    // LFO
    data[42] = p.lfo.waveform;
    data[43] = p.lfo.keySync ? 1 : 0;
    data[44] = p.lfo.frequency;
    data[45] = p.lfo.tempoSync ? 1 : 0;

    // Patch
    data[46] = p.patch.volume;
    data[47] = p.patch.transpose + 24;
    data[48] = p.patch.detune + 50;
    data[49] = p.patch.portamento;
    data[50] = p.patch.assignMode;

    // Effects
    data[51] = p.effects.type1;
    data[52] = p.effects.type2;
    data[53] = p.effects.type3;
    data[54] = p.effects.modFxDepth;
    data[55] = p.effects.delayTime;
    data[56] = p.effects.delayDepth;
    data[57] = p.effects.eqLowGain + 12;
    data[58] = p.effects.eqHighGain + 12;

    // Arpeggiator
    data[59] = p.arpeggiator.on ? 1 : 0;
    data[60] = p.arpeggiator.pattern;
    data[61] = p.arpeggiator.octaveRange;
    data[62] = p.arpeggiator.gate;

    // Wrap in SysEx envelope
    const sysex = new Uint8Array(264 + 6);
    sysex[0] = 0xf0; // SysEx start
    sysex[1] = 0x42; // Korg ID
    sysex[2] = 0x30 + channel; // Channel
    sysex[3] = 0x58; // microKORG ID
    sysex[4] = 0x40; // Program Dump command
    sysex.set(data, 5);
    sysex[sysex.length - 1] = 0xf7; // SysEx end

    return sysex;
  }

  /**
   * Create a default/init patch
   */
  static createDefaultPatch(): MicroKorgPatch {
    return {
      name: "Init Patch",
      parameters: {
        osc1: { waveform: 0, octave: 1, pitch: 0, control1: 0, control2: 0 },
        osc2: {
          waveform: 0,
          octave: 1,
          pitch: 0,
          control1: 0,
          control2: 0,
          modSelect: 0,
        },
        mixer: { osc1Level: 127, osc2Level: 127, noiseLevel: 0 },
        filter: {
          type: 0,
          cutoff: 127,
          resonance: 0,
          egIntensity: 0,
          keyboardTrack: 64,
        },
        filterEG: { attack: 0, decay: 64, sustain: 127, release: 64 },
        amp: { level: 100, panpot: 64, keyboardTrack: 64 },
        ampEG: { attack: 0, decay: 64, sustain: 127, release: 64 },
        lfo: { waveform: 0, keySync: false, frequency: 64, tempoSync: false },
        patch: {
          volume: 100,
          transpose: 0,
          detune: 0,
          portamento: 0,
          assignMode: 0,
        },
        effects: {
          type1: 0,
          type2: 0,
          type3: 0,
          modFxDepth: 0,
          delayTime: 0,
          delayDepth: 0,
          eqLowGain: 0,
          eqHighGain: 0,
        },
        arpeggiator: { on: false, pattern: 0, octaveRange: 0, gate: 64 },
      },
      sysexData: new Uint8Array(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
