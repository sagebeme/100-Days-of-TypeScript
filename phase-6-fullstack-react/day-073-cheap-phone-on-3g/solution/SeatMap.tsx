import layout from "./seat-layout.json" with { type: "json" };

// Already written: every seat at the venue. It's big (150 KB of seat positions), and most fans never
// open it. That's the point: it shouldn't be in the download everyone waits for.
export default function SeatMap() {
  const blocks = layout.blocks.map((block) => {
    const seats = block.rows.flatMap((row) => row.seats);
    return { id: block.id, name: block.name, free: seats.filter((s) => !s.taken).length, total: seats.length, rows: block.rows };
  });
  return (
    <section className="seat-map" aria-labelledby="seat-map-heading">
      <h3 id="seat-map-heading">Seat map · {layout.venue}</h3>
      <svg viewBox="0 0 1440 190" aria-hidden="true" className="seat-map-art">
        {layout.blocks.flatMap((block) =>
          block.rows.flatMap((row) =>
            row.seats.map((seat) => <circle key={`${block.id}${row.row}${seat.n}`} cx={seat.x + 6} cy={seat.y + 6} r="3" data-taken={seat.taken || undefined} />),
          ),
        )}
      </svg>
      <ul className="seat-blocks">
        {blocks.map((block) => (
          <li key={block.id}>
            <strong>{block.name}</strong> {block.free} of {block.total} free
          </li>
        ))}
      </ul>
    </section>
  );
}
