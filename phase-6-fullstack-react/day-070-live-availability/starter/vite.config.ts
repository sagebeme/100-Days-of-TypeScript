import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fakeTicketingApi } from "./fake-api.ts";

// Already written: React, plus a pretend API that behaves like a busy real one (see fake-api.ts).
export default defineConfig({ plugins: [react(), fakeTicketingApi()] });
