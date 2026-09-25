import { mountSignup } from "./app.ts";

mountSignup(document, (signup) => {
  // No server yet (that's Phase 5), so the sign-up just goes to the console.
  console.log("New sign-up", signup);
});
