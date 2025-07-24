import React, { useRef, useEffect, useState } from "react";
import "./TerminalConsole.css";

/**
 * @param {Object[]} messages - List of message objects for the terminal.
 * @param {boolean} expand - If true, console expands to fill the window.
 * @param {Function} setConsoleMessages - Setter for updating messages (from App.js)
 */
export default function TerminalConsole({ messages, expand = false, setConsoleMessages }) {
  const bottomRef = useRef(null);
  const [inputLine, setInputLine] = useState("");
  const [inputActive, setInputActive] = useState(false);
  const inputRef = useRef();

  // Find the index of the last unhandled input-prompt
  const lastPromptIdx = messages
    .map((m, idx) => m.type === "input-prompt" && !m.handled ? idx : -1)
    .filter(idx => idx !== -1)
    .pop();

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Manage the input line activation and focus
  useEffect(() => {
    if (lastPromptIdx !== undefined && lastPromptIdx !== -1) {
      setInputActive(true);
      setInputLine(""); // clear input on new prompt
      if (inputRef.current) inputRef.current.focus();
    } else {
      setInputActive(false);
      setInputLine("");
    }
    // eslint-disable-next-line
  }, [lastPromptIdx]);

  function handleInputChange(e) {
    setInputLine(e.target.value);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && inputActive && setConsoleMessages) {
      // Mark the last active prompt as handled & record the input
      setConsoleMessages(msgs => {
        const updated = [...msgs];
        if (lastPromptIdx !== undefined && lastPromptIdx !== -1 && updated[lastPromptIdx]) {
          updated[lastPromptIdx] = {
            ...updated[lastPromptIdx],
            handled: true,
            entered: inputLine,
          };
        }
        return updated;
      });

      // Call the prompt's onInput if provided
      const lastPrompt = messages[lastPromptIdx];
      if (lastPrompt && typeof lastPrompt.onInput === "function") {
        lastPrompt.onInput(inputLine);
      }

      setInputLine("");
      setInputActive(false);
    }
  }

  return (
    <div className={"terminal-console-sticky" + (expand ? " terminal-console-overlay" : "")}>
      <div className="terminal-header">
        <b>Console</b>
        <hr />
      </div>
      <div className="terminal-messages">
        {messages.length === 0 && (
          <div className="terminal-empty">[No messages]</div>
        )}
        {messages.map((msg, i) => {
          if (msg.type === "input-prompt") {
            // Is this the active input line? (only last unhandled prompt)
            const isActivePrompt = i === lastPromptIdx;
            return (
              <div key={i} className="terminal-input-line">
                <span className="terminal-prompt">{msg.text || ">"}</span>{" "}
                <span className="terminal-userinput">
                  {isActivePrompt ? inputLine : msg.entered || ""}
                  {isActivePrompt && <span className="blinking-cursor">|</span>}
                </span>
                {isActivePrompt && (
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputLine}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="terminal-real-input"
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    tabIndex={0}
                    aria-label="Terminal Input"
                  />
                )}
                {isActivePrompt && (
                  <span className="terminal-tip">&nbsp;&lt;Press Enter to Submit&gt;</span>
                )}
              </div>
            );
          }
          return (
            <div
              key={i}
              className={
                msg.type === "error"
                  ? "terminal-message error"
                  : msg.type === "success"
                  ? "terminal-message success"
                  : "terminal-message"
              }
            >
              <span className="terminal-timestamp">{msg.timestamp}:</span>{" "}
              {msg.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
