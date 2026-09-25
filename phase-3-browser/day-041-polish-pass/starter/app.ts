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

export const BEST_KEY = "rider-rush-best";
export const MUTE_KEY = "rider-rush-muted";

export interface RiderRushOptions {
  random: () => number;
  requestFrame: (callback: (now: number) => void) => number;
  cancelFrame: (id: number) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
  openAudio: () => AudioOut;
  reducedMotion: boolean;
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

  // TODO: announce(text): put the text in #announcer (a live region: screen readers read it out)

  // TODO: syncControls(): one main button at a time.
  //   ready / over: #start shows ("Start" / "Ride again") and #pause is hidden.
  //   running / paused: #pause shows ("Pause" / "Resume") and #start is hidden.
  //   #mute gets aria-pressed="true" while muted. Also fill #distance, #score and #best.

  // TODO: react(events, bestBefore): play each event's sound, and announce its announcementFor text

  // TODO: frame(now), like Day 38, but:
  //   - only step while "running"; otherwise set the accumulator to 0 so resuming doesn't jump
  //   - after each update, a new best score is saved, then react(eventsBetween(before, state), bestBefore)
  //   - on a crash, if #pause had focus, move focus to #start (the button that replaced it)
  //   - render(pen, state, { reducedMotion }), syncControls(), and ask for the next frame

  // TODO: run(command): the one place every input ends up.
  //   steerLeft / steerRight -> steer
  //   start -> only from ready / over: start(state), accumulator 0, announce "Go!", and if #start had
  //            focus, move it to #pause
  //   pause -> togglePause, announce "Paused." or "Resumed."
  //   mute  -> flip it, saveMuted, announce "Sound off." or "Sound on."
  //   then syncControls()

  // TODO: onKey(event): commandForKey; ignore Space / Enter when a button has focus (the button
  //   handles them), ignore held-down repeats except for steering, preventDefault, run(command)

  // TODO: onVisibility(): when the tab is hidden while running, pause and announce "Paused."

  // TODO: canvas pointerdown remembers where; pointerup works out steerFromPointer and then:
  //   ready / over -> start, paused -> resume, running -> steer that way

  // TODO: listeners: keydown and visibilitychange on document; clicks on #start, #pause and #mute;
  //   pointerdown on #left / #right
  // TODO: syncControls(), start the loop, and return stop() (cancel the frame, remove both document listeners)
  throw new Error("not implemented yet");
}
