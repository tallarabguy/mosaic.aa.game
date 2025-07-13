import React, { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import InputGrids from "./components/InputGrids";
import ShowSymmetry from "./components/ShowSymmetry";
import AnimatedToCorners from "./components/AnimatedToCorners"
import MarginBuilder from "./components/MarginBuilder";
import PatternGrid from "./components/PatternGrid";
import PatternFiller from "./components/PatternFiller";
import PatternCompressor from "./components/PatternCompressor";
import InnerCornerFiller from "./components/InnerCornerFiller";
import CentrePuller from "./components/CentrePuller";

// Import more screens as you build them...


function App() {
  const [stage, setStage] = useState("welcome");
  const [inputPatterns, setInputPatterns] = useState({ start: null, end: null });
  const [cornerPatterns, setCornerPatterns] = useState(null);
  const [currentGrid, setCurrentGrid] = useState(null);
  const [marginIndex, setMarginIndex] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const [error, setError] = useState(null); // New error state


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
            setStage("filling");
          }}
          onError={errMsg => {
            setError(errMsg);           // Save the error message
            setStage("error");          // Move to error overlay/page
          }}
        />
      )}

      {stage === "error" && (
        <div className="overlay error-overlay">
          <div className="error-message">
            <h2>Pattern could not be solved</h2>
            <p>{error || "Sorry, this combination of patterns is not valid. Please try a different input."}</p>
            <button onClick={() => {
              setCurrentGrid(null);
              setInputPatterns({});
              setCornerPatterns(null);
              setError(null);
              setStage("welcome"); // or "input", as you prefer
            }}>
              Start Over
            </button>
          </div>
        </div>
      )}

      {stage === "filling" && currentGrid && (
        <PatternFiller
          grid={currentGrid}
          onComplete={(updatedGrid) => {
            setCurrentGrid(updatedGrid.map((row) => [...row]));
            setStage("compression");
          }}
        />
      )}
      {stage === "compression" && currentGrid && (
        <PatternCompressor
          grid={currentGrid}
          onComplete={(updatedGrid) => {
            setCurrentGrid(updatedGrid.map((row) => [...row]));
            setStage("corner-filling"); // or whatever comes next!
          }}
        />
      )}
      {stage === "corner-filling" && currentGrid && (
        <InnerCornerFiller
          grid={currentGrid}
          onComplete={(updatedGrid) => {
            setCurrentGrid(updatedGrid.map((row) => [...row]));
            setStage("centre-pulling"); // or whatever comes next!
          }}
        />
      )}
      {stage === "centre-pulling" && currentGrid && (
        <CentrePuller
          grid={currentGrid}
          onComplete={(updatedGrid) => {
            setCurrentGrid(updatedGrid.map((row) => [...row]));
            // setStage("final-stage"); // or whatever comes next!
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
