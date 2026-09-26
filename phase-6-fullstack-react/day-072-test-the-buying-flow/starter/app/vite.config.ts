import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { testTicketingApi } from "./test-api.ts";

// Already written: Day 70's app, against an API the tests control (test-api.ts).
export default defineConfig({ plugins: [react(), testTicketingApi()] });
