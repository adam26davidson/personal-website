// import SpringLatticeVisualization from "./springLatticeVisualization";
import CharacterMatrix from "./characterMatrix";
import "./App.css";
import { Route, Routes } from "react-router";

function App() {
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
