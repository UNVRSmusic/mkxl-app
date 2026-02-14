"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIDIManager = void 0;
const easymidi_1 = __importDefault(require("easymidi"));
const events_1 = require("events");
class MIDIManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.input = null;
        this.output = null;
        this.connectedInputId = null;
        this.connectedOutputId = null;
        // microKORG MIDI constants
        this.KORG_MANUFACTURER_ID = 0x42;
        this.MICROKORG_MODEL_ID = 0x58;
        this.SYSEX_START = 0xf0;
        this.SYSEX_END = 0xf7;
        this.DEFAULT_CHANNEL = 0; // MIDI channel 1 (0-indexed)
    }
    /**
     * Get all available MIDI input and output devices
     */
    getDevices() {
        const inputs = [];
        const outputs = [];
        const inputNames = easymidi_1.default.getInputs();
        inputNames.forEach((name, i) => {
            inputs.push({ id: i, name });
        });
        const outputNames = easymidi_1.default.getOutputs();
        outputNames.forEach((name, i) => {
            outputs.push({ id: i, name });
        });
        return { inputs, outputs };
    }
    /**
     * Connect to MIDI input and output devices
     */
    connectDevice(inputId, outputId) {
        try {
            // Disconnect existing connections
            this.disconnectDevice();
            const devices = this.getDevices();
            const inputDevice = devices.inputs.find((d) => d.id === inputId);
            const outputDevice = devices.outputs.find((d) => d.id === outputId);
            if (!inputDevice || !outputDevice) {
                throw new Error("Invalid MIDI device ID");
            }
            // Open new connections
            this.input = new easymidi_1.default.Input(inputDevice.name);
            this.output = new easymidi_1.default.Output(outputDevice.name);
            // Setup MIDI input listener
            this.input.on("sysex", (msg) => {
                this.handleMIDIMessage(msg.bytes);
            });
            this.connectedInputId = inputId;
            this.connectedOutputId = outputId;
            this.emit("deviceConnected", {
                input: inputDevice,
                output: outputDevice,
            });
            console.log(`Connected to MIDI devices: IN=${inputDevice?.name}, OUT=${outputDevice?.name}`);
        }
        catch (error) {
            console.error("Failed to connect MIDI device:", error);
            throw error;
        }
    }
    /**
     * Disconnect from MIDI devices
     */
    disconnectDevice() {
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
    sendProgramChange(program) {
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
    requestPatchDump(program) {
        return new Promise((resolve, reject) => {
            if (!this.output) {
                reject(new Error("No MIDI output device connected"));
                return;
            }
            // Create SysEx message to request program dump (easymidi adds F0/F7)
            const sysexRequest = [
                this.KORG_MANUFACTURER_ID,
                0x30 + this.DEFAULT_CHANNEL,
                this.MICROKORG_MODEL_ID,
                0x10, // Program Dump Request command
                program,
            ];
            // Setup one-time listener for the response
            const timeout = setTimeout(() => {
                this.removeListener("patchReceived", handler);
                reject(new Error("Timeout waiting for patch dump"));
            }, 5000);
            const handler = (patchData) => {
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
    sendPatch(patchData) {
        if (!this.output) {
            throw new Error("No MIDI output device connected");
        }
        // Validate SysEx message and strip F0/F7 (easymidi adds them)
        if (patchData[0] !== this.SYSEX_START ||
            patchData[patchData.length - 1] !== this.SYSEX_END) {
            throw new Error("Invalid SysEx message format");
        }
        // Strip F0 and F7, easymidi adds them automatically
        const dataWithoutWrapper = Array.from(patchData.slice(1, -1));
        this.output.send("sysex", dataWithoutWrapper);
        console.log("Sent patch to microKORG");
    }
    /**
     * Send individual parameter change
     * @param parameterId microKORG parameter ID (0-127+)
     * @param value Parameter value (0-127)
     */
    sendParameterChange(parameterId, value) {
        if (!this.output) {
            throw new Error("No MIDI output device connected");
        }
        // microKORG uses SysEx for parameter changes (easymidi adds F0/F7)
        const sysexMessage = [
            this.KORG_MANUFACTURER_ID,
            0x30 + this.DEFAULT_CHANNEL,
            this.MICROKORG_MODEL_ID,
            0x41, // Parameter Change command
            parameterId,
            value,
        ];
        this.output.send("sysex", sysexMessage);
    }
    /**
     * Handle incoming MIDI messages
     */
    handleMIDIMessage(message) {
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
    handleSysExMessage(sysex) {
        // Verify it's from Korg microKORG
        if (sysex[1] !== this.KORG_MANUFACTURER_ID ||
            sysex[3] !== this.MICROKORG_MODEL_ID) {
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
                console.log(`Received unknown SysEx command: 0x${command.toString(16)}`);
        }
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.disconnectDevice();
    }
}
exports.MIDIManager = MIDIManager;
