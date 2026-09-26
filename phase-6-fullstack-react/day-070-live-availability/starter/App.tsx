import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiProvider } from "./ApiContext.tsx";
import { createApi, type Api } from "./api.ts";
import { EventsPage } from "./EventsPage.tsx";
import { EventPage } from "./EventPage.tsx";
import { OrderPage } from "./OrderPage.tsx";

// Already written: the app shell and a tiny router. #/ lists events, #/events/3 is one event,
// #/orders/7 is an order. (Day 71 swaps this for Next.js's router.)
function useHash(): string {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function Routes() {
  const hash = useHash();
  const event = /^#\/events\/(\d+)$/.exec(hash);
  const order = /^#\/orders\/(\d+)$/.exec(hash);
  if (event) {
    return (
      <>
        <a className="back-link" href="#/">← All events</a>
        <EventPage id={Number(event[1])} onOrdered={(o) => (location.hash = `#/orders/${o.id}`)} />
      </>
    );
  }
  if (order) return <OrderPage id={Number(order[1])} />;
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Nairobi · December</p>
        <h1>Live music, comedy and parties near you</h1>
        <p>Seats update live as other fans buy. Pay with M-Pesa, walk in with the code on your phone.</p>
      </section>
      <EventsPage />
    </>
  );
}

export function App({ api = createApi(), queryClient = new QueryClient() }: { api?: Api; queryClient?: QueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api}>
        <header className="site-header">
          <div className="wrap">
            <a className="logo" href="#/">
              <span className="logo-mark" aria-hidden="true">t</span>
              tikiti
            </a>
            <nav className="site-nav" aria-label="Main">
              <a href="#/">What's on</a>
            </nav>
          </div>
        </header>
        <main className="wrap">
          <Routes />
        </main>
      </ApiProvider>
    </QueryClientProvider>
  );
}
