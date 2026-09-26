// Already written: puts the app on the page.
//   npx vite phase-6-fullstack-react/day-068-ticket-cart/starter
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./tikiti.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
