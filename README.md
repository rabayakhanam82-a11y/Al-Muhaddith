# Al-Muhaddith

An ultra-premium, studio-grade Hadith explorer. Flat obsidian editorial surfaces, hairline borders, muted gold accents, and the classic grading color language (Sahih mint / Hasan light mint / Da'if ochre / Mawdu' crimson).

## Architecture

- **Edge delivery pipeline** — narrations stream from the open `fawazahmed0/hadith-api` jsDelivr CDN (`editions.json` handshake → edition payloads), with exponential-backoff retries and a circuit breaker in the network gateway.
- **Parallel hydration** — Arabic (`ara-*`) and the selected translation (`eng-*`, `ben-*`, …) load concurrently and are zipped into unified `HadithNode` objects by absolute index.
- **Client-side storage engine** — editions, view counters, bookmarks, playlists and reading history persist in IndexedDB (`idb`), fully offline-capable once cached.

## Features

- Six canonical collections (Bukhari, Muslim, Nasa'i, Abu Dawud, Tirmidhi, Ibn Majah)
- Hadith of the Day — deterministic per calendar date, identical worldwide
- Deep client-side search with live gold highlighting (350 ms debounce)
- 3-second dwell view-tracking via IntersectionObserver + reading history trail
- Bookmarks + grouped playlists, saved locally
- Multi-language reader: 10 translation languages, stacked / side-by-side layouts,
  instant typography scaling (no refetch)
- Epistemological History module: compilation eras, transmission hubs, Asma al-Rijal methodology

## Commands

```bash
bun install        # install
bun run dev        # dev server (0.0.0.0, PORT-aware)
bun run typecheck  # tsc -b --noEmit
bun run build      # typecheck + vite build → dist/
```

Data source: [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) · all user data stays in your browser.
