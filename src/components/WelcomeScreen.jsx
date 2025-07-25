import React from "react";

function WelcomeScreen({ onStart, onExplore }) {
  return (
    <div className="welcome-screen">
      <h1>Generative Transmission Pattern Puzzle</h1>
      <button onClick={onStart}>Start</button>
      <button onClick={onExplore}>Help</button>
      {/* Style as you like */}
    </div>
  );
}

export default WelcomeScreen;
