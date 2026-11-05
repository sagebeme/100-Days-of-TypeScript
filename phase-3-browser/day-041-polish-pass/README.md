# Day 41: Polish Pass — Sound, Keyboard and Accessibility

Watch the video: *(not recorded yet)*

## The brief

Rider Rush works. Today it starts to feel finished. The gap between "works" and "feels good" is small details, and players notice every one:

- It opens on a **start screen** instead of dropping you into traffic.
- **Pause** with P or Esc, and it pauses by itself when you switch tabs.
- **Sound**: a blip for each car you dodge, a rising jingle when you level up, and a crunch when you crash. A **Mute** toggle, remembered for next time.
- **Touch**: swipe sideways, or tap the side of the road you want.
- **Screen readers** hear level-ups and crashes, but not every dodge, which would be noise.
- **Reduced motion**: the lane markings stop scrolling for people who've asked their system for less movement.
- **One main button** that always does the most useful thing: *Start*, *Pause*, *Resume*, *Ride again*.

`index.html` and `style.css` are redesigned for you: a dark "night ride" theme, stat tiles, keyboard help, and big steering buttons that only appear on touch screens. Read through them; the comments explain each choice.

## What you'll use

- A **state machine**: `"ready" | "running" | "paused" | "over"`, with small functions (`start`, `togglePause`) that are the only way between states
- **Events from state changes**: compare the state before and after an update to find out what happened (`eventsBetween`), instead of sprinkling sound code through the game logic
- The **Web Audio API**: an oscillator makes a tone, a gain node sets its volume and fades it out. Browsers only allow sound after the player has pressed something, so the audio is opened on the first sound, not on page load
- **Keyboard design**: one table (`KEYS`) maps keys to commands, every input (keys, buttons, taps) goes through one `run(command)`, and a focused button keeps its own Space and Enter
- `visibilitychange` and `document.hidden`, for pausing when the tab isn't visible
- `aria-live` announcements, `aria-pressed` for a toggle, and moving focus when the button you're on disappears

## Steps

1. Start the dev server:

   ```bash
   npm run dev -- phase-3-browser/day-041-polish-pass/starter
   ```

2. `starter/game.ts` is Day 38's game, restyled. Add the new states: `start`, `togglePause`, and make `update` and `steer` only work while `"running"`. Then write `eventsBetween` and `overlayText`, and finish the TODOs in `render` (the overlay, and still lane markings with reduced motion).
3. `starter/sound.ts`: `createSfx(openAudio, muted)` and the two storage helpers. The tones are already in `SOUNDS`; play each event's tones one after another.
4. `starter/input.ts`: `commandForKey`, `steerFromPointer` (a swipe, or a tap on one half) and `announcementFor`.
5. `starter/app.ts`: the element lookups and setup are done. Work through the TODOs in order. `run(command)` is the heart of it: keys, buttons and taps all end up there.
6. Run the tests:

   ```bash
   npm test -- day-041
   ```

7. Try it the way other people will:
   - Play with **only the keyboard**. Can you always see where focus is? Does Space ever do something surprising?
   - Turn on a **screen reader** (VoiceOver on a Mac or iPhone, TalkBack on Android, Narrator on Windows) and play a round.
   - Open DevTools, turn on **device emulation**, and play with touch.
   - Switch to another tab mid-ride, then come back.

## Check yourself

1. Why work out sounds and announcements with `eventsBetween(before, after)` instead of playing sounds inside `update`?
2. Predict the output: `togglePause(createGame()).status` and `start({ ...game, status: "paused" }).status`
3. Why is the audio opened on the first sound, not when the page loads?
4. Predict the output: `commandForKey("Escape")` and `commandForKey("toString")`

<details><summary>Answers</summary>

1. `update` stays a pure, silent function that tests can run thousands of times. Sound, screen-reader text and anything else just compare two states, so game logic and effects never get tangled.
2. `"ready"` both times. You can't pause a ride that hasn't started, and `start` does nothing while paused (that's `togglePause`'s job). Each function only allows its own moves between states.
3. Browsers block sound until the person has pressed something on the page. Opening it before that fails, or stays silent.
4. `"pause"` and `null`. `Object.hasOwn` ignores names every object inherits, like `toString`.

</details>

## When you're stuck

- **No sound at all** — the browser blocks sound until you've pressed something. Sounds only play after Start, and check Mute isn't on.
- **A click at the end of every sound** — a tone that stops at full volume clicks. Fade it with `exponentialRampToValueAtTime` (to `0.0001`; exponential ramps can't reach 0).
- **The game jumps forward after a pause** — time kept adding up while paused. Set the accumulator to 0 on every frame that isn't running.
- **Pressing Space on the Mute button starts the game** — your key handler caught it first. When a button has focus, leave Space and Enter to the button.
- **Keyboard focus disappears after pressing Start** — the button you were on just hid itself. Move focus to the button that replaced it.
- **The screen reader talks non-stop** — you're announcing dodges. Announce only what changes the player's situation.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
