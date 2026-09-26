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

## Done when

```bash
npm test -- day-091
npx vite phase-8-portfolio/day-091-matatu-route-finder/starter
```

## Stretch

- Fares that change with the time of day and the rain (they do!).
- "Leave by" times, using how often each route runs.
- Real stage positions on a real map, with OpenStreetMap.
