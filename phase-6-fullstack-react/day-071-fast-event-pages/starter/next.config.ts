import type { NextConfig } from "next";
import { join } from "node:path";

// Already written. The repo's node_modules are three folders up; tell Next where the project root is.
//   npx next dev phase-6-fullstack-react/day-071-fast-event-pages/starter
const config: NextConfig = {
  turbopack: { root: join(import.meta.dirname, "../../..") },
};

export default config;
