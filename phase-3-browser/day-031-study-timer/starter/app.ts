import { getElement } from "./dom.ts";
import { createTimer, toggle, tick, reset, formatClock, type TimerSettings } from "./timer.ts";

// Returns a function that stops the timer, so tests (and later, other code) can clean up.
export function mountTimer(root: ParentNode, settings: TimerSettings): () => void {
  // TODO: find #clock, #phase, #sessions (any element works: use HTMLElement), #start and #reset (HTMLButtonElement)
  // TODO: let state = createTimer(settings)
  // TODO: let interval: ReturnType<typeof setInterval> | undefined

  // TODO: draw(): #clock, #phase ("Focus" / "Break"), #sessions, #start ("Start" / "Pause"),
  //       and document.title = "24:59 · Focus"

  // TODO: #start click: toggle; if now running, setInterval(() => { tick; draw }, 1000), else clear it
  // TODO: #reset click: reset, clear the interval, draw

  // TODO: draw once now, then return a function that clears the interval
  throw new Error("not implemented yet");
}
