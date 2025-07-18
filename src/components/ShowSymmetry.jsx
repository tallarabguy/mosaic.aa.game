import React, { useState, useEffect, useRef } from "react";
import PatternGrid from "./PatternGrid";
import { generateSymmetric4x4 } from "../utils/symmetry";

function ShowSymmetry({ inputPatterns, onContinue }) {
  const { start, end } = inputPatterns;
  const [step, setStep] = useState(0);

  // Add refs for 4x4 patterns
  const start4Ref = useRef(null);
  const end4Ref = useRef(null);
  const invStart4Ref = useRef(null);
  const invEnd4Ref = useRef(null);

  const start4 = generateSymmetric4x4(start);
  const end4 = generateSymmetric4x4(end);
  const inv_start4 = start4.map(row => row.map(cell => 1 - cell));
  const inv_end4 = end4.map(row => row.map(cell => 1 - cell));

  useEffect(() => {
    if (step < 5) {
      const timeout = setTimeout(() => setStep(step + 1), 500);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  // When "Continue" is clicked, capture positions
  const handleContinue = () => {
    const getPos = (ref) => ref.current?.getBoundingClientRect();
    onContinue(
      { start4, end4, inv_start4, inv_end4 },
      {
        start4: getPos(start4Ref),
        end4: getPos(end4Ref),
        inv_start4: getPos(invStart4Ref),
        inv_end4: getPos(invEnd4Ref),
      }
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
      {/* Input 1 */}
      {step >= 0 && <PatternGrid pattern={start} size={40} title="Input 1" />}
      {step >= 1 && (
        <div ref={start4Ref}>
          <PatternGrid pattern={start4} size={20} title="Symmetric 4x4" />
        </div>
      )}
      {step >= 2 && (
        <div ref={invStart4Ref}>
          <PatternGrid pattern={inv_start4} size={20} title="Inverse of Input 1" />
        </div>
      )}
      {/* Input 2 */}
      {step >= 3 && <PatternGrid pattern={end} size={40} title="Input 2" />}
      {step >= 4 && (
        <div ref={end4Ref}>
          <PatternGrid pattern={end4} size={20} title="Symmetric 4x4" />
        </div>
      )}
      {step >= 5 && (
        <div ref={invEnd4Ref}>
          <PatternGrid pattern={inv_end4} size={20} title="Inverse of Input 2" />
        </div>
      )}
      {step >= 5 && (
        <button style={{ marginLeft: 32 }} onClick={handleContinue}>
          Continue
        </button>
      )}
    </div>
  );
}

export default ShowSymmetry;
