import { useEffect, useRef } from "react";
import { useStore } from "../store";

export default function Visualizer() {
  const { currentPatch } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!currentPatch || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw filter envelope
    drawEnvelope(
      ctx,
      currentPatch.parameters.filterEG,
      "Filter EG",
      20,
      "#3b82f6",
    );

    // Draw amp envelope
    drawEnvelope(ctx, currentPatch.parameters.ampEG, "Amp EG", 180, "#10b981");
  }, [currentPatch]);

  const drawEnvelope = (
    ctx: CanvasRenderingContext2D,
    eg: { attack: number; decay: number; sustain: number; release: number },
    label: string,
    yOffset: number,
    color: string,
  ) => {
    const width = 280;
    const height = 100;
    const padding = 20;

    // Draw label
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, padding, yOffset);

    // Calculate envelope points
    const attackTime = (eg.attack / 127) * width * 0.3;
    const decayTime = (eg.decay / 127) * width * 0.3;
    const sustainLevel = ((127 - eg.sustain) / 127) * height;
    const releaseTime = (eg.release / 127) * width * 0.4;

    const startX = padding;
    const startY = yOffset + 20 + height;

    // Draw envelope curve
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Start point
    ctx.moveTo(startX, startY);

    // Attack
    ctx.lineTo(startX + attackTime, yOffset + 20);

    // Decay
    ctx.lineTo(startX + attackTime + decayTime, yOffset + 20 + sustainLevel);

    // Sustain (flat line)
    ctx.lineTo(
      startX + attackTime + decayTime + width * 0.2,
      yOffset + 20 + sustainLevel,
    );

    // Release
    ctx.lineTo(
      startX + attackTime + decayTime + width * 0.2 + releaseTime,
      startY,
    );

    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i <= 4; i++) {
      const y = yOffset + 20 + (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px sans-serif";
    ctx.fillText("A", startX + attackTime / 2 - 5, startY + 15);
    ctx.fillText("D", startX + attackTime + decayTime / 2 - 5, startY + 15);
    ctx.fillText(
      "S",
      startX + attackTime + decayTime + (width * 0.2) / 2 - 5,
      startY + 15,
    );
    ctx.fillText(
      "R",
      startX + attackTime + decayTime + width * 0.2 + releaseTime / 2 - 5,
      startY + 15,
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Envelope Visualization</h3>

        <canvas
          ref={canvasRef}
          className="w-full bg-gray-950 rounded-lg"
          style={{ height: "350px" }}
        />
      </div>

      {currentPatch && (
        <div className="panel">
          <h3 className="panel-header">Patch Info</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="font-medium">{currentPatch.name}</span>
            </div>

            {currentPatch.category && (
              <div className="flex justify-between">
                <span className="text-gray-400">Category:</span>
                <span>{currentPatch.category}</span>
              </div>
            )}

            {currentPatch.tags && currentPatch.tags.length > 0 && (
              <div>
                <span className="text-gray-400">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentPatch.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-700 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentPatch.createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span className="text-xs">
                  {new Date(currentPatch.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {currentPatch && (
        <div className="panel">
          <h3 className="panel-header">Quick Stats</h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">Filter Cutoff</div>
              <div className="font-mono">
                {currentPatch.parameters.filter.cutoff}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-xs mb-1">Resonance</div>
              <div className="font-mono">
                {currentPatch.parameters.filter.resonance}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-xs mb-1">OSC 1 Level</div>
              <div className="font-mono">
                {currentPatch.parameters.mixer.osc1Level}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-xs mb-1">OSC 2 Level</div>
              <div className="font-mono">
                {currentPatch.parameters.mixer.osc2Level}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
