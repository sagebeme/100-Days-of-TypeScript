// Already written: sets the colours from tokens.ts as CSS variables, and shows the page.
//   npx vite phase-6-fullstack-react/day-073-cheap-phone-on-3g/starter
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TicketPage } from "./TicketPage.tsx";
import { light, dark, type Palette } from "./tokens.ts";
import "./style.css";

const dark_ = window.matchMedia("(prefers-color-scheme: dark)");
const apply = () => {
  const palette: Palette = dark_.matches ? dark : light;
  for (const [name, value] of Object.entries(palette)) document.documentElement.style.setProperty(`--${name}`, value);
};
apply();
dark_.addEventListener("change", apply);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TicketPage />
  </StrictMode>,
);
