import { useQuery } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import { eventsQuery } from "./queries.ts";
import { CardSkeletons, ErrorPanel, EventTile, UpdatedAgo } from "./pieces.tsx";

// Every state a request can be in, shown on purpose: loading, failed, loaded, and refreshing.
export function EventsPage() {
  const api = useApi();
  const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useQuery(eventsQuery(api));

  return (
    <section className="section" aria-labelledby="whats-on" aria-busy={isPending}>
      <div className="section-head">
        <h2 id="whats-on">What's on</h2>
        {data && <UpdatedAgo at={dataUpdatedAt} fetching={isFetching} />}
      </div>
      {isPending ? (
        <CardSkeletons />
      ) : error && !data ? (
        <ErrorPanel message={error.message} onRetry={() => void refetch()} />
      ) : (
        // If a refresh fails, the cards we already have stay up: old numbers beat an error page.
        <ul className="event-grid">
          {data!.map((event) => (
            <li key={event.id}>
              <EventTile event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
