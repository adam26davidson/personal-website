import { useRef, useEffect } from "react";

type Props = {
  shapeContexts: number[][];
  hoveredBinIdx: number;
  setHoveredBinIdx: (idx: number) => void;
  selectedIdx: number | null;
  width: number;
  height: number;
  color?: string;
};

export function Histogram({
  shapeContexts,
  hoveredBinIdx,
  setHoveredBinIdx,
  selectedIdx,
  width,
  height,
  color = "#4a90e2",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || selectedIdx === null) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    const descriptor = shapeContexts[selectedIdx];
    if (!descriptor) return;

    const nBins = descriptor.length;
    const margin = 0;
    const barAreaWidth = width - margin * 2;
    const barAreaHeight = height - margin * 2;
    const barWidth = barAreaWidth / nBins;

    // Find max for scaling
    const maxVal = Math.max(...descriptor);

    // Draw bars
    descriptor.forEach((val, i) => {
      const x = margin + i * barWidth;
      const barHeight = maxVal > 0 ? (val / maxVal) * barAreaHeight : 0;
      const y = height - margin - barHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth * 0.9, barHeight);
    });

    // draw highlight for hovered bin
    if (hoveredBinIdx !== -1) {
      const x = margin + hoveredBinIdx * barWidth;

      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(x, margin, barWidth * 0.9, height - margin);
    }
  }, [shapeContexts, selectedIdx, width, height, color, hoveredBinIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Mouse move event to set hovered bin index
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const barWidth = (width - 0) / shapeContexts[selectedIdx!].length;
      const hoveredBinIdx = Math.floor(x / barWidth);

      setHoveredBinIdx(hoveredBinIdx);
    };

    // Mouse leave event to reset hovered bin index
    const handleMouseLeave = () => {
      setHoveredBinIdx(-1);
    };

    // Add event listeners
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    // Cleanup event listeners on unmount
    return () => {
      if (!canvas) return;
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shapeContexts, selectedIdx, width, height, setHoveredBinIdx]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span>Hover over a bin</span>
      <canvas
        className="rounded-sm"
        ref={canvasRef}
        width={width}
        height={height}
      />
    </div>
  );
}
