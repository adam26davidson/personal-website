export function drawSampledPoints(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  color: string,
  scale: number,
  radius: number = 3,
  xOffset: number = 0
) {
  ctx.fillStyle = color;
  points.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x * scale + xOffset, y * scale, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
