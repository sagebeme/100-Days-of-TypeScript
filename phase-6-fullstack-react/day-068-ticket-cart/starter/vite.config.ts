import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Already written: the React plugin gives "fast refresh": save a component, and the page updates
// without reloading or losing what you'd typed.
export default defineConfig({ plugins: [react()] });
