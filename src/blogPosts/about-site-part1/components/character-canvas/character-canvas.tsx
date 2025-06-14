const widthRatio = 0.85;

export function CharacterCanvas({
  label,
  size,
  canvasRef,
  fullWidth = false,
}: {
  label: string;
  size: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "5px",
        width: fullWidth ? `${size}px` : `${size * widthRatio}px`,
        overflow: "hidden",
      }}
    >
      <span>{label}</span>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: fullWidth ? `${size}px` : `${size * widthRatio}px`,
          height: `${size}px`,
          overflow: "hidden",
          border: "1px solid black",
          borderRadius: "5px",
          marginTop: "5px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            fontFamily: '"UniFont", "UniFontUpper"',
            backgroundColor: "#dddddd",
            color: "white",
            textAlign: "center",
          }}
        ></canvas>
      </div>
    </div>
  );
}
