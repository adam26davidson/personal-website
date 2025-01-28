import { useEffect, useRef } from "react";
import { SpringLattice } from "./springLattice";
import MatrixView from "./matrixView";
import _ from "lodash";
import { useLocation, useNavigate } from "react-router";
import {
  FONT_SIZE,
  MOBILE_WIDTH,
  NUM_PARTICLES,
  NUM_PARTICLES_MOBILE,
} from "./constants";
import { IntPoint } from "./UtilityTypes/IntPoint";

const matrixView = new MatrixView();
const lattice = new SpringLattice();

function CharacterMatrix() {
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    matrixView.setRoute(location.pathname);
  }, [location]);

  useEffect(() => {
    matrixView.setNavigate(navigate);
  }, [navigate]);

  useEffect(() => {
    console.log(
      "RUNNING INITIALIZATION ------------------------------ !!!!!!!!"
    );
    const updateCharacters = async () => {
      matrixView.update();
      const matrix = matrixView.getSurfaceMatrix();
      if (ref.current) {
        ref.current.innerHTML = matrix.map((row) => row.join("")).join("\n");
      }
      animationRef.current = requestAnimationFrame(updateCharacters);
    };

    const updatePadding = () => {
      if (!ref.current) {
        return;
      }

      const widthInPixels = ref.current?.clientWidth || 0;
      const heightInPixels = ref.current?.clientHeight || 0;
      console.log(
        "widthInPixels",
        widthInPixels,
        "heightInPixels",
        heightInPixels
      );
      const charWidth = FONT_SIZE / 2;
      const charHeight = FONT_SIZE;
      const matrixWidthInChars = Math.floor(widthInPixels / (FONT_SIZE / 2));
      const matrixHeightInChars = Math.floor(heightInPixels / charHeight);
      const matrixWidthInPixels = matrixWidthInChars * charWidth;
      const matrixHeightInPixels = matrixHeightInChars * charHeight;
      console.log("matrixWidthInPixels", matrixWidthInPixels);
      console.log("matrixHeightInPixels", matrixHeightInPixels);
      const paddingLeft = Math.floor((widthInPixels - matrixWidthInPixels) / 2);
      const paddingTop = 0;
      offset.current = { x: paddingLeft, y: paddingTop };
      matrixView.setPixelOffset(new IntPoint(paddingLeft, paddingTop));
      console.log("-----------------padding", offset.current);
      ref.current.style.paddingLeft = `${paddingLeft}px`;
      ref.current.style.paddingTop = `${paddingTop}px`;
    };

    const handleResize = _.debounce(() => {
      updatePadding();
      const width = ref.current?.clientWidth || 0;
      const height = ref.current?.clientHeight || 0;
      matrixView.handleResize(width, height);
    }, 50);

    window.addEventListener("resize", handleResize);

    const width = ref.current?.clientWidth || 0;
    const height = ref.current?.clientHeight || 0;
    updatePadding();

    let numParticles = NUM_PARTICLES;
    if (width < (MOBILE_WIDTH * FONT_SIZE) / 2) {
      numParticles = NUM_PARTICLES_MOBILE;
    }
    lattice.initialize(width, height, numParticles);
    const latticeInterval = window.setInterval(() => {
      lattice.update();
    }, 20);

    matrixView.initialize(width, height, lattice, FONT_SIZE);
    const matrix = matrixView.getSurfaceMatrix();
    if (ref.current) {
      ref.current.innerHTML = matrix.map((row) => row.join("")).join("\n");
    }

    animationRef.current = requestAnimationFrame(updateCharacters);

    return () => {
      window.clearInterval(latticeInterval);
      cancelAnimationFrame(animationRef.current || 0);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMouseDown = (event: React.MouseEvent) => {
    const [x, y] = getNormalizedMousePosition(event);
    matrixView.handleMouseDown(x, y);
  };

  // const handleTouchStart = (event: React.TouchEvent) => {
  //   const [x, y] = getNormalizedTouchPosition(event);
  //   matrixView.handleMouseDown(x, y);
  // };

  // const handleTouchMove = (event: React.TouchEvent) => {
  //   const [x, y] = getNormalizedTouchPosition(event);
  //   matrixView.handleMouseMove(x, y);
  // };

  const handleMouseUp = () => {
    matrixView.handleMouseUp();
  };

  // const handleTouchEnd = () => {
  //   matrixView.handleMouseUp();
  // };

  const handleMouseMove = (event: React.MouseEvent) => {
    const [x, y] = getNormalizedMousePosition(event);
    matrixView.handleMouseMove(x, y);
  };

  // const getNormalizedTouchPosition = (event: React.TouchEvent) => {
  //   return calculateNormalizedPosition(
  //     event.touches[0].clientX,
  //     event.touches[0].clientY
  //   );
  // };

  const getNormalizedMousePosition = (event: React.MouseEvent) => {
    return calculateNormalizedPosition(event.clientX, event.clientY);
  };

  const calculateNormalizedPosition = (x: number, y: number) => {
    if (!ref.current) {
      return [0, 0];
    }
    const rect = ref.current.getBoundingClientRect();
    const normX =
      (x - rect.left - offset.current.x) /
      (FONT_SIZE * 0.5 * matrixView.getNumColumns());
    const normY =
      (y - rect.top - offset.current.y) / (FONT_SIZE * matrixView.getNumRows());
    return [Math.max(Math.min(normX, 1), 0), Math.max(Math.min(normY, 1), 0)];
  };

  return (
    <div
      ref={ref}
      onPointerDown={handleMouseDown}
      //onTouchStart={handleTouchStart}
      onPointerUp={handleMouseUp}
      //onTouchEnd={handleTouchEnd}
      onPointerMove={handleMouseMove}
      //onTouchMove={handleTouchMove}
      style={{
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        overflowX: "hidden",
        fontFamily: "UniFont, UniFontUpper",
        fontSize: `${FONT_SIZE}px`,
        lineHeight: `${FONT_SIZE}px`,
        userSelect: "none",
        touchAction: "none",
        textOverflow: "elipsis",
        whiteSpace: "pre",
        overflow: "hidden",
      }}
    ></div>
  );
}

export default CharacterMatrix;
