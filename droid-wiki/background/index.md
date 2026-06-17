# Design Decisions

This section explains the architectural and design decisions behind the English Test Practice application.

- [Design Decisions](design-decisions.md) — Detailed rationale for major design choices

## Overview

### Why HashRouter instead of BrowserRouter

The app uses `HashRouter` (URLs like `/#/toefl/reading/complete-words`) rather than `BrowserRouter` because it is deployed to Cloudflare Pages as a static site. Cloudflare Pages serves static files without a catch-all server-side rewrite rule, so direct navigation to a path like `/toefl/reading/complete-words` would return a 404. `HashRouter` avoids this problem because everything after the `#` is handled client-side and never sent to the server.

### Why localStorage for Persistence

All score and answer data is stored in `localStorage`:

- No backend infrastructure required — the app works entirely offline after the initial page load
- Zero setup for users — no sign-up, no database, no API keys
- Data stays on the user's machine — no privacy concerns about storing test answers on a server

The trade-off is that data is device-specific and will be lost if the user clears browser storage.

### Why AI-Generated Questions

Question files are pre-generated JSON files produced by AI agents (Claude Code) and committed to the repository under `public/questions/`. The frontend only reads these files — there are no runtime API calls to any AI service. This approach:

- Eliminates runtime API costs — questions are generated once and served as static files
- Enables offline use — no network requests needed for question content (except audio)
- Makes content reviewable — question files are plain JSON that can be inspected, validated, and version-controlled

### Why CSS Modules over a Framework

The project uses CSS Modules (`.module.css` files) instead of Tailwind, styled-components, or other CSS solutions. This choice keeps the build pipeline minimal — no additional PostCSS plugins or runtime CSS-in-JS libraries needed. CSS Modules provide component-scoped styles with zero runtime cost, leveraging native CSS features like custom properties and `:focus-visible`.

### Design System Evolution

The original design used a dark-themed, LeetCode-inspired style. The current redesign (documented in [`DESIGN.md`](/DESIGN.md)) shifts to a lighter, academic aesthetic with a cobalt-blue accent (`#0071bc` family, evolved to `#0f62fe`). The design philosophy is described as "YC-product aesthetic" — ruthlessly functional, high information density, and zero ornamental noise.
