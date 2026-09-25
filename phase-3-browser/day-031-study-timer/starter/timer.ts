export type Phase = "focus" | "break";

export interface TimerSettings {
  focusMinutes: number;
  breakMinutes: number;
}

export interface TimerState {
  phase: Phase;
  secondsLeft: number;
  running: boolean;
  sessionsDone: number;
}

export function createTimer(settings: TimerSettings): TimerState {
  // TODO: a paused focus phase with focusMinutes * 60 seconds left and 0 sessions done
  throw new Error("not implemented yet");
}

export function toggle(state: TimerState): TimerState {
  // TODO: return a copy with `running` flipped
  throw new Error("not implemented yet");
}

export function tick(state: TimerState, settings: TimerSettings): TimerState {
  // TODO: paused -> return the state unchanged
  // TODO: take one second off
  // TODO: at 0, switch phase (focus -> break adds 1 to sessionsDone) and restart the clock
  throw new Error("not implemented yet");
}

export function reset(state: TimerState, settings: TimerSettings): TimerState {
  // TODO: a fresh, paused focus session that keeps sessionsDone
  throw new Error("not implemented yet");
}

export function formatClock(seconds: number): string {
  // TODO: 1500 -> "25:00", 249 -> "04:09"
  throw new Error("not implemented yet");
}
