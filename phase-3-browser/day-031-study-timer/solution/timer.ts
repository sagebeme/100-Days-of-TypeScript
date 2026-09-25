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
  return { phase: "focus", secondsLeft: settings.focusMinutes * 60, running: false, sessionsDone: 0 };
}

export function toggle(state: TimerState): TimerState {
  return { ...state, running: !state.running };
}

export function tick(state: TimerState, settings: TimerSettings): TimerState {
  if (!state.running) {
    return state;
  }
  const secondsLeft = state.secondsLeft - 1;
  if (secondsLeft > 0) {
    return { ...state, secondsLeft };
  }
  if (state.phase === "focus") {
    return {
      ...state,
      phase: "break",
      secondsLeft: settings.breakMinutes * 60,
      sessionsDone: state.sessionsDone + 1,
    };
  }
  return { ...state, phase: "focus", secondsLeft: settings.focusMinutes * 60 };
}

export function reset(state: TimerState, settings: TimerSettings): TimerState {
  return { ...createTimer(settings), sessionsDone: state.sessionsDone };
}

export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
