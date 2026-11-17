import React from "react";
import "./RegexInput.css";

export const MAX_PATTERN_LENGTH = 200;
const ALLOWED_PATTERN = /^[a-zA-Z0-9|*+?()]*$/;

const EXAMPLES = ["a(b|c)*d", "(a|b)*abb", "1(0|1)*", "ab?c+"];

/**
 * Checks a pattern against the same allow-list the backend enforces,
 * so the user gets instant feedback instead of a round trip for
 * obviously invalid input. The backend re-validates independently —
 * this is a UX convenience, not the security boundary.
 */
export function validatePattern(pattern) {
  if (!pattern.trim()) return "Enter a pattern to convert.";
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return `Pattern is too long (max ${MAX_PATTERN_LENGTH} characters).`;
  }
  if (!ALLOWED_PATTERN.test(pattern)) {
    return "Only letters, digits, | * + ? ( ) are supported.";
  }
  return null;
}

export default function RegexInput({ value, onChange, onSubmit, isLoading }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form className="regex-input" onSubmit={handleSubmit}>
      <label htmlFor="pattern" className="regex-input__label">
        Pattern
      </label>
      <div className="regex-input__row">
        <input
          id="pattern"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck="false"
          maxLength={MAX_PATTERN_LENGTH}
          placeholder="a(b|c)*d"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="regex-input__field"
        />
        <button type="submit" className="regex-input__submit" disabled={isLoading}>
          {isLoading ? "Building…" : "Build automata"}
        </button>
      </div>
      <div className="regex-input__examples">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="regex-input__chip"
            onClick={() => onChange(ex)}
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}
