// Already written: a simplified matatu network for Nairobi. The stages are real places; the routes,
// times and fares are made up for this project. Don't plan a real journey with them!
export interface Stage {
  id: string;
  name: string;
  x: number; // for drawing the map, 0 to 100
  y: number;
}

export interface Route {
  number: string;
  colour: string;
  stages: string[]; // in order; matatus run both ways
  minutes: number[]; // between each pair of neighbouring stages
  fare: number; // KES, paid once per boarding
}

export interface Walk {
  between: [string, string];
  minutes: number;
}

export interface Network {
  stages: Stage[];
  routes: Route[];
  walks: Walk[];
}

export const NAIROBI: Network = {
  stages: [
    { id: "kencom", name: "Kencom", x: 55, y: 49 },
    { id: "archives", name: "Archives", x: 49, y: 39 },
    { id: "railways", name: "Railways", x: 57, y: 60 },
    { id: "westlands", name: "Westlands", x: 38, y: 30 },
    { id: "kangemi", name: "Kangemi", x: 14, y: 24 },
    { id: "kawangware", name: "Kawangware", x: 8, y: 50 },
    { id: "yaya", name: "Yaya Centre", x: 30, y: 46 },
    { id: "prestige", name: "Prestige", x: 27, y: 60 },
    { id: "karen", name: "Karen", x: 16, y: 80 },
    { id: "langata", name: "Lang'ata", x: 40, y: 74 },
    { id: "rongai", name: "Rongai", x: 44, y: 94 },
    { id: "south-b", name: "South B", x: 64, y: 64 },
    { id: "gikomba", name: "Gikomba", x: 70, y: 48 },
    { id: "pangani", name: "Pangani", x: 60, y: 28 },
    { id: "roysambu", name: "Roysambu", x: 70, y: 14 },
    { id: "eastleigh", name: "Eastleigh", x: 76, y: 34 },
    { id: "donholm", name: "Donholm", x: 86, y: 52 },
  ],
  routes: [
    { number: "46", colour: "#dc2626", stages: ["kencom", "archives", "westlands", "kangemi"], minutes: [6, 14, 16], fare: 70 },
    { number: "44", colour: "#2563eb", stages: ["railways", "kencom", "yaya", "kawangware"], minutes: [5, 15, 18], fare: 80 },
    { number: "111", colour: "#16a34a", stages: ["railways", "prestige", "langata", "karen"], minutes: [18, 16, 20], fare: 100 },
    { number: "125", colour: "#9333ea", stages: ["railways", "south-b", "langata", "rongai"], minutes: [12, 22, 25], fare: 120 },
    { number: "45", colour: "#ea580c", stages: ["archives", "pangani", "roysambu"], minutes: [10, 25], fare: 90 },
    { number: "9", colour: "#0891b2", stages: ["kencom", "gikomba", "eastleigh"], minutes: [9, 11], fare: 60 },
    { number: "34", colour: "#ca8a04", stages: ["railways", "gikomba", "donholm"], minutes: [8, 20], fare: 80 },
    { number: "2", colour: "#db2777", stages: ["kawangware", "prestige", "yaya", "westlands"], minutes: [14, 8, 15], fare: 70 },
  ],
  walks: [
    { between: ["kencom", "archives"], minutes: 7 },
    { between: ["kencom", "railways"], minutes: 9 },
    { between: ["eastleigh", "pangani"], minutes: 14 },
  ],
};
