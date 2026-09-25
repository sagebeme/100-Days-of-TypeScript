# Day 43: Fit Check — REST APIs and Status Codes

Watch the video: *(not recorded yet)*

## The brief

Nairobi mornings are cold, the afternoons are hot, and the rain turns up whenever it likes. So what do you wear? Build a command-line fit check: it asks a real weather service about today and tells you what to put on.

```
$ node phase-4-internet/day-043-fit-check/starter/cli.ts
Fit check for Nairobi
Clear sky, 16°C (feels like 16°C)
High 29°C, low 15°C, 2% chance of rain

Top:    Light sweater or a denim jacket
Bottom: Jeans or chinos
Also:   Layers: it's cold early and warm later, Sunglasses
```

Welcome to Phase 4. Until now your code only talked to itself. From today it talks to other people's servers, and those can be slow, down, or say no.

## What you'll use

- **A REST API**: a URL you can ask for data. [Open-Meteo](https://open-meteo.com) is free and needs no key, so it works straight away
- **`URL` and `searchParams`** to build the query string, instead of gluing strings together and forgetting to encode something
- **Status codes**: `200` OK, `400` your request was wrong, `404` not found, `429` slow down, `500`+ their problem. Each one deserves a different message
- **Mapping**: the API's names (`temperature_2m`, `precipitation_probability_max`) become your own (`temperature`, `rainChance`) in one place, so the rest of the app never sees theirs

## Steps

1. Try the API in your browser. This is the exact request your app will make:

   [api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=1](https://api.open-meteo.com/v1/forecast?latitude=-1.2921&longitude=36.8219&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Africa%2FNairobi&forecast_days=1)

   Then change the latitude to `-100` and look at the answer: a `400`, with a `reason`.
2. `starter/weather.ts`:
   - `forecastUrl(place)`: the URL above, built with `new URL(API)` and `searchParams.set`.
   - `fetchWeather(place, fetchFn)`: one message per kind of status code (see the TODO), then map the JSON into a `Today`.
   - `describeSky(code)`: turn a WMO weather code into words.
3. `starter/outfit.ts`: `pickOutfit(today)`, using the feels-like temperature, because that's what your body notices:

   | Feels like | Top |
   | --- | --- |
   | under 14°C | Hoodie or a warm jacket |
   | 14–19°C | Light sweater or a denim jacket |
   | 20–26°C | T-shirt |
   | 27°C and up | Vest or a light tee |

   - **Bottom**: `Shorts` if it feels like 24°C or more, it isn't wet, and the chance of rain is under 40%. Otherwise `Jeans or chinos`.
   - **Extras**, in this order:
     - wet (raining now, or a 60%+ chance): `Umbrella` and `Skip the white sneakers`
     - otherwise, a 30%+ chance of rain: `Pack a small umbrella`
     - wind of 30 km/h or more: `Windbreaker`
     - 10°C or more between the high and the low: `Layers: it's cold early and warm later`
     - a clear sky (code 0) with a high of 25°C or more: `Sunglasses`
4. `formatReport(placeName, today, outfit)`: the text in the brief.
5. Run the tests. They never touch the real API: every response is made up, so they're fast and they test the error cases too.

   ```bash
   npm test -- day-043
   ```

6. Run it for real, for Nairobi or anywhere else:

   ```bash
   node phase-4-internet/day-043-fit-check/starter/cli.ts
   node phase-4-internet/day-043-fit-check/starter/cli.ts Kisumu -0.0917 34.768
   ```

## When you're stuck

- **`fetch` didn't throw, but the data is nonsense** — a `400` or `500` is still a successful *network* request. Check `response.status` before you read the body.
- **`Unexpected token < in JSON`** — the server sent back HTML (an error page), not JSON. Another reason to check the status first.
- **The URL has spaces or commas in odd places** — build it with `searchParams.set`; it encodes everything for you.
- **`Cannot read properties of undefined (reading '0')`** — you forgot the `daily` part of the request, so it isn't in the answer.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
