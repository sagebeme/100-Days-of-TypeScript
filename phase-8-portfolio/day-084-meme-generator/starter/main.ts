// The page: yours to design. Draw a picture on the canvas, lay out the captions with layout.ts, and
// let people download the result.
//   npx vite phase-8-portfolio/day-084-meme-generator/starter
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#333";
ctx.fillRect(0, 0, canvas.width, canvas.height);
