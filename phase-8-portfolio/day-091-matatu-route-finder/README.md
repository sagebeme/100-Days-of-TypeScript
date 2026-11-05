# Day 91: Matatu Route Finder

*A brief and a test suite. No walkthrough.*

## The brief

"How do I get from Kangemi to Rongai?" Ask five people at the stage and get five answers. Build a route finder: pick two stages, and get the trip, step by step. Which matatu to take, where to get off, where to change or walk, how long it takes and what it costs.

`network.ts` has a simplified Nairobi. The stages are real places; the routes, times and fares are made up for this project.

## The rules (tested)

- **`MinHeap`**: a binary heap that always hands back the smallest item, in O(log n). Write it yourself: it's what makes Dijkstra fast.
- **`planTrip`** is Dijkstra's shortest path. The trick is *what* you search over. Search over **(stage, which matatu you're on)**, not just stages, so that:
  - boarding costs the wait (`changeMinutes`, 8 by default) and the fare;
  - riding costs the minutes between stages, in either direction;
  - getting off is free, and walking costs its minutes.
- A trip is a list of **legs** (rides and walks), with total minutes, total fare, and **changes** (rides minus one: walking isn't a change).
- **`fewestChanges`**: make each boarding cost 30 extra minutes *in the search* (not in the answer), so a simpler trip wins over a slightly quicker one.
- `null` when there's no way at all; an empty trip when you're already there; an error for a stage that doesn't exist.
- **`describe`** turns a trip into a sentence: "Walk from Eastleigh to Pangani (14 min), then take the 45…"

## The page (yours to design)

Two stage pickers (and a swap button), fastest or fewest changes, the trip as a timeline in each route's colour, and a map with the trip drawn over the network. Put the choice in the URL, so a trip can be shared.

## Steps

1. Read the tests, then `network.ts`: how stages, routes (with the minutes between each pair of stages) and walks are written. Work out the tests' tiny `LINE` network by hand.
2. `heap.ts`: `push`, `pop` and `size` for a binary min-heap. `npm test -- day-091 -t "priority queue"`.
3. `planTrip`: Dijkstra over (stage, matatu you're on), keeping where each state came from, then walk back from the goal and turn the steps into legs. `npm test -- day-091 -t "planning a trip"`.
4. `describe`, then the Nairobi tests.
5. Run the tests, then build the page in `main.ts` (the commands under "Done when").

## Done when

```bash
npm test -- day-091
npx vite phase-8-portfolio/day-091-matatu-route-finder/starter
```

## Stretch

- Fares that change with the time of day and the rain (they do!).
- "Leave by" times, using how often each route runs.
- Real stage positions on a real map, with OpenStreetMap.

## When you're stuck

- **`pop` comes back in the wrong order** — after `push`, swap the new item up while it's smaller than its parent (`(i - 1) >> 1`). For `pop`, move the last item to the top and swap it down with its smaller child (`2i + 1`, `2i + 2`) until neither is smaller.
- **It changes matatu without paying the wait** — a state is a stage *and* the matatu you're on (or none). Boarding goes from "on none" to "on route N" at the same stage and costs the wait and the fare; getting off goes back to "on none" for free.
- **A ride against the route's direction is missing, or takes the wrong minutes** — from stage `i` you can ride to `i - 1` or `i + 1`, and the minutes between them are `route.minutes[Math.min(i, j)]`.
- **The search stops before the end** — you've arrived only at the destination and *off* the matatu, so stop there, not at the first state at that stage.
- **The same state comes out of the queue twice** — a heap can't lower an item's cost, so you push it again. When you pop an entry that costs more than the best you've recorded for that state, skip it.
- **`fewestChanges` changes the reported minutes** — add the 30 to the cost the search sorts by only. Keep the real minutes and fares on each step, and add those up for the trip.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
