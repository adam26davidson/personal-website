// import SpringLatticeVisualization from "./springLatticeVisualization";
import CharacterMatrix from "./characterMatrix";
import "./App.css";
import { Route, Routes } from "react-router";
import UnifontOtf from "./assets/unifont-16.0.01.otf";
import UnifontUpperOtf from "./assets/unifont_upper-16.0.01.otf";
import { useEffect, useState } from "react";

function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Preload font via JavaScript (if not already done)
    const preloadFont = (href: string, type: string) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.href = href;
      link.type = type;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    };

    preloadFont(UnifontOtf, "font/otf");
    preloadFont(UnifontUpperOtf, "font/otf");

    // Wait for all fonts to be loaded
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });
  }, []);

  if (!fontsLoaded) {
    return <div>Loading...</div>; // Show a loading screen
  }

  return (
    <>
      {/* <SpringLatticeVisualization /> */}
      <Routes>
        <Route path="/*" element={<CharacterMatrix />} />
      </Routes>
    </>
  );
}

export default App;
