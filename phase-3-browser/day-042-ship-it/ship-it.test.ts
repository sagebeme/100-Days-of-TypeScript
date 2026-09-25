// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { shareText, shareScore, shareMessage, type ShareTarget } from "./starter/share.ts";
import { mountRiderRush } from "./starter/app.ts";
import type { AudioOut } from "./starter/sound.ts";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const URL_ = "https://rider-rush.example/";

function abortError(): Error {
  const error = new Error("Share canceled");
  error.name = "AbortError";
  return error;
}

describe("shareText", () => {
  it("brags about the score", () => {
    expect(shareText(12)).toBe("I dodged 12 cars in Rider Rush. Can you beat me?");
    expect(shareText(1)).toBe("I dodged 1 car in Rider Rush. Can you beat me?");
  });
});

describe("shareScore", () => {
  it("uses the share sheet when there is one", async () => {
    const target = { share: vi.fn(async () => {}), clipboard: { writeText: vi.fn(async () => {}) } };
    await expect(shareScore(12, URL_, target)).resolves.toBe("shared");
    expect(target.share).toHaveBeenCalledWith({
      title: "Rider Rush",
      text: "I dodged 12 cars in Rider Rush. Can you beat me?",
      url: URL_,
    });
    expect(target.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("copies the text and link when there's no share sheet", async () => {
    const target = { clipboard: { writeText: vi.fn(async () => {}) } };
    await expect(shareScore(3, URL_, target)).resolves.toBe("copied");
    expect(target.clipboard.writeText).toHaveBeenCalledWith(`I dodged 3 cars in Rider Rush. Can you beat me? ${URL_}`);
  });

  it("treats closing the share sheet as a choice, not a failure", async () => {
    const target = {
      share: vi.fn(async () => {
        throw abortError();
      }),
      clipboard: { writeText: vi.fn(async () => {}) },
    };
    await expect(shareScore(3, URL_, target)).resolves.toBe("cancelled");
    expect(target.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("falls back to the clipboard when sharing breaks", async () => {
    const target = {
      share: async () => {
        throw new Error("NotAllowedError");
      },
      clipboard: { writeText: vi.fn(async () => {}) },
    };
    await expect(shareScore(3, URL_, target)).resolves.toBe("copied");
  });

  it("fails when nothing works", async () => {
    const refused = {
      clipboard: {
        writeText: async () => {
          throw new Error("NotAllowedError");
        },
      },
    };
    await expect(shareScore(3, URL_, refused)).resolves.toBe("failed");
    await expect(shareScore(3, URL_, {})).resolves.toBe("failed");
  });
});

describe("shareMessage", () => {
  it("only speaks up when the share sheet didn't", () => {
    expect(shareMessage("copied")).toBe("Link copied. Paste it to your friends!");
    expect(shareMessage("failed")).toBe("Couldn't share from here. Copy the link from the address bar instead.");
    expect(shareMessage("shared")).toBe("");
    expect(shareMessage("cancelled")).toBe("");
  });
});

describe("the Share button", () => {
  let stop: () => void = () => {};
  let frames: ((now: number) => void)[];
  let time: number;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    frames = [];
    time = 0;
    const pen = {
      fillStyle: "",
      font: "",
      textAlign: "left",
      fillRect() {},
      fillText() {},
      beginPath() {},
      roundRect() {},
      arc() {},
      fill() {},
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(pen as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  function mount(shareTarget: ShareTarget, random: () => number): void {
    stop = mountRiderRush(document, {
      random,
      requestFrame: (callback) => frames.push(callback),
      cancelFrame: () => {},
      storage: localStorage,
      openAudio: () => ({}) as AudioOut,
      reducedMotion: false,
      shareTarget,
      pageUrl: URL_,
    });
    // Mute, so the empty fake audio above is never used.
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
  }

  function play(seconds: number): void {
    const end = time + seconds * 1000;
    for (; time <= end; time += 1000 / 60) {
      const waiting = frames;
      frames = [];
      for (const frame of waiting) frame(time);
    }
  }

  // Two cars go past in lane 0, then one comes straight at the rider in lane 1.
  function twoThenCrash(): () => number {
    let calls = 0;
    return () => (calls++ < 2 ? 0 : 0.5);
  }

  const share = () => document.querySelector<HTMLButtonElement>("#share")!;
  const toast = () => document.querySelector("#toast")?.textContent;
  const space = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

  it("is hidden until you crash with a score", () => {
    mount({}, twoThenCrash());
    expect(share().hidden).toBe(true);
    space();
    play(3);
    expect(share().hidden).toBe(true);
    play(3);
    expect(share().hidden).toBe(false);
  });

  it("stays hidden after a crash with nothing to brag about", () => {
    mount({}, () => 0.5);
    space();
    play(4);
    expect(document.querySelector("#start")?.textContent).toBe("Ride again");
    expect(share().hidden).toBe(true);
  });

  it("shares your score and the page's address", async () => {
    const target = { share: vi.fn(async () => {}) };
    mount(target, twoThenCrash());
    space();
    play(6);
    share().click();
    await vi.waitFor(() => expect(target.share).toHaveBeenCalled());
    expect(target.share).toHaveBeenCalledWith({
      title: "Rider Rush",
      text: "I dodged 2 cars in Rider Rush. Can you beat me?",
      url: URL_,
    });
  });

  it("says when the link was copied, and clears it for the next ride", async () => {
    mount({ clipboard: { writeText: async () => {} } }, twoThenCrash());
    space();
    play(6);
    share().click();
    await vi.waitFor(() => expect(toast()).toBe("Link copied. Paste it to your friends!"));
    space();
    expect(toast()).toBe("");
  });
});
