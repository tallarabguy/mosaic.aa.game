import { useEffect, useRef, useState } from "react";

const script = [
  { text: "Welcome to the Pattern Explorer!", delay: 600 },
  { text: "This interactive app lets you construct, analyse, and understand the logic of symmetric pattern generation.", delay: 1700 },
  { text: "All the processes you see here—from margin construction to transmission—are visual, logical, and auditable.", delay: 1500 },
  { text: "As you proceed, you'll see each step, along with the underlying algorithmic decisions, directly in this console.", delay: 1600 },
  { text: "Try creating a new pattern or explore solvability to see how the underlying logic works!", delay: 1500 }
];

const PASSWORD = "recursion"; // <--- Set your password here

function markLastPromptHandled(enteredValue) {
  setConsoleMessages(msgs => {
    const idx = msgs.map(m => m.type).lastIndexOf("input-prompt");
    if (idx === -1) return msgs;
    const updated = [...msgs];
    updated[idx] = { ...updated[idx], handled: true, entered: enteredValue };
    return updated;
  });
}


export default function ExploreNarrator({ logToConsole, onDone }) {
  useEffect(() => {
    let i = 0;
    let typingTimeout, messageTimeout;
    let isUnmounted = false;

    function typeMessage(str, idx, onTyped) {
      let char = 0;
      function typeNext() {
        if (isUnmounted) return;
        if (char === 0) {
          logToConsole("", { type: "typing" });
        }
        if (char <= str.length) {
          logToConsole(str.slice(0, char), { overwrite: true, type: "typing" });
          char++;
          typingTimeout = setTimeout(typeNext, 18 + Math.random() * 40);
        } else {
          logToConsole(str, { overwrite: true });
          if (onTyped) onTyped();
        }
      }
      typeNext();
    }

    function handlePassword(inputValue) {
      logToConsole(`> ${inputValue}`, { type: "input" });
      if (inputValue.trim().toLowerCase() === PASSWORD) {
        logToConsole("Password accepted. Welcome, explorer!", { type: "success" });
        if (onDone) onDone(true);
      } else {
        logToConsole("Incorrect password. Try again.", { type: "error" });
        logToConsole("Enter password to continue:", {
          type: "input-prompt",
          onInput: handlePassword
        });
      }
    }

    function next() {
      if (i >= script.length) {
        logToConsole("Enter password to continue:", {
          type: "input-prompt",
          onInput: handlePassword
        });
        return;
      }
      typeMessage(script[i].text, i, () => {
        messageTimeout = setTimeout(next, 50);
        i++;
      });
    }

    next();
    return () => {
      isUnmounted = true;
      clearTimeout(typingTimeout);
      clearTimeout(messageTimeout);
    };
    // eslint-disable-next-line
  }, []);

  return null; // This component is non-visual.
}

