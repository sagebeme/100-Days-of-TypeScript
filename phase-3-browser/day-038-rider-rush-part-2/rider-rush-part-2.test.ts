// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HEIGHT,
  RIDER_Y,
  CAR_HEIGHT,
  BASE_SPEED,
  MIN_SPAWN_EVERY,
  createGame,
  steer,
  update,
  overlaps,
  riderBox,
  carBox,
  levelFor,
  speedFor,
  spawnEveryFor,
  loadBest,
  saveBest,
  render,
  type GameState,
  type Pen,
} from "./starter/game.ts";
import { mountRiderRush, BEST_KEY } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const lane0 = () => 0;

class RecordingPen implements Pen {
  calls: string[] = [];
  fillStyle: Pen["fillStyle"] = "";
  font = "";
  textAlign: Pen["textAlign"] = "left";
  fillRect(x: number, y: number, w: number, h: number): void {
    this.calls.push(`fillRect ${x} ${y} ${w} ${h}`);
  }
  fillText(text: string): void {
    this.calls.push(`fillText ${text}`);
  }
}

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
  run(now: number): void {
    const callbacks = [...this.#waiting.values()];
    this.#waiting.clear();
    for (const callback of callbacks) callback(now);
  }
}

const game = (overrides: Partial<GameState> = {}): GameState => ({ ...createGame(), ...overrides });
const box = (x: number, y: number, width = 10, height = 10) => ({ x, y, width, height });

describe("overlaps", () => {
  it.each([
    ["overlapping corners", box(0, 0), box(5, 5), true],
    ["one inside the other", box(0, 0, 100, 100), box(40, 40), true],
    ["the same box", box(3, 3), box(3, 3), true],
    ["touching on the right edge", box(0, 0), box(10, 0), false],
    ["touching on the bottom edge", box(0, 0), box(0, 10), false],
    ["apart on x", box(0, 0), box(20, 0), false],
    ["apart on y", box(0, 0), box(0, 20), false],
    ["overlapping on x only", box(0, 0), box(5, 50), false],
  ])("%s", (_label, a, b, expected) => {
    expect(overlaps(a, b)).toBe(expected);
    expect(overlaps(b, a)).toBe(expected);
  });
});

describe("riderBox and carBox", () => {
  it("match what render draws", () => {
    expect(riderBox(game({ lane: 2 }))).toEqual({ x: 230, y: RIDER_Y, width: 40, height: 70 });
    expect(carBox({ lane: 0, y: 100 })).toEqual({ x: 20, y: 100, width: 60, height: CAR_HEIGHT });
  });
});

describe("levels", () => {
  it.each([
    [0, 1],
    [2999, 1],
    [3000, 2],
    [6500, 3],
  ])("distance %i is level %i", (distance, level) => {
    expect(levelFor(distance)).toBe(level);
  });

  it("speeds up by 40 px/s per level", () => {
    expect(speedFor(1)).toBe(BASE_SPEED);
    expect(speedFor(3)).toBe(320);
  });

  it("sends cars more often per level, down to a limit", () => {
    expect(spawnEveryFor(1)).toBeCloseTo(1.2);
    expect(spawnEveryFor(3)).toBeCloseTo(1.0);
    expect(spawnEveryFor(50)).toBe(MIN_SPAWN_EVERY);
  });
});

describe("update", () => {
  it("scores a point for every car that leaves the screen", () => {
    const state = game({ lane: 2, traffic: [{ lane: 0, y: HEIGHT - 5 }, { lane: 1, y: HEIGHT - 1 }, { lane: 0, y: 0 }] });
    const next = update(state, 0.1, lane0);
    expect(next.score).toBe(2);
    expect(next.traffic).toHaveLength(1);
  });

  it("levels up and speeds up as the distance grows", () => {
    const next = update(game({ distance: 2990, spawnIn: 99 }), 0.1, lane0);
    expect(next.level).toBe(2);
    expect(next.speed).toBe(280);
  });

  it("uses the level's spawn gap", () => {
    const next = update(game({ level: 3, distance: 6000, spawnIn: 0.01 }), 0.05, lane0);
    expect(next.spawnIn).toBeCloseTo(1.0 - 0.04);
  });

  it("crashes when a car hits the rider", () => {
    const next = update(game({ lane: 1, traffic: [{ lane: 1, y: RIDER_Y - CAR_HEIGHT - 1 }] }), 0.1, lane0);
    expect(next.status).toBe("over");
  });

  it("doesn't crash for a car in the next lane", () => {
    const next = update(game({ lane: 1, traffic: [{ lane: 0, y: RIDER_Y }] }), 0.1, lane0);
    expect(next.status).toBe("running");
  });

  it("freezes everything once the game is over", () => {
    const over = game({ status: "over", traffic: [{ lane: 1, y: RIDER_Y }] });
    expect(update(over, 0.5, lane0)).toBe(over);
  });
});

describe("steer", () => {
  it("does nothing once the game is over", () => {
    expect(steer(game({ status: "over" }), "left").lane).toBe(1);
    expect(steer(game(), "left").lane).toBe(0);
  });
});

describe("loadBest and saveBest", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads the best score", () => {
    expect(saveBest(localStorage, BEST_KEY, 17)).toBe(true);
    expect(localStorage.getItem(BEST_KEY)).toBe("17");
    expect(loadBest(localStorage, BEST_KEY)).toBe(17);
  });

  it.each([
    ["nothing saved", null],
    ["text", "lots"],
    ["a negative number", "-4"],
    ["a fraction", "2.5"],
  ])("loads 0 for %s", (_label, stored) => {
    if (stored !== null) localStorage.setItem(BEST_KEY, stored);
    expect(loadBest(localStorage, BEST_KEY)).toBe(0);
  });

  it("survives storage that throws", () => {
    const broken = {
      getItem: (): string | null => {
        throw new Error("SecurityError");
      },
      setItem: (): void => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(loadBest(broken, BEST_KEY)).toBe(0);
    expect(saveBest(broken, BEST_KEY, 5)).toBe(false);
  });
});

describe("render", () => {
  it("shows the level and the score", () => {
    const pen = new RecordingPen();
    render(pen, game({ level: 2, score: 7 }));
    expect(pen.calls).toContain("fillText Level 2");
    expect(pen.calls).toContain("fillText Score 7");
    expect(pen.calls).not.toContain("fillText Crashed!");
  });

  it("says Crashed! over a darkened road when the game is over", () => {
    const pen = new RecordingPen();
    render(pen, game({ status: "over" }));
    expect(pen.calls).toContain("fillText Crashed!");
    expect(pen.calls.filter((c) => c === "fillRect 0 0 300 500")).toHaveLength(2);
  });
});

describe("mountRiderRush", () => {
  let pen: RecordingPen;
  let frames: FakeFrames;
  let stop: () => void = () => {};
  let time: number;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    pen = new RecordingPen();
    frames = new FakeFrames();
    time = 0;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pen as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  function start(random: () => number, storage: Pick<Storage, "getItem" | "setItem"> = localStorage): void {
    stop = mountRiderRush(document, { random, requestFrame: frames.request, cancelFrame: frames.cancel, storage });
  }

  // Plays on for `seconds` at 60 frames per second.
  function play(seconds: number): void {
    const end = time + seconds * 1000;
    for (; time <= end; time += 1000 / 60) frames.run(time);
  }

  const text = (selector: string) => document.querySelector(selector)?.textContent;
  const restartButton = () => document.querySelector<HTMLButtonElement>("#restart")!;
  const key = (name: string) => {
    const event = new KeyboardEvent("keydown", { key: name, cancelable: true });
    document.dispatchEvent(event);
    return event;
  };

  // The first two cars come down lane 0 (dodged), the third comes straight at the rider in lane 1.
  function twoThenCrash(): () => number {
    let calls = 0;
    return () => (calls++ < 2 ? 0 : 0.5);
  }

  it("shows the saved best score", () => {
    localStorage.setItem(BEST_KEY, "12");
    start(lane0);
    play(0.1);
    expect(text("#best")).toBe("12");
    expect(text("#score")).toBe("0");
  });

  it("counts dodged cars in #score", () => {
    start(lane0);
    play(4);
    expect(text("#score")).toBe("1");
  });

  it("ends the ride on a crash and says the score", () => {
    localStorage.setItem(BEST_KEY, "12");
    start(twoThenCrash());
    play(6);
    expect(text("#message")).toBe("Crashed! Score 2. Best 12.");
    expect(restartButton().hidden).toBe(false);
    expect(document.activeElement).toBe(restartButton());
    expect(localStorage.getItem(BEST_KEY)).toBe("12");
  });

  it("saves a new best score, once", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    start(twoThenCrash(), storage);
    play(6);
    expect(text("#message")).toBe("Crashed! New best: 2.");
    expect(text("#best")).toBe("2");
    play(2);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(BEST_KEY, "2");
  });

  it("stops the world after a crash", () => {
    start(twoThenCrash());
    play(6);
    const distance = text("#distance");
    play(2);
    expect(text("#distance")).toBe(distance);
  });

  it("restarts with Space after a crash", () => {
    start(twoThenCrash());
    play(6);
    const space = key(" ");
    expect(space.defaultPrevented).toBe(true);
    expect(text("#message")).toBe("");
    expect(restartButton().hidden).toBe(true);
    play(0.05);
    expect(text("#score")).toBe("0");
    expect(text("#distance")).toBe("1 m");
  });

  it("restarts with the Ride again button", () => {
    start(twoThenCrash());
    play(6);
    restartButton().click();
    play(0.05);
    expect(restartButton().hidden).toBe(true);
    expect(text("#score")).toBe("0");
  });

  it("ignores Space while riding", () => {
    start(lane0);
    play(0.5);
    expect(key(" ").defaultPrevented).toBe(false);
  });
});
