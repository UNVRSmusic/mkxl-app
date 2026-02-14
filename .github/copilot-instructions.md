# microKORG Enhanced Sound Editor - Project Instructions

## Project Overview

Electron-based MIDI editor for Korg microKORG synthesizer with advanced features including patch library management, spectral visualization, AI-powered patch generation, and community sharing.

## Tech Stack

- **Runtime**: Electron 28+
- **Frontend**: React 18 + TypeScript
- **MIDI**: node-midi (RtMidi bindings)
- **Database**: better-sqlite3 (local), Supabase (cloud sharing)
- **UI Framework**: Tailwind CSS
- **State Management**: Zustand
- **Build**: electron-builder (M1 Mac arm64 support)

## Project Structure

```
microkorg-editor/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI
│   ├── shared/         # Shared types and utils
│   ├── midi/           # MIDI communication layer
│   ├── db/             # SQLite database layer
│   └── lib/            # Core libraries
├── public/             # Static assets
└── dist/               # Build outputs
```

## Development Guidelines

- Use TypeScript strict mode for type safety
- MIDI communication must be throttled to prevent SysEx flooding
- All UI components should support dark/light themes
- Implement error boundaries for MIDI device disconnection
- Cache patch data locally before syncing to cloud
- Use Web Workers for heavy computations (patch generation)

## microKORG MIDI Specifics

- Device ID: programmable (default 0x01)
- SysEx format: F0 42 3g 58 ... F7 (g = MIDI channel)
- Program dump size: 264 bytes
- Edit buffer accessible via parameter change messages
- Bank select: CC 0 (MSB), CC 32 (LSB), Program Change

## Key Features to Implement

1. Real-time parameter editing with SysEx
2. Patch library with tagging and search
3. Waveform and envelope visualization
4. Random patch generator with constraints
5. Community patch sharing (Firebase/Supabase)
6. A/B patch comparison
7. Undo/redo system
8. Bulk bank dump/restore

## Testing Requirements

- Test MIDI I/O with actual microKORG hardware
- Verify M1 Mac native build (arm64)
- Cross-platform testing (macOS, Windows, Linux)
- Offline-first functionality (local database priority)
