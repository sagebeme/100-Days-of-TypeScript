// The practice site's own JavaScript. Results only appear after this runs, and after a short
// delay, like a real site waiting for its API. That's why a plain fetch() of the page sees nothing.
const EVENTS = [
  { title: "Gengetone Night", city: "Nairobi", venue: "Alchemist", date: "2026-10-03", price: 1000, tags: "music" },
  { title: "Sunday Picnic Jam", city: "Nairobi", venue: "Karura Forest", date: "2026-10-04", price: 0, tags: "music outdoors" },
  { title: "EA FC Tournament", city: "Nairobi", venue: "iHub", date: "2026-10-03", price: 500, tags: "gaming" },
  { title: "Comedy at the Courtyard", city: "Nairobi", venue: "The Courtyard", date: "2026-10-09", price: 800, tags: "comedy" },
  { title: "Taarab by the Sea", city: "Mombasa", venue: "Fort Jesus Grounds", date: "2026-10-10", price: 700, tags: "music" },
  { title: "Beach Football Cup", city: "Mombasa", venue: "Nyali Beach", date: "2026-10-11", price: 0, tags: "football outdoors" },
  { title: "Lakeside Afrobeats", city: "Kisumu", venue: "Dunga Beach", date: "2026-10-17", price: 1200, tags: "music" },
  { title: "Kisumu Derby Watch Party", city: "Kisumu", venue: "Mega Plaza", date: "2026-10-18", price: 300, tags: "football" },
  { title: "Open Mic Poetry", city: "Nairobi", venue: "Kenya National Theatre", date: "2026-10-16", price: 400, tags: "poetry" },
  { title: "Rooftop Listening Party", city: "Nairobi", venue: "Kilimani Rooftop", date: "2026-10-17", price: 1000, tags: "music" },
  { title: "Harambee Stars Screening", city: "Nairobi", venue: "KICC Grounds", date: "2026-10-14", price: 0, tags: "football" },
  { title: "Swahili Food Festival", city: "Mombasa", venue: "Old Town", date: "2026-10-24", price: 500, tags: "food" },
];
const PAGE_SIZE = 5;

const form = document.getElementById("search");
const status = document.getElementById("status");
const list = document.getElementById("results");
const more = document.getElementById("more");
let matches = [];
let shown = 0;

function card(event) {
  const item = document.createElement("li");
  item.className = "event";
  item.dataset.testid = "event-card";
  const price = event.price === 0 ? "Free" : `KES ${event.price.toLocaleString("en-US")}`;
  item.innerHTML = `<h2></h2><p class="meta"></p><p class="price"></p>`;
  item.querySelector("h2").textContent = event.title;
  item.querySelector(".meta").textContent = `${event.date} · ${event.venue}, ${event.city}`;
  item.querySelector(".price").textContent = price;
  return item;
}

function showNext() {
  for (const event of matches.slice(shown, shown + PAGE_SIZE)) list.append(card(event));
  shown = Math.min(shown + PAGE_SIZE, matches.length);
  more.hidden = shown >= matches.length;
  status.textContent = `${matches.length} ${matches.length === 1 ? "event" : "events"} found, showing ${shown}`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const words = form.q.value.trim().toLowerCase();
  const city = form.city.value;
  status.textContent = "Searching…";
  list.replaceChildren();
  more.hidden = true;
  setTimeout(() => {
    matches = EVENTS.filter(
      (event) =>
        (!city || event.city === city) &&
        (!words || `${event.title} ${event.tags} ${event.venue}`.toLowerCase().includes(words)),
    ).sort((a, b) => a.date.localeCompare(b.date));
    shown = 0;
    if (matches.length === 0) {
      status.textContent = "No events found. Try another search.";
      return;
    }
    showNext();
  }, 400 + Math.random() * 400);
});

more.addEventListener("click", () => {
  more.disabled = true;
  status.textContent = "Loading more…";
  setTimeout(() => {
    more.disabled = false;
    showNext();
  }, 300 + Math.random() * 300);
});
