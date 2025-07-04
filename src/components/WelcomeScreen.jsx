import React from "react";

function WelcomeScreen({ onStart, onExplore }) {
  return (
    <div className="welcome-screen">
      <h1>Pattern Puzzle</h1>
      <button onClick={onStart}>Start / Play</button>
      <button onClick={onExplore}>Explore</button>
      {/* Style as you like */}
    </div>
  );
}

export default WelcomeScreen;
