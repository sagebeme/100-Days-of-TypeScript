// The page: yours to design. Draw the world on the canvas every frame, and turn keys (and touches) into Keys.
//   npx vite phase-8-portfolio/day-093-space-shooter/starter
const ctx = (document.getElementById("canvas") as HTMLCanvasElement).getContext("2d")!;
ctx.fillStyle = "#020617";
ctx.fillRect(0, 0, 480, 640);
