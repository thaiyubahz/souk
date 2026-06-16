# Build the Souk here

This folder is your workspace. Everything in it right now is a **placeholder stub**
so the app compiles and runs. Replace it with your real implementation.

## What's wired up already
- The app's router (`src/app/router.tsx`) already has the Souk routes and points
  them at the page names exported from `./index.ts`.
- The sidebar already has a **Souk** entry that navigates to `/souk`.
- So: run the app, open the Souk from the menu, and you'll land on the
  placeholder. Start replacing it.

## The routes that exist (match the prototype)
```
/souk                     → home / discovery feed
/souk/category/:type      → a category
/souk/listing/:id         → one listing
/souk/create              → create a listing
/souk/my-listings         → my listings
/souk/seller/:uid         → a seller's profile
/souk/saved               → saved listings
```

## Conventions used by the other features (look at them for the pattern)
```
features/souk/
  pages/        one component per screen
  components/   reusable pieces used by the pages
  services/     data access — talk to your MOCK data layer here, not real APIs
  stores/       local state (this app uses zustand)
  types/        your TypeScript types
  index.ts      barrel export the router imports from
```

## Rules
- Build against the **mock data** shipped in the handoff (`mock-data/`). Wire it
  through `services/` so a real backend could replace it later without touching
  your UI.
- Do **not** add real API keys, backend URLs, or credentials. None are needed.
- The prototype is the target. The feature PDF is the "why".
