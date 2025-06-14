import { useEffect, useRef, useState } from "react";
import { CharacterInput } from "../character-input/character-input";
import { computeContextFromScratch } from "../../utils/full-procedures";
import { findBestMapping } from "../../utils/compute-mapping";
import { findAffineTransformation } from "../../utils/compute-affine-transformation";
import { Button } from "@/components/ui/button";

const canvasWidth = 300;
const canvasHeight = 300;
const fontSize = 250;
const numPoints = 90;
const thetaBins = 12;
const rBins = 6;
const pointRadius = 3;
const bgColor = "#111111";
const char1Color = "red";
const char2Color = "blue";
const animationDuration = 800; // ms

export function TransformVisual() {
  const [char1, setChar1] = useState("k");
  const [char2, setChar2] = useState("K");
  const [rerender, setRerender] = useState<boolean>(true);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!renderCanvasRef.current || !canvasRef.current || !char1 || !char2)
      return;

    let rafId: number;

    // renderCtx is only used to run full-procedure (offscreen)
    const renderCtx = renderCanvasRef.current.getContext("2d")!;
    renderCanvasRef.current.width = canvasWidth;
    renderCanvasRef.current.height = canvasHeight;

    // 1) compute contexts & sampledPoints
    const data1 = computeContextFromScratch(
      char1,
      numPoints,
      thetaBins,
      rBins,
      renderCtx,
      canvasWidth,
      fontSize
    );
    const data2 = computeContextFromScratch(
      char2,
      numPoints,
      thetaBins,
      rBins,
      renderCtx,
      canvasWidth,
      fontSize
    );

    // 2) match descriptors
    const mapping = findBestMapping(data1.shapeContext, data2.shapeContext);
    const matchedP1 = mapping.rowIndices.map((i) => data1.sampledPoints[i]);
    const matchedP2 = mapping.colIndices.map((j) => data2.sampledPoints[j]);

    // 3) find inverse affine: char2 → char1
    const { A: Ainv } = findAffineTransformation(matchedP2, matchedP1);

    // 4) build homogeneous points for data2
    const points2H = data2.sampledPoints.map(
      ([x, y]) => [x, y, 1] as [number, number, 1]
    );
    // 5) compute target positions
    const target2 = points2H.map(([x, y, w]) => {
      // apply 3×2 matrix Ainv: [ [a00,a01], [a10,a11], [a20,a21] ]
      const x2 = x * Ainv[0][0] + y * Ainv[1][0] + w * Ainv[2][0];
      const y2 = x * Ainv[0][1] + y * Ainv[1][1] + w * Ainv[2][1];
      return [x2, y2] as [number, number];
    });

    // 6) animate
    const ctx = canvasRef.current.getContext("2d")!;
    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;

    let startTime: number | null = null;
    function drawFrame(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(1, elapsed / animationDuration);

      // clear
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // draw char1 points (static)
      ctx.fillStyle = char1Color;
      data1.sampledPoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
      });

      // draw char2 points (interpolated)
      ctx.fillStyle = char2Color;
      data2.sampledPoints.forEach(([x0, y0], i) => {
        const [x1, y1] = target2[i];
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
      });

      if (t < 1) {
        rafId = requestAnimationFrame(drawFrame);
      }
    }

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [char1, char2, rerender]);

  return (
    <div className="flex flex-row justify-center items-center flex-wrap gap-8 p-4">
      {/* offscreen canvas for computeContextFromScratch */}
      <canvas hidden ref={renderCanvasRef} />
      <div className="flex flex-col gap-4">
        <CharacterInput char={char1} label="Character 1" setChar={setChar1} />
        <CharacterInput char={char2} label="Character 2" setChar={setChar2} />
      </div>
      {/* visible canvas */}
      <canvas
        className="rounded-sm"
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
      />
      <Button onClick={() => setRerender(!rerender)}>▶ Replay</Button>
    </div>
  );
}
