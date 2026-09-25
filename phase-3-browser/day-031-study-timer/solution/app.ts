import { getElement } from "./dom.ts";
import { createTimer, toggle, tick, reset, formatClock, type TimerSettings } from "./timer.ts";

// Returns a function that stops the timer, so tests (and later, other code) can clean up.
export function mountTimer(root: ParentNode, settings: TimerSettings): () => void {
  const clock = getElement(root, "#clock", HTMLElement);
  const phase = getElement(root, "#phase", HTMLElement);
  const sessions = getElement(root, "#sessions", HTMLElement);
  const startButton = getElement(root, "#start", HTMLButtonElement);
  const resetButton = getElement(root, "#reset", HTMLButtonElement);

  let state = createTimer(settings);
  let interval: ReturnType<typeof setInterval> | undefined;

  function draw(): void {
    const time = formatClock(state.secondsLeft);
    const label = state.phase === "focus" ? "Focus" : "Break";
    clock.textContent = time;
    phase.textContent = label;
    sessions.textContent = String(state.sessionsDone);
    startButton.textContent = state.running ? "Pause" : "Start";
    document.title = `${time} · ${label}`;
  }

  function stop(): void {
    clearInterval(interval);
    interval = undefined;
  }

  startButton.addEventListener("click", () => {
    state = toggle(state);
    if (state.running) {
      interval = setInterval(() => {
        state = tick(state, settings);
        draw();
      }, 1000);
    } else {
      stop();
    }
    draw();
  });

  resetButton.addEventListener("click", () => {
    stop();
    state = reset(state, settings);
    draw();
  });

  draw();
  return stop;
}
