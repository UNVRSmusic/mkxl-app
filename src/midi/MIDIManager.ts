import easymidi from "easymidi";
import { EventEmitter } from "events";
import { MIDIDevices, MIDIDevice } from "../shared/types";

export class MIDIManager extends EventEmitter {
  private input: easymidi.Input | null = null;
  private output: easymidi.Output | null = null;
  private connectedInputId: number | null = null;
  private connectedOutputId: number | null = null;

  // microKORG MIDI constants
  private readonly KORG_MANUFACTURER_ID = 0x42;
  private readonly MICROKORG_MODEL_ID = 0x58;
  private readonly SYSEX_START = 0xf0;
  private readonly SYSEX_END = 0xf7;
  private readonly DEFAULT_CHANNEL = 0; // MIDI channel 1 (0-indexed)

  constructor() {
    super();
  }

  /**
   * Get all available MIDI input and output devices
   */
  getDevices(): MIDIDevices {
    const inputs: MIDIDevice[] = [];
    const outputs: MIDIDevice[] = [];

    const inputNames = easymidi.getInputs();
    inputNames.forEach((name, i) => {
      inputs.push({ id: i, name });
    });

    const outputNames = easymidi.getOutputs();
    outputNames.forEach((name, i) => {
      outputs.push({ id: i, name });
    });

    return { inputs, outputs };
  }

  /**
   * Connect to MIDI input and output devices
   */
  connectDevice(inputId: number, outputId: number): void {
    console.log("inputId", inputId);

    try {
      // Disconnect existing connections
      this.disconnectDevice();

      const devices = this.getDevices();
      console.log("devices", devices);
      const inputDevice = devices.inputs.find((d) => d.id === inputId);
      const outputDevice = devices.outputs.find((d) => d.id === outputId);

      if (!inputDevice || !outputDevice) {
        throw new Error("Invalid MIDI device ID");
      }

      // Open new connections
      this.input = new easymidi.Input(inputDevice.name);
      console.log("this.input", this.input);
      this.output = new easymidi.Output(outputDevice.name);

      // Setup MIDI input listener
      this.input.on("sysex", (msg: any) => {
        this.handleMIDIMessage(msg.bytes);
      });

      this.connectedInputId = inputId;
      this.connectedOutputId = outputId;

      this.emit("deviceConnected", {
        input: inputDevice,
        output: outputDevice,
      });

      console.log(
        `Connected to MIDI devices: IN=${inputDevice?.name}, OUT=${outputDevice?.name}`,
      );
    } catch (error) {
      console.error("Failed to connect MIDI device:", error);
      throw error;
    }
  }

  /**
   * Disconnect from MIDI devices
   */
  disconnectDevice(): void {
    if (this.input) {
      this.input.close();
      this.input = null;
      this.connectedInputId = null;
    }

    if (this.output) {
      this.output.close();
      this.output = null;
      this.connectedOutputId = null;
    }

    this.emit("deviceDisconnected");
    console.log("Disconnected from MIDI devices");
  }

  /**
   * Send MIDI Program Change message
   */
  sendProgramChange(program: number): void {
    if (!this.output) {
      throw new Error("No MIDI output device connected");
    }

    this.output.send("program", {
      number: program,
      channel: this.DEFAULT_CHANNEL,
    });
    console.log(`Sent Program Change: ${program}`);
  }

  /**
   * Request a patch dump from microKORG
   */
  requestPatchDump(program: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (!this.output) {
        reject(new Error("No MIDI output device connected"));
        return;
      }

      // Create complete SysEx message (easymidi requires F0 and F7)
      const sysexRequest = [
        this.SYSEX_START, // 0xF0
        this.KORG_MANUFACTURER_ID,
        0x30 + this.DEFAULT_CHANNEL,
        this.MICROKORG_MODEL_ID,
        0x10, // Program Dump Request command
        program,
        this.SYSEX_END, // 0xF7
      ];

      // Setup one-time listener for the response
      const timeout = setTimeout(() => {
        this.removeListener("patchReceived", handler);
        reject(new Error("Timeout waiting for patch dump"));
      }, 5000);

      const handler = (patchData: Uint8Array) => {
        clearTimeout(timeout);
        resolve(patchData);
      };

      this.once("patchReceived", handler);

      // Send the request
      this.output.send("sysex", sysexRequest);
      console.log(`Requested patch dump for program ${program}`);
    });
  }

  /**
   * Send a complete patch to microKORG
   */
  sendPatch(patchData: Uint8Array): void {
    if (!this.output) {
      throw new Error("No MIDI output device connected");
    }

    // Validate SysEx message (easymidi requires complete message with F0/F7)
    if (
      patchData[0] !== this.SYSEX_START ||
      patchData[patchData.length - 1] !== this.SYSEX_END
    ) {
      throw new Error("Invalid SysEx message format");
    }

    // Send complete SysEx message
    this.output.send("sysex", Array.from(patchData));
    console.log("Sent patch to microKORG");
  }

  /**
   * Send individual parameter change
   * @param parameterId microKORG parameter ID (0-127+)
   * @param value Parameter value (0-127)
   */
  sendParameterChange(parameterId: number, value: number): void {
    if (!this.output) {
      throw new Error("No MIDI output device connected");
    }

    // microKORG uses SysEx for parameter changes (complete message with F0/F7)
    const sysexMessage = [
      this.SYSEX_START, // 0xF0
      this.KORG_MANUFACTURER_ID,
      0x30 + this.DEFAULT_CHANNEL,
      this.MICROKORG_MODEL_ID,
      0x41, // Parameter Change command
      parameterId,
      value,
      this.SYSEX_END, // 0xF7
    ];

    this.output.send("sysex", sysexMessage);
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage(message: number[]): void {
    // easymidi's sysex event provides data without F0/F7
    // Reconstruct full SysEx message
    const fullMessage = new Uint8Array([
      this.SYSEX_START,
      ...message,
      this.SYSEX_END,
    ]);
    this.handleSysExMessage(fullMessage);
  }

  /**
   * Parse and handle SysEx messages from microKORG
   */
  private handleSysExMessage(sysex: Uint8Array): void {
    // Verify it's from Korg microKORG
    if (
      sysex[1] !== this.KORG_MANUFACTURER_ID ||
      sysex[3] !== this.MICROKORG_MODEL_ID
    ) {
      return; // Not a microKORG message
    }

    const command = sysex[4];

    switch (command) {
      case 0x40: // Program Dump
        console.log("Received program dump from microKORG");
        this.emit("patchReceived", sysex);
        break;

      case 0x42: // Edit Buffer Dump
        console.log("Received edit buffer dump from microKORG");
        this.emit("editBufferReceived", sysex);
        break;

      default:
        console.log(
          `Received unknown SysEx command: 0x${command.toString(16)}`,
        );
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnectDevice();
  }
}
