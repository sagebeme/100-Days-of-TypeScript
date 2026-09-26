import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Already written.
export default defineConfig({ plugins: [react()], build: { target: "es2022" } });
