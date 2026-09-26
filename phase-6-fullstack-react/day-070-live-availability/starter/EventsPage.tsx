import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { eventsQuery } from "./queries.ts";
import { CardSkeletons, ErrorPanel, EventTile, UpdatedAgo } from "./pieces.tsx";

// TODO: every state a request can be in, shown on purpose.
// const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useQuery(eventsQuery(useApi()))
// <section className="section" aria-labelledby="whats-on" aria-busy={isPending}>
//   <div className="section-head"><h2 id="whats-on">What's on</h2> and, once there's data, <UpdatedAgo at={dataUpdatedAt} fetching={isFetching} /></div>
//   loading:                     <CardSkeletons />
//   failed, and nothing to show: <ErrorPanel message={error.message} onRetry={() => void refetch()} />
//   otherwise:                   <ul className="event-grid"> with <li key={id}><EventTile event={event} /></li>
//   (If a refresh fails but we have events, keep showing them: old numbers beat an error page.)
// </section>
export function EventsPage() {
  void [useQuery, useApi, eventsQuery, CardSkeletons, ErrorPanel, EventTile, UpdatedAgo];
  return <p>TODO: EventsPage</p>;
}
