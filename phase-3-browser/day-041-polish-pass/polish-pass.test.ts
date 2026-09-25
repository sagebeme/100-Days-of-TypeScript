// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createGame,
  start,
  togglePause,
  steer,
  update,
  eventsBetween,
  overlayText,
  render,
  RIDER_Y,
  CAR_HEIGHT,
  type GameState,
  type Pen,
} from "./starter/game.ts";
import { SOUNDS, createSfx, loadMuted, saveMuted, type AudioOut } from "./starter/sound.ts";
import { commandForKey, steerFromPointer, announcementFor, SWIPE_DISTANCE } from "./starter/input.ts";
import { mountRiderRush, BEST_KEY, MUTE_KEY } from "./starter/app.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const lane0 = () => 0;
const game = (overrides: Partial<GameState> = {}): GameState => ({ ...createGame(), ...overrides });
const running = (overrides: Partial<GameState> = {}) => game({ status: "running", ...overrides });

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
  beginPath(): void {}
  roundRect(x: number, y: number, w: number, h: number): void {
    this.calls.push(`roundRect ${x} ${y} ${w} ${h}`);
  }
  arc(): void {}
  fill(): void {}
  texts(): string[] {
    return this.calls.filter((c) => c.startsWith("fillText ")).map((c) => c.slice(9));
  }
}

// A pretend AudioContext that writes down every tone instead of playing it.
function fakeAudio() {
  const tones: { frequency: number; wave: string; start: number; stop: number; toSpeakers: boolean }[] = [];
  const destination = { name: "speakers" };
  const out = {
    currentTime: 10,
    destination,
    createOscillator() {
      const tone = { frequency: 0, wave: "", start: 0, stop: 0, toSpeakers: false };
      const gainNode = { connect: (node: unknown) => ((tone.toSpeakers = node === destination), node) };
      return {
        set type(value: string) {
          tone.wave = value;
        },
        frequency: { setValueAtTime: (value: number) => (tone.frequency = value) },
        connect: () => gainNode, // oscillator -> gain; the gain then connects to the speakers
        start: (at: number) => (tone.start = at),
        stop: (at: number) => {
          tone.stop = at;
          tones.push(tone);
        },
      };
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (node: unknown) => node };
    },
  };
  return { out: out as unknown as AudioOut, tones };
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
  get pending(): number {
    return this.#waiting.size;
  }
  run(now: number): void {
    const callbacks = [...this.#waiting.values()];
    this.#waiting.clear();
    for (const callback of callbacks) callback(now);
  }
}

describe("the game's states", () => {
  it("waits on a start screen", () => {
    expect(createGame().status).toBe("ready");
  });

  it("starts from the start screen", () => {
    expect(start(game()).status).toBe("running");
  });

  it("starts a brand new game after a crash", () => {
    const next = start(game({ status: "over", score: 9, distance: 5000, lane: 0 }));
    expect(next).toEqual({ ...createGame(), status: "running" });
  });

  it("ignores start while riding or paused", () => {
    const ride = running({ score: 3 });
    expect(start(ride)).toBe(ride);
    const paused = game({ status: "paused" });
    expect(start(paused)).toBe(paused);
  });

  it("pauses and resumes", () => {
    expect(togglePause(running()).status).toBe("paused");
    expect(togglePause(game({ status: "paused" })).status).toBe("running");
  });

  it("can't pause the start screen or a crash", () => {
    const ready = game();
    expect(togglePause(ready)).toBe(ready);
    const over = game({ status: "over" });
    expect(togglePause(over)).toBe(over);
  });

  it("only moves and steers while running", () => {
    for (const status of ["ready", "paused", "over"] as const) {
      const state = game({ status, traffic: [{ lane: 0, y: 0 }] });
      expect(update(state, 0.5, lane0)).toBe(state);
      expect(steer(state, "left")).toBe(state);
    }
    expect(steer(running(), "left").lane).toBe(0);
  });
});

describe("eventsBetween", () => {
  it("notices a dodge, a level up and a crash", () => {
    expect(eventsBetween(running(), running({ score: 1 }))).toEqual(["dodge"]);
    expect(eventsBetween(running(), running({ level: 2 }))).toEqual(["levelUp"]);
    expect(eventsBetween(running(), game({ status: "over" }))).toEqual(["crash"]);
  });

  it("can report several at once, in order", () => {
    expect(eventsBetween(running(), game({ status: "over", score: 1, level: 2 }))).toEqual([
      "dodge",
      "levelUp",
      "crash",
    ]);
  });

  it("reports a crash only once", () => {
    expect(eventsBetween(game({ status: "over" }), game({ status: "over" }))).toEqual([]);
    expect(eventsBetween(running(), running())).toEqual([]);
  });

  it("matches what update does", () => {
    const before = running({ lane: 1, traffic: [{ lane: 1, y: RIDER_Y - CAR_HEIGHT - 1 }] });
    expect(eventsBetween(before, update(before, 0.1, lane0))).toEqual(["crash"]);
  });
});

describe("overlayText and render", () => {
  it("has words for every screen except the ride itself", () => {
    expect(overlayText(game())).toEqual({ title: "Rider Rush", hint: "Press Space or tap Start" });
    expect(overlayText(game({ status: "paused" }))).toEqual({ title: "Paused", hint: "Press P or tap Resume" });
    expect(overlayText(game({ status: "over" }))).toEqual({ title: "Crashed!", hint: "Press Space to ride again" });
    expect(overlayText(running())).toBeNull();
  });

  it("draws the overlay on top of the road", () => {
    const pen = new RecordingPen();
    render(pen, game({ status: "paused" }), { reducedMotion: false });
    expect(pen.texts()).toEqual(["Level 1", "Paused", "Press P or tap Resume"]);
    const plain = new RecordingPen();
    render(plain, running(), { reducedMotion: false });
    expect(plain.texts()).toEqual(["Level 1"]);
  });

  it("keeps the lane markings still with reduced motion", () => {
    const at = (distance: number, reducedMotion: boolean) => {
      const pen = new RecordingPen();
      render(pen, running({ distance }), { reducedMotion });
      return pen.calls;
    };
    expect(at(10, false)).not.toEqual(at(0, false));
    expect(at(10, true)).toEqual(at(0, true));
  });
});

describe("sound", () => {
  it("plays each tone of an event one after the other, to the speakers", () => {
    const audio = fakeAudio();
    createSfx(() => audio.out, false).play("levelUp");
    const expected = SOUNDS.levelUp;
    expect(audio.tones.map((t) => t.frequency)).toEqual(expected.map((t) => t.frequency));
    expect(audio.tones.map((t) => t.wave)).toEqual(expected.map((t) => t.wave));
    expect(audio.tones[0].start).toBe(10);
    expect(audio.tones[1].start).toBeCloseTo(10 + expected[0].duration);
    expect(audio.tones[2].stop).toBeCloseTo(10 + expected[0].duration + expected[1].duration + expected[2].duration);
    expect(audio.tones.every((t) => t.toSpeakers)).toBe(true);
  });

  it("doesn't open the audio until the first sound", () => {
    const openAudio = vi.fn(() => fakeAudio().out);
    const sfx = createSfx(openAudio, false);
    expect(openAudio).not.toHaveBeenCalled();
    sfx.play("dodge");
    sfx.play("dodge");
    expect(openAudio).toHaveBeenCalledTimes(1);
  });

  it("stays silent while muted", () => {
    const openAudio = vi.fn(() => fakeAudio().out);
    const sfx = createSfx(openAudio, true);
    sfx.play("crash");
    expect(openAudio).not.toHaveBeenCalled();
    expect(sfx.muted).toBe(true);
    sfx.setMuted(false);
    sfx.play("crash");
    expect(openAudio).toHaveBeenCalledTimes(1);
  });

  it("remembers the mute setting", () => {
    localStorage.clear();
    expect(loadMuted(localStorage, MUTE_KEY)).toBe(false);
    saveMuted(localStorage, MUTE_KEY, true);
    expect(localStorage.getItem(MUTE_KEY)).toBe("true");
    expect(loadMuted(localStorage, MUTE_KEY)).toBe(true);
    localStorage.setItem(MUTE_KEY, "yes please");
    expect(loadMuted(localStorage, MUTE_KEY)).toBe(false);
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
    expect(loadMuted(broken, MUTE_KEY)).toBe(false);
    expect(() => saveMuted(broken, MUTE_KEY, true)).not.toThrow();
  });
});

describe("input", () => {
  it.each([
    ["ArrowLeft", "steerLeft"],
    ["a", "steerLeft"],
    ["D", "steerRight"],
    [" ", "start"],
    ["Enter", "start"],
    ["p", "pause"],
    ["Escape", "pause"],
    ["m", "mute"],
  ])("maps %j to %s", (key, command) => {
    expect(commandForKey(key)).toBe(command);
  });

  it.each(["x", "Tab", "toString", "constructor"])("ignores %j", (key) => {
    expect(commandForKey(key)).toBeNull();
  });

  it("steers with a sideways swipe", () => {
    expect(steerFromPointer({ dx: -SWIPE_DISTANCE, dy: 5, x: 250, width: 300 })).toBe("left");
    expect(steerFromPointer({ dx: 80, dy: -20, x: 10, width: 300 })).toBe("right");
  });

  it("steers towards the side you tap", () => {
    expect(steerFromPointer({ dx: 2, dy: 3, x: 60, width: 300 })).toBe("left");
    expect(steerFromPointer({ dx: 0, dy: 0, x: 200, width: 300 })).toBe("right");
  });

  it("ignores swipes up or down, and taps it can't place", () => {
    expect(steerFromPointer({ dx: 20, dy: 90, x: 60, width: 300 })).toBeNull();
    expect(steerFromPointer({ dx: 0, dy: 0, x: 0, width: 0 })).toBeNull();
  });

  it("announces level ups and crashes, but not every dodge", () => {
    expect(announcementFor("levelUp", running({ level: 3 }), 0)).toBe("Level 3. Traffic is faster.");
    expect(announcementFor("crash", game({ status: "over", score: 12 }), 7)).toBe("Crashed. New best score: 12.");
    expect(announcementFor("crash", game({ status: "over", score: 7 }), 12)).toBe("Crashed. Score 7. Best 12.");
    expect(announcementFor("crash", game({ status: "over", score: 12 }), 12)).toBe("Crashed. Score 12. Best 12.");
    expect(announcementFor("dodge", running({ score: 4 }), 0)).toBeNull();
  });
});

describe("mountRiderRush", () => {
  let pen: RecordingPen;
  let frames: FakeFrames;
  let audio: ReturnType<typeof fakeAudio>;
  let stop: () => void = () => {};
  let time: number;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    pen = new RecordingPen();
    frames = new FakeFrames();
    audio = fakeAudio();
    time = 0;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pen as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  function mount(random: () => number = lane0, reducedMotion = false): void {
    stop = mountRiderRush(document, {
      random,
      requestFrame: frames.request,
      cancelFrame: frames.cancel,
      storage: localStorage,
      openAudio: () => audio.out,
      reducedMotion,
    });
  }

  function play(seconds: number): void {
    const end = time + seconds * 1000;
    for (; time <= end; time += 1000 / 60) frames.run(time);
  }

  const el = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const text = (selector: string) => el(selector).textContent?.trim();
  const metres = () => Number.parseInt(text("#distance") ?? "", 10);
  const key = (name: string, init: KeyboardEventInit = {}, target: EventTarget = document) => {
    const event = new KeyboardEvent("keydown", { key: name, cancelable: true, bubbles: true, ...init });
    target.dispatchEvent(event);
    return event;
  };
  const lastFrameTexts = () => {
    pen.calls = [];
    play(0.02);
    return pen.texts();
  };

  // First two cars come down lane 0 (dodged); the third comes straight at the rider in lane 1.
  function twoThenCrash(): () => number {
    let calls = 0;
    return () => (calls++ < 2 ? 0 : 0.5);
  }

  it("opens on the start screen and waits", () => {
    mount();
    play(2);
    expect(metres()).toBe(0);
    expect(lastFrameTexts()).toContain("Rider Rush");
    expect(el("#start").hidden).toBe(false);
    expect(text("#start")).toBe("Start");
    expect(el("#pause").hidden).toBe(true);
  });

  it("starts with Space, and the main button becomes Pause", () => {
    mount();
    play(0.1);
    expect(key(" ").defaultPrevented).toBe(true);
    expect(text("#announcer")).toBe("Go!");
    play(1);
    expect(metres()).toBeGreaterThan(20);
    expect(el("#start").hidden).toBe(true);
    expect(el("#pause").hidden).toBe(false);
    expect(text("#pause")).toBe("Pause");
  });

  it("starts with the Start button and moves focus to Pause", () => {
    mount();
    el<HTMLButtonElement>("#start").focus();
    el<HTMLButtonElement>("#start").click();
    expect(document.activeElement).toBe(el("#pause"));
  });

  it("lets a focused button handle its own Space", () => {
    mount();
    el<HTMLButtonElement>("#mute").focus();
    const space = key(" ", {}, el("#mute"));
    expect(space.defaultPrevented).toBe(false);
    expect(el("#start").hidden).toBe(false);
  });

  it("pauses with P, freezes the road, and resumes without a jump", () => {
    mount();
    key(" ");
    play(1);
    key("p");
    expect(text("#announcer")).toBe("Paused.");
    expect(text("#pause")).toBe("Resume");
    const frozen = metres();
    play(5);
    expect(metres()).toBe(frozen);
    expect(lastFrameTexts()).toContain("Paused");

    key("P");
    expect(text("#announcer")).toBe("Resumed.");
    play(0.5);
    expect(metres() - frozen).toBeLessThanOrEqual(13);
  });

  it("ignores a held-down P", () => {
    mount();
    key(" ");
    play(0.2);
    key("p", { repeat: true });
    expect(text("#pause")).toBe("Pause");
  });

  it("pauses by itself when you switch tabs", () => {
    mount();
    key(" ");
    play(0.5);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    hidden.mockRestore();
    expect(text("#pause")).toBe("Resume");
    expect(text("#announcer")).toBe("Paused.");
  });

  it("plays a sound for each dodge", () => {
    mount();
    key(" ");
    play(4);
    expect(audio.tones.some((t) => t.frequency === SOUNDS.dodge[0].frequency)).toBe(true);
  });

  it("mutes with M, remembers it, and stays quiet", () => {
    mount();
    key("m");
    expect(el("#mute").getAttribute("aria-pressed")).toBe("true");
    expect(text("#announcer")).toBe("Sound off.");
    expect(localStorage.getItem(MUTE_KEY)).toBe("true");
    key(" ");
    play(4);
    expect(audio.tones).toEqual([]);
  });

  it("starts muted if you muted it last time", () => {
    localStorage.setItem(MUTE_KEY, "true");
    mount();
    expect(el("#mute").getAttribute("aria-pressed")).toBe("true");
  });

  it("crashes with a sound, an announcement and a Ride again button", () => {
    localStorage.setItem(BEST_KEY, "1");
    mount(twoThenCrash());
    key(" ");
    play(6);
    expect(text("#announcer")).toBe("Crashed. New best score: 2.");
    expect(audio.tones.some((t) => t.frequency === SOUNDS.crash[0].frequency)).toBe(true);
    expect(localStorage.getItem(BEST_KEY)).toBe("2");
    expect(text("#best")).toBe("2");
    expect(el("#start").hidden).toBe(false);
    expect(text("#start")).toBe("Ride again");
    expect(el("#pause").hidden).toBe(true);
    expect(lastFrameTexts()).toContain("Crashed!");
  });

  it("rides again with Space after a crash", () => {
    mount(twoThenCrash());
    key(" ");
    play(6);
    key(" ");
    play(0.1);
    expect(text("#score")).toBe("0");
    expect(el("#pause").hidden).toBe(false);
  });

  it("announces a level up", () => {
    mount(lane0);
    key(" ");
    play(13);
    expect(text("#announcer")).toBe("Level 2. Traffic is faster.");
  });

  it("steers with a swipe, and starts with a tap", () => {
    mount();
    const canvas = el("#game");
    const pointer = (type: string, clientX: number) =>
      canvas.dispatchEvent(new PointerEvent(type, { clientX, clientY: 100, bubbles: true }));

    pointer("pointerdown", 150);
    pointer("pointerup", 150);
    expect(el("#pause").hidden).toBe(false); // the tap started the ride

    pointer("pointerdown", 150);
    pointer("pointerup", 80);
    pen.calls = [];
    play(0.02);
    expect(pen.calls).toContain("roundRect 41 408 18 62"); // the motorbike, now in lane 0
  });

  it("stop() ends the loop and stops listening", () => {
    mount();
    stop();
    expect(frames.pending).toBe(0);
    expect(key(" ").defaultPrevented).toBe(false);
  });
});
