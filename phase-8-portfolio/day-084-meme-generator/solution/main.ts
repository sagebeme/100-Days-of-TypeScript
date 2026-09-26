import { layoutMeme, fileName, type Caption } from "./layout.ts";

// The page. Layout is in layout.ts; this draws it, and handles pictures and the download.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("canvas");
const ctx = canvas.getContext("2d")!;
const FONT = (size: number) => `${size}px Impact, "Anton", "Arial Black", "Helvetica Neue", sans-serif`;
const measure = (text: string, size: number) => ((ctx.font = FONT(size)), ctx.measureText(text).width);

// Backgrounds drawn in code: no copyrighted images, and they work offline.
type Painter = (c: CanvasRenderingContext2D, w: number, h: number) => void;
const BACKGROUNDS: { name: string; paint: Painter }[] = [
  {
    name: "Nairobi sunset",
    paint: (c, w, h) => {
      const sky = c.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#1e1b4b");
      sky.addColorStop(0.55, "#db2777");
      sky.addColorStop(1, "#f59e0b");
      c.fillStyle = sky;
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#fde68a";
      c.beginPath();
      c.arc(w * 0.5, h * 0.66, w * 0.14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#120c1f";
      let x = 0;
      let seed = 7;
      while (x < w) {
        seed = (seed * 9301 + 49297) % 233280;
        const bw = w * (0.05 + (seed / 233280) * 0.07);
        const bh = h * (0.12 + ((seed * 7) % 100) / 100 * 0.25);
        c.fillRect(x, h - bh - h * 0.12, bw + 1, bh + h * 0.12); // + 1: no gaps between buildings
        x += bw;
      }
    },
  },
  {
    name: "Matatu stripes",
    paint: (c, w, h) => {
      const colours = ["#facc15", "#16a34a", "#dc2626", "#111827", "#2563eb"];
      const band = h / 10;
      for (let i = 0; i < 12; i++) {
        c.fillStyle = colours[i % colours.length];
        c.beginPath();
        c.moveTo(-w, i * band * 1.2);
        c.lineTo(w * 2, i * band * 1.2 - w * 0.4);
        c.lineTo(w * 2, i * band * 1.2 - w * 0.4 + band);
        c.lineTo(-w, i * band * 1.2 + band);
        c.fill();
      }
    },
  },
  {
    name: "Savannah",
    paint: (c, w, h) => {
      const sky = c.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#7dd3fc");
      sky.addColorStop(0.62, "#fef3c7");
      sky.addColorStop(0.62, "#a16207");
      sky.addColorStop(1, "#713f12");
      c.fillStyle = sky;
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#1c1917";
      c.fillRect(w * 0.66, h * 0.4, w * 0.018, h * 0.22);
      c.beginPath();
      c.ellipse(w * 0.67, h * 0.4, w * 0.16, h * 0.045, 0, 0, Math.PI * 2);
      c.fill();
    },
  },
  {
    name: "Plain dark",
    paint: (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.75);
      g.addColorStop(0, "#3f3f46");
      g.addColorStop(1, "#09090b");
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    },
  },
];

let background: { kind: "painted"; index: number } | { kind: "photo"; image: HTMLImageElement } = { kind: "painted", index: 0 };

function captions(): Caption[] {
  return [
    { text: $<HTMLTextAreaElement>("top").value, position: "top" },
    { text: $<HTMLTextAreaElement>("bottom").value, position: "bottom" },
  ];
}

function draw(): void {
  if (background.kind === "photo") {
    // Keep the photo's shape, up to 1200 pixels on its longest side.
    const { naturalWidth: w, naturalHeight: h } = background.image;
    const scale = Math.min(1, 1200 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(background.image, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = 800;
    canvas.height = 800;
    BACKGROUNDS[background.index].paint(ctx, canvas.width, canvas.height);
  }
  const ink = (document.querySelector('input[name="ink"]:checked') as HTMLInputElement).value;
  const placed = layoutMeme(canvas, captions(), measure, $<HTMLInputElement>("caps").checked);
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const caption of placed) {
    ctx.font = FONT(caption.fontSize);
    ctx.lineWidth = Math.max(2, caption.fontSize / 8);
    ctx.strokeStyle = ink === "white" ? "#000" : "#fff";
    ctx.fillStyle = ink === "white" ? "#fff" : "#000";
    caption.lines.forEach((line, i) => {
      ctx.strokeText(line, caption.x, caption.y[i]);
      ctx.fillText(line, caption.x, caption.y[i]);
    });
  }
  canvas.setAttribute("aria-label", `Meme: ${captions().map((c) => c.text).filter(Boolean).join(" / ") || "no text yet"}`);
}

const picker = $("backgrounds");
BACKGROUNDS.forEach((bg, index) => {
  const thumb = document.createElement("canvas");
  thumb.width = thumb.height = 120;
  bg.paint(thumb.getContext("2d")!, 120, 120);
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", bg.name);
  button.setAttribute("aria-pressed", String(index === 0));
  button.style.backgroundImage = `url(${thumb.toDataURL()})`;
  button.addEventListener("click", () => {
    background = { kind: "painted", index };
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    draw();
  });
  picker.append(button);
});

$<HTMLInputElement>("upload").addEventListener("change", (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    background = { kind: "photo", image };
    picker.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    draw();
    URL.revokeObjectURL(image.src);
  };
  image.onerror = () => ($("note").textContent = "That file isn't a picture this browser can open.");
  image.src = URL.createObjectURL(file); // stays on the device: nothing is uploaded anywhere
});

$("controls").addEventListener("input", draw);
$("download").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: fileName(captions()) });
    link.click();
    URL.revokeObjectURL(link.href);
    $("note").textContent = `Saved ${link.download}`;
  }, "image/png");
});

document.fonts?.ready.then(draw);
draw();
