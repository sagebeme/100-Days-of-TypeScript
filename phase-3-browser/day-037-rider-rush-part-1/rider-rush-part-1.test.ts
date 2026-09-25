// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WIDTH,
  HEIGHT,
  BASE_SPEED,
  SPAWN_EVERY,
  CAR_HEIGHT,
  laneCenter,
  createGame,
  steer,
  update,
  stepLoop,
  formatDistance,
  render,
  type GameState,
  type Pen,
} from "./starter/game.ts";
import { mountRiderRush } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const never = () => 0;

// A pretend canvas context that writes down what was drawn.
class RecordingPen implements Pen {
  calls: string[] = [];
  fillStyle: Pen["fillStyle"] = "";
  font = "";
  fillRect(x: number, y: number, w: number, h: number): void {
    this.calls.push(`fillRect ${x} ${y} ${w} ${h}`);
  }
  fillText(text: string, x: number, y: number): void {
    this.calls.push(`fillText ${text} ${x} ${y}`);
  }
}

// Stands in for requestAnimationFrame: frames only run when the test says so.
class FakeFrames {
  #waiting = new Map<number, (now: number) => void>();
  #nextId = 1;
  request = (callback: (now: number) => void): number => {
    const id = this.#nextId++;
    this.#waiting.set(id, callback);
    return id;
  };
  cancel = (id: number): void => {
    this.#waiting.delete(id);
  };
  get pending(): number {
    return this.#waiting.size;
  }
  run(now: number): void {
    const callbacks = [...this.#waiting.values()];
    this.#waiting.clear();
    for (const callback of callbacks) callback(now);
  }
}

const game = (overrides: Partial<GameState> = {}): GameState => ({ ...createGame(), ...overrides });

describe("laneCenter", () => {
  it("finds the middle of each lane", () => {
    expect([0, 1, 2].map(laneCenter)).toEqual([50, 150, 250]);
  });
});

describe("createGame", () => {
  it("starts in the middle lane with an empty road", () => {
    expect(createGame()).toEqual({ lane: 1, distance: 0, speed: BASE_SPEED, traffic: [], spawnIn: SPAWN_EVERY });
  });
});

describe("steer", () => {
  it("moves one lane left or right", () => {
    expect(steer(game(), "left").lane).toBe(0);
    expect(steer(game(), "right").lane).toBe(2);
  });

  it("never leaves the road", () => {
    expect(steer(game({ lane: 0 }), "left").lane).toBe(0);
    expect(steer(game({ lane: 2 }), "right").lane).toBe(2);
  });
});

describe("update", () => {
  it("moves the rider on by speed x time", () => {
    expect(update(game(), 0.5, never).distance).toBe(120);
  });

  it("moves every car down the screen", () => {
    const next = update(game({ traffic: [{ lane: 0, y: 100 }, { lane: 2, y: -50 }] }), 0.5, never);
    expect(next.traffic).toEqual([{ lane: 0, y: 220 }, { lane: 2, y: 70 }]);
  });

  it("removes cars that have left the bottom of the screen", () => {
    const next = update(game({ traffic: [{ lane: 0, y: HEIGHT - 10 }, { lane: 1, y: 0 }] }), 0.1, never);
    expect(next.traffic).toEqual([{ lane: 1, y: 24 }]);
  });

  it("counts down to the next car", () => {
    const next = update(game({ spawnIn: 1 }), 0.25, never);
    expect(next.spawnIn).toBeCloseTo(0.75);
    expect(next.traffic).toEqual([]);
  });

  it("spawns a car above the screen in a random lane when the countdown runs out", () => {
    const next = update(game({ spawnIn: 0.1 }), 0.25, () => 0.7);
    expect(next.traffic).toEqual([{ lane: 2, y: -CAR_HEIGHT }]);
    expect(next.spawnIn).toBeCloseTo(SPAWN_EVERY - 0.15);
  });

  it("does not change the state it was given", () => {
    const state = game({ traffic: [{ lane: 0, y: 100 }] });
    update(state, 0.5, never);
    expect(state).toEqual(game({ traffic: [{ lane: 0, y: 100 }] }));
  });
});

describe("stepLoop", () => {
  it("runs as many whole steps as fit and keeps the rest", () => {
    const result = stepLoop(0, 0.2, 0.0625);
    expect(result.steps).toBe(3);
    expect(result.accumulator).toBeCloseTo(0.0125);
  });

  it("carries leftover time into the next frame", () => {
    expect(stepLoop(0.1, 0.05, 0.125).steps).toBe(1);
    expect(stepLoop(0, 0.05, 0.125)).toEqual({ steps: 0, accumulator: 0.05 });
  });

  it("caps a long frame at MAX_FRAME", () => {
    expect(stepLoop(0, 10, 0.125)).toEqual({ steps: 2, accumulator: 0 });
  });

  it("uses 1/60 s steps by default", () => {
    expect(stepLoop(0, 1 / 60).steps).toBe(1);
  });
});

describe("formatDistance", () => {
  it.each([
    [0, "0 m"],
    [9, "0 m"],
    [1234, "123 m"],
    [50000, "5000 m"],
  ])("shows %d px as %s", (distance, expected) => {
    expect(formatDistance(distance)).toBe(expected);
  });
});

describe("render", () => {
  it("fills the whole road first", () => {
    const pen = new RecordingPen();
    render(pen, game());
    expect(pen.calls[0]).toBe(`fillRect 0 0 ${WIDTH} ${HEIGHT}`);
  });

  it("draws the cars, the rider and the distance", () => {
    const pen = new RecordingPen();
    render(pen, game({ lane: 2, distance: 1234, traffic: [{ lane: 0, y: 100 }] }));
    expect(pen.calls).toContain("fillRect 20 100 60 90");
    expect(pen.calls).toContain("fillRect 230 400 40 70");
    expect(pen.calls.some((call) => call.startsWith("fillText 123 m "))).toBe(true);
  });

  it("draws the rider after the cars, so the rider is on top", () => {
    const pen = new RecordingPen();
    render(pen, game({ traffic: [{ lane: 1, y: 380 }] }));
    expect(pen.calls.indexOf("fillRect 130 400 40 70")).toBeGreaterThan(pen.calls.indexOf("fillRect 120 380 60 90"));
  });

  it("slides the lane markings as the distance grows", () => {
    const at = (distance: number) => {
      const pen = new RecordingPen();
      render(pen, game({ distance }));
      return pen.calls;
    };
    expect(at(0)).toEqual(at(0));
    expect(at(10)).not.toEqual(at(0));
  });
});

describe("mountRiderRush", () => {
  let pen: RecordingPen;
  let frames: FakeFrames;
  let stop: () => void = () => {};

  beforeEach(() => {
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    pen = new RecordingPen();
    frames = new FakeFrames();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pen as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  const start = () => (stop = mountRiderRush(document, { random: never, requestFrame: frames.request, cancelFrame: frames.cancel }));
  const metres = () => Number.parseInt(document.querySelector("#distance")?.textContent ?? "", 10);

  // Plays `seconds` of game at `fps` frames per second, starting from t = 0 ms.
  function play(seconds: number, fps: number): void {
    for (let i = 0; i <= seconds * fps; i++) frames.run((i * 1000) / fps);
  }

  it("sizes the canvas and asks for the first frame", () => {
    start();
    const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
    expect(canvas.width).toBe(WIDTH);
    expect(canvas.height).toBe(HEIGHT);
    expect(frames.pending).toBe(1);
  });

  it("draws every frame and keeps asking for the next one", () => {
    start();
    frames.run(0);
    expect(pen.calls[0]).toBe(`fillRect 0 0 ${WIDTH} ${HEIGHT}`);
    expect(document.querySelector("#distance")?.textContent).toBe("0 m");
    expect(frames.pending).toBe(1);
  });

  it("covers about 24 m per second, whatever the frame rate", () => {
    start();
    play(2, 60);
    const at60 = metres();
    expect(at60).toBeGreaterThanOrEqual(47);
    expect(at60).toBeLessThanOrEqual(48);

    stop();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    frames = new FakeFrames();
    start();
    play(2, 144);
    expect(Math.abs(metres() - at60)).toBeLessThanOrEqual(1);
  });

  it("doesn't jump ahead after a long pause", () => {
    start();
    frames.run(0);
    frames.run(10_000);
    expect(metres()).toBeLessThanOrEqual(6);
  });

  it("steers with the arrow keys and A / D", () => {
    start();
    const left = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
    document.dispatchEvent(left);
    expect(left.defaultPrevented).toBe(true);
    frames.run(0);
    expect(pen.calls).toContain("fillRect 30 400 40 70");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    pen.calls = [];
    frames.run(16);
    expect(pen.calls).toContain("fillRect 230 400 40 70");
  });

  it("steers with the on-screen buttons", () => {
    start();
    document.querySelector("#left")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    frames.run(0);
    expect(pen.calls).toContain("fillRect 30 400 40 70");
  });

  it("leaves other keys alone", () => {
    start();
    const space = new KeyboardEvent("keydown", { key: " ", cancelable: true });
    document.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
  });

  it("stop() ends the loop and stops listening to keys", () => {
    start();
    stop();
    expect(frames.pending).toBe(0);
    const left = new KeyboardEvent("keydown", { key: "ArrowLeft", cancelable: true });
    document.dispatchEvent(left);
    expect(left.defaultPrevented).toBe(false);
  });

  it("throws a clear error when there's no 2D canvas", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(() => start()).toThrow("Canvas 2D is not supported here");
  });
});
