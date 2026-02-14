# microKORG Enhanced Editor - Setup Instructions

## What Has Been Created

The complete project structure has been scaffolded with all necessary files:

### Core Architecture ✅

- **Electron main process** (`src/main/`) - App initialization, IPC handlers
- **React renderer** (`src/renderer/`) - UI components with Tailwind CSS
- **MIDI layer** (`src/midi/`) - Device management and SysEx parsing
- **Database layer** (`src/db/`) - SQLite patch library management
- **Shared types** (`src/shared/`) - TypeScript interfaces

### Implemented Features ✅

1. **MIDI Communication**
   - MIDIManager class with device discovery
   - SysEx message parsing/encoding for microKORG
   - Bi-directional hardware communication
   - Program change and patch dump requests

2. **Patch Editor UI**
   - Complete parameter controls for all OSCs, filter, EGs, LFO
   - Real-time parameter editing with undo/redo
   - Send patches to/from hardware
   - Visual parameter controls (sliders + numeric input)

3. **Patch Library**
   - SQLite database with full-text search
   - Tag system for organization
   - Favorites and ratings
   - Import/export patches

4. **Visualization**
   - Canvas-based envelope visualization (Filter EG, Amp EG)
   - Patch info display
   - Quick stats panel

5. **State Management**
   - Zustand store with proper TypeScript typing
   - Undo/redo stack
   - Dirty state tracking

### Files Created (31 total)

```
microkorg-editor/
├── .github/
│   └── copilot-instructions.md
├── public/
│   └── icon.svg
├── src/
│   ├── main/
│   │   ├── main.ts              # Electron main process
│   │   └── preload.ts           # IPC bridge
│   ├── renderer/
│   │   ├── components/
│   │   │   ├── Header.tsx       # MIDI connection UI
│   │   │   ├── Sidebar.tsx      # Patch library
│   │   │   ├── PatchEditor.tsx  # Main editor
│   │   │   ├── ParameterControl.tsx
│   │   │   └── Visualizer.tsx   # Canvas visualizations
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── store.ts             # Zustand state
│   │   └── styles.css           # Tailwind styles
│   ├── midi/
│   │   ├── MIDIManager.ts       # MIDI I/O
│   │   └── SysExParser.ts       # SysEx encode/decode
│   ├── db/
│   │   └── DatabaseManager.ts   # SQLite operations
│   └── shared/
│       ├── types.ts             # TypeScript interfaces
│       └── electron.d.ts        # Electron API types
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
└── README.md
```

## Next Steps - Getting It Running

### 1. Install Dependencies

```bash
cd "/Users/jiridusek/code/mkxl app/microkorg-editor"
npm install
```

This will install all dependencies including:

- Electron 28
- React 18
- TypeScript
- node-midi (MIDI support)
- better-sqlite3 (database)
- Tailwind CSS
- Vite (build tool)

### 2. Build the Project

```bash
# Build both main and renderer processes
npm run build

# Or build them separately:
npm run build:main     # Compile TypeScript for Electron
npm run build:renderer # Build React UI with Vite
```

### 3. Run in Development Mode

```bash
npm run dev
```

This will:

1. Watch and compile the main process TypeScript
2. Watch and build the renderer with Vite hot reload
3. Launch Electron with DevTools open

### 4. Test MIDI Connection

1. Connect your microKORG via USB-MIDI
2. Launch the app
3. Select MIDI input/output from dropdowns
4. Click "Connect"
5. Try "Import from HW" to load a patch

### 5. Build for Distribution (M1 Mac)

```bash
npm run electron:build
```

Output will be in `release/` directory as a `.dmg` file.

## Known Setup Issues & Fixes

### If `npm install` fails:

```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### If MIDI doesn't work on M1 Mac:

The `node-midi` package needs to be rebuilt for Apple Silicon:

```bash
npm rebuild midi --build-from-source
```

### If TypeScript compilation fails:

Make sure TypeScript is installed:

```bash
npm install --save-dev typescript
```

Then run:

```bash
./node_modules/.bin/tsc -p tsconfig.main.json
```

## Development Workflow

1. **Edit code** - Make changes to TypeScript/React files
2. **Hot reload** - Vite will auto-reload the UI
3. **Main process changes** - Requires app restart (Cmd+R)
4. **Test with hardware** - Connect microKORG for full testing

## Project Structure Explanation

### Main Process (Electron Backend)

- Handles MIDI I/O using node-midi
- Manages SQLite database
- Exposes APIs to renderer via IPC

### Renderer Process (React Frontend)

- Modern React 18 with hooks
- Zustand for state management
- Tailwind CSS for styling
- Canvas API for visualizations

### MIDI Layer

- `MIDIManager`: Handles device connections and message routing
- `SysExParser`: Encodes/decodes microKORG SysEx format
- Supports all 264-byte patch parameters

### Database Layer

- SQLite for local patch storage
- Full-text search capabilities
- Tag and category system
- Favorites and ratings

## Future Enhancements (Not Yet Implemented)

- [ ] Random patch generator
- [ ] Patch mutation/evolution
- [ ] Cloud patch sharing (Firebase/Supabase)
- [ ] Spectral analysis
- [ ] A/B patch comparison
- [ ] VST/AU plugin version
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

## Troubleshooting

### MIDI not detected

- Check USB connection
- Verify microKORG is powered on
- On macOS: Check System Preferences > Security & Privacy > Privacy > Bluetooth (if using Bluetooth MIDI)

### Database errors

- Check write permissions in user data directory
- Clear old database: `rm ~/Library/Application\ Support/microkorg-enhanced-editor/patches.db`

### Build errors

- Ensure Node.js version >= 18
- Check M1 compatibility of native modules
- Try `npm rebuild` for native modules

## Support

For issues, check the README.md or create an issue on GitHub.

---

**Project Status**: Scaffold Complete ✅
**Next Action**: Run `npm install` and `npm run dev`
**Estimated Time to First Run**: 5-10 minutes
