import { useState, useEffect } from "react";
import { useStore } from "../store";
import { MicroKorgPatch } from "../../shared/types";

export default function Sidebar() {
  const {
    libraryPatches,
    searchQuery,
    setSearchQuery,
    setCurrentPatch,
    selectedPatchId,
    currentPatch,
    isDirty,
  } = useStore();

  const [filteredPatches, setFilteredPatches] = useState<MicroKorgPatch[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      loadSearchResults();
    } else {
      setFilteredPatches(libraryPatches);
    }
  }, [searchQuery, libraryPatches]);

  const loadSearchResults = async () => {
    const results = await window.electronAPI.db.searchPatches(searchQuery);
    setFilteredPatches(results);
  };

  const handleSelectPatch = async (patch: MicroKorgPatch) => {
    if (isDirty) {
      const confirm = window.confirm("You have unsaved changes. Continue?");
      if (!confirm) return;
    }

    setCurrentPatch(patch);
  };

  const handleSaveCurrentPatch = async () => {
    if (!currentPatch) return;

    try {
      const id = await window.electronAPI.db.savePatch(currentPatch);

      // Reload library
      const patches = await window.electronAPI.db.getAllPatches();
      useStore.getState().setLibraryPatches(patches);
      useStore.getState().markClean();

      alert("Patch saved successfully!");
    } catch (error) {
      console.error("Failed to save patch:", error);
      alert("Failed to save patch");
    }
  };

  const handleDeletePatch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirm = window.confirm("Delete this patch?");
    if (!confirm) return;

    try {
      await window.electronAPI.db.deletePatch(id);

      // Reload library
      const patches = await window.electronAPI.db.getAllPatches();
      useStore.getState().setLibraryPatches(patches);

      if (selectedPatchId === id) {
        setCurrentPatch(null);
      }
    } catch (error) {
      console.error("Failed to delete patch:", error);
      alert("Failed to delete patch");
    }
  };

  const handleRequestPatchDump = async (program: number) => {
    try {
      await window.electronAPI.midi.requestPatchDump(program);
    } catch (error) {
      console.error("Failed to request patch dump:", error);
      alert("Failed to request patch from microKORG");
    }
  };

  return (
    <aside className="w-80 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Patch Library</h2>

        <input
          type="text"
          placeholder="Search patches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input w-full text-sm"
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSaveCurrentPatch}
            disabled={!currentPatch || !isDirty}
            className="btn-primary text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Patch
          </button>

          <button
            onClick={() => handleRequestPatchDump(0)}
            className="btn-secondary text-sm flex-1"
          >
            Import from HW
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredPatches.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No patches found" : "No patches in library"}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredPatches.map((patch) => (
              <div
                key={patch.id}
                onClick={() => handleSelectPatch(patch)}
                className={`p-3 cursor-pointer hover:bg-gray-800 transition-colors ${
                  patch.id === selectedPatchId
                    ? "bg-gray-800 border-l-4 border-primary-500"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{patch.name}</div>

                    {patch.category && (
                      <div className="text-xs text-gray-500 mt-1">
                        {patch.category}
                      </div>
                    )}

                    {patch.tags && patch.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {patch.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-700 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeletePatch(patch.id!, e)}
                    className="text-gray-500 hover:text-red-500 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
