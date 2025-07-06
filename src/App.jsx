import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import InputGrids from "./components/InputGrids";
import ShowSymmetry from "./components/ShowSymmetry";
import AnimatedToCorners from "./components/AnimatedToCorners"
import MarginBuilder from "./components/MarginBuilder";
import PatternGrid from "./components/PatternGrid";
// Import more screens as you build them...


function App() {
  const [stage, setStage] = useState("welcome");
  const [inputPatterns, setInputPatterns] = useState({ start: null, end: null });
  const [cornerPatterns, setCornerPatterns] = useState(null);
  const [currentGrid, setCurrentGrid] = useState(null);
  const [marginIndex, setMarginIndex] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);

  useEffect(() => {
    if (window.__triggerNextStep) {
      if (stage === "margin-builder" && marginIndex < 3) setMarginIndex(marginIndex + 1);
      else if (stage === "margin-builder") setStage("solving");
      window.__triggerNextStep = false;
    }
  }, [currentGrid, stage, marginIndex]);

  // You can add more props and handlers as you go
  return (
    <div className="app-center">
      {stage === "welcome" && (
        <WelcomeScreen
          onStart={() => setStage("input")}
          onExplore={() => {/* logic here */}}
        />
      )}
      {stage === "input" && (
        <InputGrids
          onDone={(patterns) => {
            setInputPatterns(patterns);
            setStage("show-symmetry");
          }}
        />
      )}
      {stage === "show-symmetry" && inputPatterns.start && inputPatterns.end && (
        <ShowSymmetry
          inputPatterns={inputPatterns}
          onContinue={(patterns, positions) => {
            setCornerPatterns({ ...patterns, positions });
            setStage("corners-animation");
          }}
        />
      )}
      {stage === "corners-animation" && cornerPatterns && (
        <AnimatedToCorners
          start4={cornerPatterns.start4}
          end4={cornerPatterns.end4}
          inv_start4={cornerPatterns.inv_start4}
          inv_end4={cornerPatterns.inv_end4}
          start4Pos={cornerPatterns.positions?.start4}
          end4Pos={cornerPatterns.positions?.end4}
          inv_start4Pos={cornerPatterns.positions?.inv_start4}
          inv_end4Pos={cornerPatterns.positions?.inv_end4}
          onDone={grid => {
            setCurrentGrid(grid);
            setMarginIndex(0);
            setStage("margin-builder");
          }}
        />
      )}
      {stage === "margin-builder" && currentGrid && (
        <MarginBuilder
          initialGrid={currentGrid}
          onComplete={finalGrid => {
            setCurrentGrid(finalGrid);
            setStage("solving");
          }}
        />
      )}
      {/* Add your "solving" and other stages below */}
      {stage === "solving" && currentGrid && (
        <PatternGrid pattern={currentGrid} size={16} />
      )}
    </div>
  );
}

export default App;
