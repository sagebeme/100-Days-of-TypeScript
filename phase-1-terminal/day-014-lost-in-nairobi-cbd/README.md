# Day 14: Lost in Nairobi CBD — Phase 1 Capstone

Watch the video: *(not recorded yet)*

## The brief

Build the engine and the map of a text adventure. You've just stepped off a matatu in the CBD and you need to get to Uhuru Park without ending up on the wrong bus to Rongai.

The world is data: a set of rooms, each with a description and exits that point at other rooms. The engine is two small functions: `move` walks between rooms and `isEnding` says whether the game is over.

```
move(nairobiCbdWorld, "bus-stage", "north")           →  "tom-mboya-street"
move(nairobiCbdWorld, "bus-stage", "west")            →  "bus-stage"   (no exit that way, you stay put)
isEnding(nairobiCbdWorld, "uhuru-park")               →  true
```

This day pulls together everything from Phase 1: types, objects, functions, conditionals, and modules.

## What you'll use

- `type` for the shapes: a `Room` is an object with an `id`, a `description`, `exits`, and an optional `isEnding`
- `Record<string, Room>` for the world: an object whose keys are room ids and whose values are rooms
- Looking things up by key: `world[roomId]`, `room.exits[direction]`
- `throw new Error(...)` for a room id that doesn't exist

## Steps

1. Open `starter/nairobi-cbd.ts`. The `Room` and `World` types are already written. Read them until you understand what each field is for.
2. Fill in `nairobiCbdWorld`. The tests need at least these rooms:

   | Room id | Exits | Notes |
   | --- | --- | --- |
   | `bus-stage` | north → `tom-mboya-street` | where you start; not an ending |
   | `tom-mboya-street` | south → `bus-stage`, north → `kencom` | |
   | `kencom` | south → `tom-mboya-street`, north → `uhuru-park` | |
   | `uhuru-park` | none | an ending: you made it |

   Add more. A dead-end alley, a street with a conductor shouting "Ngong! Ngong!", a wrong-matatu ending. The tests only check that every exit points to a room that exists, and that at least one ending is reachable, so your map is yours to design. Write descriptions in your own voice.
3. Write `move(world, currentRoomId, direction)`. Look up the current room (throw `Unknown room: <id>` if it isn't in the world), then look up the exit for that direction. If there's an exit, return the room it points to. If there isn't, return `currentRoomId` unchanged.
4. Write `isEnding(world, roomId)`. Return `true` if the room has `isEnding: true`, otherwise `false`. Watch out: `isEnding` is optional on a room, so it may be `undefined`.
5. Run the tests:

   ```bash
   npm test -- day-014
   ```

## When you're stuck

- **A test says an exit points to a room that doesn't exist** — check the spelling of the target id against the key of the room it should point to. A single typo in a room id is the most common bug here.
- **"Element implicitly has an 'any' type" on `exits[direction]`** — the `Room` type says `exits` is a `Record<string, string>`, which allows any string key. If you changed that type, change it back.
- **`isEnding` returns `undefined` instead of `false`** — for rooms without the flag, `room.isEnding` is `undefined`. `room.isEnding === true` gives you a real boolean.
- **Stretch goal (ungraded)** — write a small loop in a separate file that reads a direction from the terminal with `node:readline` and plays your world for real.
- **Still stuck?** Read `solution/nairobi-cbd.ts`, then close it and write your own from memory.
