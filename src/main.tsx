import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Remove splash screen with smooth handoff
// Delay ensures React background is painted before splash fades
const splash = document.getElementById('splash');
if (splash) {
  // Wait for first paint cycle to ensure React content is visible
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      splash.style.transition = 'opacity 0.4s ease-out';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 400);
    });
  });
}
