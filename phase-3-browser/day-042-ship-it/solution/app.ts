import { getElement } from "./dom.ts";
import {
  WIDTH,
  HEIGHT,
  FIXED_DT,
  createGame,
  start,
  togglePause,
  steer,
  update,
  eventsBetween,
  stepLoop,
  formatDistance,
  loadBest,
  saveBest,
  render,
  type GameEvent,
  type Pen,
} from "./game.ts";
import { createSfx, loadMuted, saveMuted, type AudioOut } from "./sound.ts";
import { commandForKey, steerFromPointer, announcementFor, type Command } from "./input.ts";
import { shareScore, shareMessage, type ShareTarget } from "./share.ts";

export const BEST_KEY = "rider-rush-best";
export const MUTE_KEY = "rider-rush-muted";

export interface RiderRushOptions {
  random: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (id: number) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
  openAudio: () => AudioOut;
  reducedMotion: boolean;
  shareTarget: ShareTarget;
  pageUrl: string;
}

// Returns stop(), which ends the loop and removes the document listeners.
export function mountRiderRush(root: ParentNode, options: RiderRushOptions): () => void {
  const canvas = getElement(root, "#game", HTMLCanvasElement);
  const distanceLabel = getElement(root, "#distance", HTMLElement);
  const scoreLabel = getElement(root, "#score", HTMLElement);
  const bestLabel = getElement(root, "#best", HTMLElement);
  const announcer = getElement(root, "#announcer", HTMLElement);
  const startButton = getElement(root, "#start", HTMLButtonElement);
  const pauseButton = getElement(root, "#pause", HTMLButtonElement);
  const muteButton = getElement(root, "#mute", HTMLButtonElement);
  const shareButton = getElement(root, "#share", HTMLButtonElement);
  const toast = getElement(root, "#toast", HTMLElement);
  const leftButton = getElement(root, "#left", HTMLButtonElement);
  const rightButton = getElement(root, "#right", HTMLButtonElement);

  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not supported here");
  }
  const pen: Pen = context;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let state = createGame();
  let best = loadBest(options.storage, BEST_KEY);
  const sfx = createSfx(options.openAudio, loadMuted(options.storage, MUTE_KEY));
  let accumulator = 0;
  let lastTime: number | undefined;
  let frameId = 0;
  let pointerStart: { x: number; y: number } | null = null;

  function announce(text: string): void {
    announcer.textContent = text;
  }

  function syncControls(): void {
    // One main button at a time, so the most useful action is always in the same place.
    const riding = state.status === "running" || state.status === "paused";
    startButton.hidden = riding;
    startButton.textContent = state.status === "over" ? "Ride again" : "Start";
    pauseButton.hidden = !riding;
    pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
    shareButton.hidden = !(state.status === "over" && state.score > 0);
    muteButton.setAttribute("aria-pressed", String(sfx.muted));
    distanceLabel.textContent = formatDistance(state.distance);
    scoreLabel.textContent = String(state.score);
    bestLabel.textContent = String(best);
  }

  function react(events: GameEvent[], bestBefore: number): void {
    for (const event of events) {
      sfx.play(event);
      const text = announcementFor(event, state, bestBefore);
      if (text !== null) announce(text);
    }
  }

  function frame(now: number): void {
    const frameSeconds = lastTime === undefined ? 0 : (now - lastTime) / 1000;
    lastTime = now;

    if (state.status === "running") {
      const loop = stepLoop(accumulator, frameSeconds);
      accumulator = loop.accumulator;
      for (let i = 0; i < loop.steps && state.status === "running"; i++) {
        const before = state;
        state = update(state, FIXED_DT, options.random);
        const bestBefore = best;
        if (state.status === "over" && state.score > best) {
          best = state.score;
          saveBest(options.storage, BEST_KEY, best);
        }
        react(eventsBetween(before, state), bestBefore);
        if (state.status === "over") {
          const hadFocus = document.activeElement === pauseButton;
          syncControls();
          if (hadFocus) startButton.focus(); // keep keyboard focus on the main button as it changes
        }
      }
    } else {
      accumulator = 0; // nothing builds up while paused, so resuming doesn't jump
    }

    render(pen, state, { reducedMotion: options.reducedMotion });
    syncControls();
    frameId = options.requestFrame(frame);
  }

  function run(command: Command): void {
    switch (command) {
      case "steerLeft":
        state = steer(state, "left");
        break;
      case "steerRight":
        state = steer(state, "right");
        break;
      case "start":
        if (state.status === "ready" || state.status === "over") {
          const hadFocus = document.activeElement === startButton;
          state = start(state);
          accumulator = 0;
          toast.textContent = "";
          announce("Go!");
          syncControls();
          if (hadFocus) pauseButton.focus(); // the Start button just hid itself
        }
        break;
      case "pause":
        state = togglePause(state);
        if (state.status === "paused") announce("Paused.");
        else if (state.status === "running") announce("Resumed.");
        break;
      case "mute":
        sfx.setMuted(!sfx.muted);
        saveMuted(options.storage, MUTE_KEY, sfx.muted);
        announce(sfx.muted ? "Sound off." : "Sound on.");
        break;
    }
    syncControls();
  }

  function onKey(event: KeyboardEvent): void {
    const command = commandForKey(event.key);
    if (command === null) return;
    // Space and Enter on a focused button should press that button, not start the game.
    if (command === "start" && event.target instanceof HTMLButtonElement) return;
    // Holding a key down repeats it; only steering should repeat.
    if (event.repeat && command !== "steerLeft" && command !== "steerRight") return;
    event.preventDefault();
    run(command);
  }

  function onVisibility(): void {
    if (document.hidden && state.status === "running") {
      state = togglePause(state);
      announce("Paused.");
      syncControls();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (pointerStart === null) return;
    const rect = canvas.getBoundingClientRect();
    const direction = steerFromPointer({
      dx: event.clientX - pointerStart.x,
      dy: event.clientY - pointerStart.y,
      x: event.clientX - rect.left,
      width: rect.width,
    });
    pointerStart = null;
    if (state.status === "ready" || state.status === "over") run("start");
    else if (state.status === "paused") run("pause");
    else if (direction !== null) run(direction === "left" ? "steerLeft" : "steerRight");
  });

  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
  startButton.addEventListener("click", () => run("start"));
  pauseButton.addEventListener("click", () => run("pause"));
  muteButton.addEventListener("click", () => run("mute"));
  shareButton.addEventListener("click", async () => {
    const result = await shareScore(state.score, options.pageUrl, options.shareTarget);
    toast.textContent = shareMessage(result);
  });
  leftButton.addEventListener("pointerdown", () => run("steerLeft"));
  rightButton.addEventListener("pointerdown", () => run("steerRight"));

  syncControls();
  frameId = options.requestFrame(frame);

  return () => {
    options.cancelFrame(frameId);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
