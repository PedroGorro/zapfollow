// src/lib/analytics.js
export function track(eventName, props) {
  // Plausible usa window.plausible
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    if (props && Object.keys(props).length) {
      window.plausible(eventName, { props });
    } else {
      window.plausible(eventName);
    }
  }
}
