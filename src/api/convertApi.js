import { convertRegexClient } from "../algorithms/regexThompson.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const REQUEST_TIMEOUT_MS = 2500;

export class ConvertApiError extends Error {}

/**
 * Sends a pattern to the backend or computes it client-side.
 * Returns { regex, nfa, dfa }.
 */
export async function convertPattern(pattern) {
  // First attempt backend API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${API_BASE_URL}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regex: pattern }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // Backend unavailable, fallback to client-side engine
    console.warn("Backend API not reachable, falling back to client-side engine:", e);
  }

  // Client-side fallback engine
  try {
    return convertRegexClient(pattern);
  } catch (err) {
    throw new ConvertApiError(err.message || "Failed to parse regular expression.");
  }
}
