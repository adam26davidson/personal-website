import { CharacterCanvas } from "../character-canvas/character-canvas";
import { useEffect, useRef, useState } from "react";
import { renderCharacter } from "../../utils/render-character";
import { extractOrderedBoundaryPoints } from "../../utils/character-contours";
import { resampleBoundaryPoints } from "../../utils/sample-character-points";
import { drawBinHighlight, drawBins } from "../../utils/draw-bins";
import { drawSampledPoints } from "../../utils/draw-sampled-points";
import { Histogram } from "../histogram/histogram";
import { computeShapeContext } from "../../utils/compute-context";
import { NumberSelect } from "../numberSelect/number-select";
import { CharacterInput } from "../character-input/character-input";

const canvasSize = 300;
const imageSize = 300;
const fontSize = 250;
const numPoints = 70;
const pointRadius = 3;
const pointSelectRadius = 5;
const bgColor = "#111111";
const samplePointColor = "rgb(136, 255, 219)";
const hoverPointColor = "white";
const binColor = "rgba(255, 255, 255, 0.5)";

export function CharacterContext() {
  const [character, setCharacter] = useState("A");
  const [thetaBins, setThetaBins] = useState(6);
  const [rBins, setRBins] = useState(4);
  const [processing, setProcessing] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextCanvasRef = useRef<HTMLCanvasElement>(null);
  const [samplePoints, setSamplePoints] = useState<Array<[number, number]>>([]);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(0);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number>(-1);
  const [shapeContexts, setShapeContexts] = useState<number[][]>([]);
  const [hoveredBinIdx, setHoveredBinIdx] = useState<number>(-1);

  useEffect(() => {
    console.log("compute useEffect called");
    if (!renderCanvasRef.current || !contextCanvasRef.current) return;

    if (character.length === 0) {
      return; // user pressed backspace
    }

    setProcessing(true);

    renderCanvasRef.current.width = imageSize;
    renderCanvasRef.current.height = imageSize;
    const renderCtx = renderCanvasRef.current.getContext("2d");
    const contextCtx = contextCanvasRef.current.getContext("2d");

    if (!renderCtx || !contextCtx) {
      console.error("One or more canvas contexts not found");
      setProcessing(false);
      return;
    }

    const binaryImage = renderCharacter(
      character,
      renderCtx,
      imageSize,
      fontSize
    );
    const contours = extractOrderedBoundaryPoints(binaryImage, imageSize);
    const newSampledPoints = resampleBoundaryPoints(contours, numPoints);
    setSamplePoints(newSampledPoints);

    setShapeContexts(computeShapeContext(newSampledPoints, thetaBins, rBins));

    setProcessing(false);
  }, [character, thetaBins, rBins]);

  useEffect(() => {
    console.log("draw useEffect called");
    if (!contextCanvasRef.current) return;
    const contextCtx = contextCanvasRef.current.getContext("2d");
    if (!contextCtx) {
      console.error("Context canvas context not found");
      return;
    }
    // Clear the canvases
    contextCtx.clearRect(0, 0, canvasSize, canvasSize);
    contextCtx.fillStyle = bgColor;
    contextCtx.fillRect(0, 0, canvasSize, canvasSize);

    const scale = canvasSize / imageSize;

    // Draw the sampled points
    drawSampledPoints(
      contextCtx,
      samplePoints,
      samplePointColor,
      scale,
      pointRadius
    );

    // Draw the hovered point
    if (hoveredPointIdx !== -1) {
      const [hx, hy] = samplePoints[hoveredPointIdx];
      contextCtx.fillStyle = hoverPointColor;
      contextCtx.beginPath();
      contextCtx.arc(hx * scale, hy * scale, pointSelectRadius, 0, Math.PI * 2);
      contextCtx.fill();
    }

    drawBins(
      contextCtx,
      thetaBins,
      rBins,
      samplePoints,
      selectedPointIdx,
      binColor
    );

    if (hoveredBinIdx !== -1) {
      drawBinHighlight(
        contextCtx,
        hoveredBinIdx,
        thetaBins,
        rBins,
        samplePoints,
        selectedPointIdx,
        "rgba(255,255,255,0.3)"
      );
    }
  }, [
    samplePoints,
    hoveredPointIdx,
    hoveredBinIdx,
    selectedPointIdx,
    thetaBins,
    rBins,
  ]);

  // Handle click
  useEffect(() => {
    console.log("handle click useEffect called");
    const canvas = contextCanvasRef.current;
    if (!canvas) return;

    function getCanvasCoords(
      e: MouseEvent,
      canvas: HTMLCanvasElement
    ): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    function findClosestPoint(
      points: Array<[number, number]>,
      x: number,
      y: number,
      threshold = 5
    ): number {
      let minDist = Infinity;
      let idx = -1;
      points.forEach(([px, py], i) => {
        const d = Math.hypot(px - x, py - y);
        if (d < minDist && d < threshold) {
          minDist = d;
          idx = i;
        }
      });
      return idx;
    }

    const handleHover = (e: MouseEvent) => {
      const [x, y] = getCanvasCoords(e, canvas);
      const idx = findClosestPoint(samplePoints, x, y, 5);
      if (idx !== -1) {
        // set cursor to pointer
        canvas.style.cursor = "pointer";
      } else {
        // set cursor to default
        canvas.style.cursor = "default";
      }
      setHoveredPointIdx(idx);
    };

    const handleClick = (e: MouseEvent) => {
      const [x, y] = getCanvasCoords(e, canvas);
      const idx = findClosestPoint(samplePoints, x, y, 5);
      if (idx !== -1) setSelectedPointIdx(idx);
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleHover);
    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleHover);
    };
  }, [samplePoints]);

  return (
    <div className="flex flex-row flex-wrap gap-5 items-center justify-center">
      <canvas
        ref={renderCanvasRef}
        hidden
        width={imageSize}
        height={imageSize}
      />
      <div className="flex flex-row gap-5">
        <CharacterInput
          char={character}
          label="Character"
          setChar={setCharacter}
        />
        <div className="flex flex-col gap-4">
          <NumberSelect
            defaultValue={thetaBins}
            onChange={setThetaBins}
            min={3}
            max={12}
            label="Angular bins"
          />
          <NumberSelect
            defaultValue={rBins}
            onChange={setRBins}
            min={2}
            max={8}
            label="Radial bins"
          />
        </div>
      </div>
      {processing ? (
        "processing..."
      ) : (
        <>
          <CharacterCanvas
            canvasRef={contextCanvasRef}
            label="Select a point"
            size={canvasSize}
            fullWidth={true}
          />
          <Histogram
            hoveredBinIdx={hoveredBinIdx}
            setHoveredBinIdx={setHoveredBinIdx}
            shapeContexts={shapeContexts}
            selectedIdx={selectedPointIdx}
            width={canvasSize}
            height={canvasSize}
            color={samplePointColor}
          />
        </>
      )}
    </div>
  );
}
