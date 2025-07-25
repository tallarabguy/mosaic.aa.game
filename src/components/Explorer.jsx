import { useEffect, useRef, useState } from "react";

const script = [
  { text: "Welcome to the Pattern Explorer.", delay: 900 },

  { text: "This project is inspired by the deep logic and encodedness of traditional pattern making - think Palestinian tatreez or the precision of the Jacquard loom.", delay: 2400 },

  { text: "Patterns, in these traditions, are more than decoration - they are messages, memories, instructions for construction and records of culture woven into fabric.", delay: 2200 },

  { text: "Here, every geometric motif is the outcome of a logical transmission - a set of rules and moves that both enable and constrain what can be made.", delay: 1900 },

  { text: "The patterns you create and see here are both acts of calculation and acts of cultural transmission.", delay: 1800 },

  { text: "Each one encodes a tiny slice of a possible world - a memory of process, material and meaning.", delay: 1600 },

  { text: "Like artefacts from the past, these patterns hold transmissive power. Their forms preserve acts, intentions and even the failures that shape what endures.", delay: 2200 },

  { text: "But not all possible patterns can be realized. The machinery of logic allows only certain self-consistent constructions to emerge.", delay: 1800 },

  { text: "Your challenge: explore, play and try to unlock the hidden logic. Only a select set of combinations will result in valid, self-constitent patterns.", delay: 2000 },

  { text: "A clue to the puzzle can be revealed, if you enter the correct password. Can you decode the message?", delay: 1800 }
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
        logToConsole("Password accepted. Beginning clue transmission...", "success" );
        if (onDone) onDone(true);
      } else {
        logToConsole("Incorrect password. Try again.", "error");
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

