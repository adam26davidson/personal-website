import { useEffect, useRef, useState } from "react";
import { NumberSelect } from "../numberSelect/number-select";
import { CharacterInput } from "../character-input/character-input";
import { renderCharacter } from "../../utils/render-character";
import { extractOrderedBoundaryPoints } from "../../utils/character-contours";
import { resampleBoundaryPoints } from "../../utils/sample-character-points";
import { computeShapeContext } from "../../utils/compute-context";
import { AssignmentResult, findBestMapping } from "../../utils/compute-mapping";
import { drawSampledPoints } from "../../utils/draw-sampled-points";

const canvasWidth = 300;
const canvasHeight = 300;
const fontSize = 250;
const numPoints = 70;
const pointRadius = 3;
const bgColor = "#111111";
const char1Color = "red";
const char2Color = "blue";
const lineColor = "#ccc";

export function MappingVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const [char1, setChar1] = useState("k");
  const [char2, setChar2] = useState("K");
  const [thetaBins, setThetaBins] = useState(6);
  const [rBins, setRBins] = useState(4);
  const [processing, setProcessing] = useState(false);
  const [samplePoints1, setSamplePoints1] = useState<Array<[number, number]>>(
    []
  );
  const [samplePoints2, setSamplePoints2] = useState<Array<[number, number]>>(
    []
  );

  const [mapping, setMapping] = useState<AssignmentResult | null>(null);

  useEffect(() => {
    console.log("compute useEffect called");
    if (!renderCanvasRef.current) return;
    if (char1.length === 0 || char2.length === 0) {
      return; // user pressed backspace
    }
    setProcessing(true);
    const renderCtx = renderCanvasRef.current.getContext("2d");
    if (!renderCtx) {
      console.error("Render canvas context not found");
      setProcessing(false);
      return;
    }

    renderCanvasRef.current.width = canvasHeight;
    renderCanvasRef.current.height = canvasHeight;

    // render characters
    const binaryImage1 = renderCharacter(
      char1,
      renderCtx,
      canvasHeight,
      fontSize
    );
    const binaryImage2 = renderCharacter(
      char2,
      renderCtx,
      canvasHeight,
      fontSize
    );

    // compute contours and sample points
    const contours1 = extractOrderedBoundaryPoints(binaryImage1, canvasHeight);
    const contours2 = extractOrderedBoundaryPoints(binaryImage2, canvasHeight);
    const newSamplePoints1 = resampleBoundaryPoints(contours1, numPoints);
    const newSamplePoints2 = resampleBoundaryPoints(contours2, numPoints);

    setSamplePoints1(newSamplePoints1);
    setSamplePoints2(newSamplePoints2);

    // compute shape contexts
    const shapeContexts1 = computeShapeContext(
      newSamplePoints1,
      thetaBins,
      rBins
    );

    const shapeContexts2 = computeShapeContext(
      newSamplePoints2,
      thetaBins,
      rBins
    );

    // compute mapping
    setMapping(findBestMapping(shapeContexts1, shapeContexts2));

    setProcessing(false);
  }, [char1, char2, thetaBins, rBins]);

  useEffect(() => {
    console.log("draw useEffect called");
    if (!canvasRef.current) return;
    if (samplePoints1.length === 0 || samplePoints2.length === 0 || !mapping) {
      return; // no sample points or mapping to visualize
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      console.error("Canvas context not found");
      return;
    }
    canvasRef.current.width = canvasWidth;
    canvasRef.current.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // draw sample points for character 1
    drawSampledPoints(ctx, samplePoints1, char1Color, 1, pointRadius);
    // draw sample points for character 2
    drawSampledPoints(ctx, samplePoints2, char2Color, 1, pointRadius);

    // draw mapping lines
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    const colIndices = mapping.colIndices;
    const rowIndices = mapping.rowIndices;
    for (let i = 0; i < colIndices.length; i++) {
      const p1 = samplePoints1[rowIndices[i]];
      const p2 = samplePoints2[colIndices[i]];
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();

      // draw arrowHead
      const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
      const arrowLength = 6;
      ctx.beginPath();
      ctx.moveTo(p2[0], p2[1]);
      ctx.lineTo(
        p2[0] - arrowLength * Math.cos(angle - Math.PI / 6),
        p2[1] - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        p2[0] - arrowLength * Math.cos(angle + Math.PI / 6),
        p2[1] - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = lineColor;
      ctx.fill();
    }
  }, [samplePoints1, samplePoints2, mapping]);

  return (
    <div className="flex flex-row justify-center items-center flex-wrap gap-8 p-4">
      <div className="flex flex-col gap-4">
        <CharacterInput char={char1} label="Character 1" setChar={setChar1} />
        <CharacterInput char={char2} label="Character 2" setChar={setChar2} />
      </div>
      <div className="flex flex-col gap-4">
        <NumberSelect
          defaultValue={thetaBins}
          onChange={setThetaBins}
          min={1}
          max={12}
          label="Angular bins"
        />
        <NumberSelect
          defaultValue={rBins}
          onChange={setRBins}
          min={1}
          max={8}
          label="Radial bins"
        />
      </div>
      <canvas
        hidden
        ref={renderCanvasRef}
        width={canvasHeight}
        height={canvasHeight}
      />
      {processing ? (
        "Processing..."
      ) : (
        <>
          <canvas
            className="rounded-sm"
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
          />
          <div>cost: {mapping ? mapping.totalCost.toFixed(2) : "N/A"}</div>
        </>
      )}
    </div>
  );
}
