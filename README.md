# microKORG Enhanced Sound Editor

A modern, feature-rich MIDI editor for the Korg microKORG synthesizer, built with Electron, React, and TypeScript. Designed specifically for M1 Mac with cross-platform support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Core Editing

- ✅ Full parameter editing for all microKORG parameters
- ✅ Real-time parameter updates via MIDI SysEx
- ✅ Bi-directional communication with hardware
- ✅ Program change and patch dump/restore
- ✅ Undo/redo support

### Enhanced Features

- 📚 **Patch Library Management**: SQLite-based local database for organizing patches
- 🏷️ **Tagging System**: Tag and categorize patches for easy discovery
- 🔍 **Smart Search**: Full-text search across patch names and tags
- ⭐ **Favorites & Ratings**: Mark favorite patches and rate them
- 📊 **Visual Feedback**: Real-time envelope and waveform visualization
- 🎨 **Modern UI**: Dark mode interface with Tailwind CSS

### Planned Features

- 🎲 Random patch generator with constraints
- 🧬 Patch mutation and evolution
- ☁️ Community patch sharing (Firebase/Supabase)
- 📈 Spectral analysis visualization
- 🎹 A/B patch comparison
- 📦 Bulk bank operations

## System Requirements

- macOS 11.0+ (optimized for M1/M2 Macs)
- Windows 10/11 (x64)
- Linux (x64, ARM64)
- Korg microKORG synthesizer
- MIDI interface (USB-MIDI or traditional MIDI)

## Installation

### From Source

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/microkorg-enhanced-editor.git
   cd microkorg-enhanced-editor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Build for production**

   ```bash
   # macOS (M1/M2)
   npm run electron:build

   # All platforms
   npm run electron:build:all
   ```

## Usage

### Connecting your microKORG

1. Connect your microKORG to your computer via USB-MIDI or MIDI interface
2. Launch the application
3. Select the MIDI input and output from the dropdown menus in the header
4. Click "Connect"

### Editing Patches

1. **Load from Hardware**: Click "Import from HW" to request the current patch from your microKORG
2. **Edit Parameters**: Use sliders and knobs to modify patch parameters
3. **Send to Hardware**: Click "Send to microKORG" to update the hardware with your changes
4. **Save to Library**: Click "Save Patch" to store the patch in your local library

### Managing Your Patch Library

- **Search**: Type in the search box to find patches by name or tags
- **Tags**: Add tags to patches for better organization (e.g., "bass", "lead", "pad")
- **Categories**: Organize patches into categories (e.g., "Synth", "Keys", "FX")
- **Favorites**: Star your favorite patches for quick access

## Development

### Project Structure

```
microkorg-editor/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App entry point
│   │   └── preload.ts     # IPC bridge
│   ├── renderer/          # React UI
│   │   ├── App.tsx        # Main app component
│   │   ├── store.ts       # Zustand state management
│   │   └── components/    # React components
│   ├── midi/              # MIDI communication
│   │   ├── MIDIManager.ts # MIDI device management
│   │   └── SysExParser.ts # SysEx encoding/decoding
│   ├── db/                # Database layer
│   │   └── DatabaseManager.ts
│   └── shared/            # Shared types
├── dist/                  # Build output
└── release/               # Distribution builds
```

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Electron 28, Node.js
- **MIDI**: node-midi (RtMidi bindings)
- **Database**: better-sqlite3
- **State**: Zustand
- **Build**: Vite, electron-builder

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run electron:build` - Create distributable (current platform)
- `npm run electron:build:all` - Build for all platforms
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## MIDI Implementation

The editor uses SysEx messages to communicate with the microKORG:

- **Manufacturer ID**: `0x42` (Korg)
- **Model ID**: `0x58` (microKORG)
- **Program Dump**: 264 bytes of patch data
- **Parameter Changes**: Individual parameter updates via SysEx

See [MIDI.md](docs/MIDI.md) for detailed MIDI implementation notes.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and type checking
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Known Issues

- [ ] Parameter changes may take 100-200ms to reflect on hardware due to SysEx throttling
- [ ] Some waveform parameters use bit-packing and require reverse engineering
- [ ] Community sharing feature not yet implemented

## Roadmap

### v1.0 (Current)

- [x] Basic patch editing
- [x] MIDI communication
- [x] Local patch library
- [x] Envelope visualization

### v1.1 (Next)

- [ ] Patch randomizer
- [ ] Improved visualizations
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

### v2.0 (Future)

- [ ] Cloud patch sharing
- [ ] AI patch generation
- [ ] VST/AU plugin version
- [ ] Mobile companion app

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Korg for the amazing microKORG synthesizer
- The microKORG community for reverse engineering the MIDI specification
- All contributors and testers

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/microkorg-enhanced-editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/microkorg-enhanced-editor/discussions)
- **Email**: your.email@example.com

---

Made with ❤️ for the microKORG community
