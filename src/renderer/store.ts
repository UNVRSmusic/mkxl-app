import { create } from "zustand";
import { MicroKorgPatch, MIDIDevice, MIDIDevices } from "../shared/types";

interface AppState {
  // MIDI state
  midiDevices: MIDIDevices;
  connectedInput: MIDIDevice | null;
  connectedOutput: MIDIDevice | null;
  isConnected: boolean;

  // Patch state
  currentPatch: MicroKorgPatch | null;
  selectedPatchId: number | null;
  libraryPatches: MicroKorgPatch[];
  searchQuery: string;
  selectedTag: string | null;
  selectedCategory: string | null;

  // Editor state
  isDirty: boolean;
  undoStack: MicroKorgPatch[];
  redoStack: MicroKorgPatch[];

  // UI state
  activePanel: "library" | "editor" | "visualizer";
  showSettings: boolean;

  // Actions
  setMidiDevices: (devices: MIDIDevices) => void;
  setConnectedDevices: (
    input: MIDIDevice | null,
    output: MIDIDevice | null,
  ) => void;
  setCurrentPatch: (patch: MicroKorgPatch | null) => void;
  setLibraryPatches: (patches: MicroKorgPatch[]) => void;
  addPatchToLibrary: (patch: MicroKorgPatch) => void;
  removePatchFromLibrary: (id: number) => void;
  updatePatchParameter: (path: string, value: any) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setActivePanel: (panel: "library" | "editor" | "visualizer") => void;
  setShowSettings: (show: boolean) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;
  markDirty: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  midiDevices: { inputs: [], outputs: [] },
  connectedInput: null,
  connectedOutput: null,
  isConnected: false,
  currentPatch: null,
  selectedPatchId: null,
  libraryPatches: [],
  searchQuery: "",
  selectedTag: null,
  selectedCategory: null,
  isDirty: false,
  undoStack: [],
  redoStack: [],
  activePanel: "editor",
  showSettings: false,

  // Actions
  setMidiDevices: (devices) => set({ midiDevices: devices }),

  setConnectedDevices: (input, output) =>
    set({
      connectedInput: input,
      connectedOutput: output,
      isConnected: !!(input && output),
    }),

  setCurrentPatch: (patch) =>
    set({
      currentPatch: patch,
      selectedPatchId: patch?.id || null,
      isDirty: false,
      undoStack: [],
      redoStack: [],
    }),

  setLibraryPatches: (patches) => set({ libraryPatches: patches }),

  addPatchToLibrary: (patch) =>
    set((state) => ({
      libraryPatches: [patch, ...state.libraryPatches],
    })),

  removePatchFromLibrary: (id) =>
    set((state) => ({
      libraryPatches: state.libraryPatches.filter((p) => p.id !== id),
    })),

  updatePatchParameter: (path, value) =>
    set((state) => {
      if (!state.currentPatch) return state;

      const newPatch = { ...state.currentPatch };
      const parts = path.split(".");
      let obj: any = newPatch.parameters;

      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }

      obj[parts[parts.length - 1]] = value;

      return {
        currentPatch: newPatch,
        isDirty: true,
        redoStack: [], // Clear redo stack on new change
      };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setShowSettings: (show) => set({ showSettings: show }),

  pushUndo: () =>
    set((state) => {
      if (!state.currentPatch) return state;

      return {
        undoStack: [...state.undoStack, state.currentPatch],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0 || !state.currentPatch) return state;

      const newUndoStack = [...state.undoStack];
      const previousPatch = newUndoStack.pop()!;

      return {
        currentPatch: previousPatch,
        undoStack: newUndoStack,
        redoStack: [state.currentPatch, ...state.redoStack],
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0 || !state.currentPatch) return state;

      const newRedoStack = [...state.redoStack];
      const nextPatch = newRedoStack.shift()!;

      return {
        currentPatch: nextPatch,
        undoStack: [...state.undoStack, state.currentPatch],
        redoStack: newRedoStack,
        isDirty: true,
      };
    }),

  markClean: () => set({ isDirty: false }),
  markDirty: () => set({ isDirty: true }),
}));
