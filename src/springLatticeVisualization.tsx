import { SpringLattice } from "./springLattice";
import { useRef, useEffect, useState } from "react";
import chroma from "chroma-js";

const scale = chroma.scale(["green", "white", "purple"]).domain([-1, 1]);

function SpringLatticeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lattice] = useState(new SpringLattice());

  useEffect(() => {
    const drawFrame = (ctx: CanvasRenderingContext2D) => {
      const current_time = Date.now();
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const sx = canvasWidth / lattice.num_columns;
      const sy = canvasHeight / lattice.num_rows;
      for (let i = 0; i < lattice.num_rows; i++) {
        for (let j = 0; j < lattice.num_columns; j++) {
          // Draw a circle for each mass in the lattice, setting the color based on the position (red is high, blue is low)
          ctx.beginPath();
          ctx.arc(sx * j + sx / 2, sy * i + sy / 2, 5, 0, 2 * Math.PI);
          ctx.fillStyle = scale(lattice.positions[i][j]).hex();
          ctx.fill();
        }
      }
      return current_time;
    };
    if (!canvasRef.current) {
      console.error("Canvas not found");
      return;
    }
    lattice.initialize(canvasRef.current.width, canvasRef.current.height, 3000);
    const canvas: HTMLCanvasElement = canvasRef.current;
    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : 0;
    canvas.height = parent ? parent.clientHeight : 0;
    const context = canvas.getContext("2d");
    if (!context) {
      console.error("Context not found");
      return;
    }
    let animationFrameId: number;
    window.setInterval(() => {
      lattice.update();
    }, 10);
    const render = () => {
      drawFrame(context);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [lattice]);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsMouseDown(true);
    handleMouseAction(event);
    lattice.setAttractorOn();
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    lattice.setAttractorOff();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isMouseDown) {
      handleMouseAction(event);
    }
  };

  const handleMouseAction = (event: React.MouseEvent) => {
    if (!canvasRef.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvasRef.current.width;
    const y = (event.clientY - rect.top) / canvasRef.current.height;
    lattice.setAttractorPosition(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    />
  );
}

export default SpringLatticeVisualization;
