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
import TerminalConsole from "./components/TerminalConsole";
import ExploreNarrator from "./components/Explorer"
import SolvabilityBitmap from "./components/SolvabilityBitmap"
import AnimatedSolvabilityBitmap from "./components/AnimatedSolvability";

import './App.css';

// Import more screens as you build them...

const isMobile = typeof window !== "undefined" && window.innerWidth < 600;
const CELL_SIZE = isMobile ? 8 : 12; // Or any values you want
const mini_SIZE = isMobile ? 25 : 40; // Or any values you want

function App() {
  const [stage, setStage] = useState("welcome");
  const [inputPatterns, setInputPatterns] = useState({ start: null, end: null });
  const [cornerPatterns, setCornerPatterns] = useState(null);
  const [currentGrid, setCurrentGrid] = useState(null);
  const [marginIndex, setMarginIndex] = useState(0);
  // const [showNextButton, setShowNextButton] = useState(false);
  const [error, setError] = useState(null); // New error state
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [exploreUnlocked, setExploreUnlocked] = useState(false);

  function logToConsole(text, optsOrType = "info") {
    let type = "info";
    let overwrite = false;
    let timestamp = new Date().toLocaleTimeString();
    let extra = {};

    if (typeof optsOrType === "object" && optsOrType !== null) {
      type = optsOrType.type || "info";
      overwrite = optsOrType.overwrite || false;
      if (optsOrType.timestamp) timestamp = optsOrType.timestamp;
      extra = { ...optsOrType }; // Capture any extra fields
    } else if (typeof optsOrType === "string") {
      type = optsOrType;
    }

    setConsoleMessages((msgs) => {
      if (overwrite && msgs.length > 0) {
        // Keep original timestamp unless explicitly overwritten
        const oldMsg = msgs[msgs.length - 1];
        const msgTimestamp = extra.timestamp || oldMsg.timestamp;
        const updated = [...msgs];
        updated[updated.length - 1] = {
          ...oldMsg,
          ...extra,
          text,
          type,
          timestamp: msgTimestamp,
        };
        return updated;
      } else {
        // Normal append, include any extra props for input handling
        return [
          ...msgs,
          { text, type, timestamp, ...extra },
        ];
      }
    });
  }


  useEffect(() => {
    if (window.__triggerNextStep) {
      if (stage === "margin-builder" && marginIndex < 3) setMarginIndex(marginIndex + 1);
      else if (stage === "margin-builder") setStage("solving");
      window.__triggerNextStep = false;
    }
  }, [currentGrid, stage, marginIndex]);

  // You can add more props and handlers as you go
  return (
    <div className="app-window">
      <div className="app-content">
        <div className="pattern-canvas">
          {stage === "welcome" && (
            <WelcomeScreen
              onStart={() => setStage("input")}
              onExplore={() => setStage("explore")}
            />
          )}
          {stage === "input" && (
            <InputGrids
              onDone={(patterns) => {
                setInputPatterns(patterns);
                setStage("show-symmetry");
              }}
              logToConsole={logToConsole}
            />
          )}
          {stage === "show-symmetry" && inputPatterns.start && inputPatterns.end && (
            <ShowSymmetry
              inputPatterns={inputPatterns}
              onContinue={(patterns, positions) => {
                setCornerPatterns({ ...patterns, positions });
                setStage("corners-animation");
              }}
              logToConsole={logToConsole}
              size = {mini_SIZE}
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
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}
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
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}
            />
          )}

          {stage === "error" && (
            <div className="overlay error-overlay">
              <div className="error-message">
                <h2>Pattern could not be solved</h2>
                <p>{error || "Sorry, this combination of patterns is not valid. Please try a different input."}</p>
                <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                  <button onClick={() => {
                    setCurrentGrid(null);
                    setInputPatterns({});
                    setCornerPatterns && setCornerPatterns(null); // Only if defined
                    setError(null);
                    setStage("welcome");
                  }}>
                    Go to Welcome
                  </button>
                  <button onClick={() => {
                    setCurrentGrid(null);
                    setInputPatterns({});
                    setCornerPatterns && setCornerPatterns(null);
                    setError(null);
                    setStage("input");
                  }}>
                    Go to Input
                  </button>
                </div>
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
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}
            />
          )}
          {stage === "compression" && currentGrid && (
            <PatternCompressor
              grid={currentGrid}
              onComplete={(updatedGrid) => {
                setCurrentGrid(updatedGrid.map((row) => [...row]));
                setStage("corner-filling"); // or whatever comes next!
              }}
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}             
            />
          )}
          {stage === "corner-filling" && currentGrid && (
            <InnerCornerFiller
              grid={currentGrid}
              onComplete={(updatedGrid) => {
                setCurrentGrid(updatedGrid.map((row) => [...row]));
                setStage("centre-pulling"); // or whatever comes next!
              }}
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}              
            />
          )}

          {stage === "centre-pulling" && currentGrid && (
            <CentrePuller
              grid={currentGrid}
              onComplete={(updatedGrid) => {
                setCurrentGrid(updatedGrid.map((row) => [...row]));
                setStage("final-stage"); // or whatever comes next!
              }}
              logToConsole={logToConsole}
              CELL_SIZE={CELL_SIZE}              
            />
          )}

          {stage === "final-stage" && currentGrid && (
            <div
              style={{
                position: "relative",
                width: 32 * CELL_SIZE,
                height: 32 * CELL_SIZE,
                margin: "40px auto",
              }}
            >
              <PatternGrid pattern={currentGrid} size={CELL_SIZE} />
            </div>
          )}

          {/* Add your "solving" and other stages below */}
          {stage === "solving" && currentGrid && (
            <PatternGrid pattern={currentGrid} size={16} />
          )}

          {stage === "explore" && (
            <ExploreNarrator
              logToConsole={logToConsole}
              onDone={() => {
                setExploreUnlocked(true); // unlocks the next step
                setTimeout(() => {
                  setStage("explore-solved"); // triggers terminal to collapse & grid to show
                }, 1000); // 1-second delay after password acceptance
              }}
            />
          )}

          {stage === "explore-solved" && (
            <AnimatedSolvabilityBitmap cellSize={CELL_SIZE} />
          )}

        </div>
          <TerminalConsole
            messages={consoleMessages}
            setConsoleMessages={setConsoleMessages}
            expand={stage === "explore"}
          />

      </div>
    </div>
  );
}

export default App;
