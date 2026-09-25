// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createTimer, toggle, tick, reset, formatClock, type TimerState } from "./starter/timer.ts";
import { mountTimer } from "./starter/app.ts";

const settings = { focusMinutes: 25, breakMinutes: 5 };
const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");

function running(overrides: Partial<TimerState> = {}): TimerState {
  return { ...createTimer(settings), running: true, ...overrides };
}

describe("createTimer", () => {
  it("starts a paused focus session", () => {
    expect(createTimer(settings)).toEqual({ phase: "focus", secondsLeft: 1500, running: false, sessionsDone: 0 });
  });

  it("uses the settings", () => {
    expect(createTimer({ focusMinutes: 50, breakMinutes: 10 }).secondsLeft).toBe(3000);
  });
});

describe("toggle", () => {
  it("starts and pauses", () => {
    const started = toggle(createTimer(settings));
    expect(started.running).toBe(true);
    expect(toggle(started).running).toBe(false);
  });

  it("does not change the state it was given", () => {
    const state = createTimer(settings);
    toggle(state);
    expect(state.running).toBe(false);
  });
});

describe("tick", () => {
  it("takes a second off while running", () => {
    expect(tick(running(), settings).secondsLeft).toBe(1499);
  });

  it("does nothing while paused", () => {
    const paused = createTimer(settings);
    expect(tick(paused, settings)).toEqual(paused);
  });

  it("switches from focus to a break and counts the session", () => {
    const next = tick(running({ secondsLeft: 1 }), settings);
    expect(next).toEqual({ phase: "break", secondsLeft: 300, running: true, sessionsDone: 1 });
  });

  it("switches from a break back to focus without counting", () => {
    const next = tick(running({ phase: "break", secondsLeft: 1, sessionsDone: 3 }), settings);
    expect(next).toEqual({ phase: "focus", secondsLeft: 1500, running: true, sessionsDone: 3 });
  });

  it("does not change the state it was given", () => {
    const state = running();
    tick(state, settings);
    expect(state.secondsLeft).toBe(1500);
  });
});

describe("reset", () => {
  it("goes back to a paused focus session and keeps the session count", () => {
    const state = running({ phase: "break", secondsLeft: 42, sessionsDone: 2 });
    expect(reset(state, settings)).toEqual({ phase: "focus", secondsLeft: 1500, running: false, sessionsDone: 2 });
  });
});

describe("formatClock", () => {
  it.each([
    [1500, "25:00"],
    [249, "04:09"],
    [60, "01:00"],
    [9, "00:09"],
    [0, "00:00"],
  ])("formats %i seconds as %s", (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected);
  });
});

describe("mountTimer", () => {
  let stop: () => void = () => {};

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  const text = (selector: string) => document.querySelector(selector)?.textContent;
  const click = (selector: string) => document.querySelector<HTMLButtonElement>(selector)?.click();

  it("draws the starting state", () => {
    stop = mountTimer(document, settings);
    expect(text("#clock")).toBe("25:00");
    expect(text("#phase")).toBe("Focus");
    expect(text("#sessions")).toBe("0");
    expect(text("#start")).toBe("Start");
    expect(document.title).toBe("25:00 · Focus");
  });

  it("counts down once a second after Start", () => {
    stop = mountTimer(document, settings);
    click("#start");
    expect(text("#start")).toBe("Pause");
    vi.advanceTimersByTime(3000);
    expect(text("#clock")).toBe("24:57");
    expect(document.title).toBe("24:57 · Focus");
  });

  it("stops counting when paused", () => {
    stop = mountTimer(document, settings);
    click("#start");
    vi.advanceTimersByTime(2000);
    click("#start");
    vi.advanceTimersByTime(10_000);
    expect(text("#clock")).toBe("24:58");
    expect(text("#start")).toBe("Start");
  });

  it("does not double the speed after Start, Pause, Start", () => {
    stop = mountTimer(document, settings);
    click("#start");
    click("#start");
    click("#start");
    vi.advanceTimersByTime(5000);
    expect(text("#clock")).toBe("24:55");
  });

  it("moves to a break after a full focus session", () => {
    stop = mountTimer(document, settings);
    click("#start");
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(text("#phase")).toBe("Break");
    expect(text("#clock")).toBe("05:00");
    expect(text("#sessions")).toBe("1");
  });

  it("resets to a paused 25:00", () => {
    stop = mountTimer(document, settings);
    click("#start");
    vi.advanceTimersByTime(4000);
    click("#reset");
    vi.advanceTimersByTime(4000);
    expect(text("#clock")).toBe("25:00");
    expect(text("#start")).toBe("Start");
  });
});
