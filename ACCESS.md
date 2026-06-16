# Access & Scope

Read this once. It defines the boundary you work inside.

## What you have

| Item | Access |
|------|--------|
| The prototype (build target) | ✅ Public link — open in any browser |
| The feature document (PDF) | ✅ In `reference/` |
| A runnable frontend scaffold | ✅ `scaffold/` — runs in stub mode, no creds |
| Sample data to build against | ✅ `mock-data/` (local JSON files) |
| Your own dev environment & tools | ✅ Set it up however you like |

The scaffold is a **sanitized** copy of the real frontend: all API keys, Firebase
credentials, native project files, build output, and the real Souk implementation
have been removed. It boots in "stub mode" — Firebase is inert and the UI runs so
you can build UI and flows without any live service.

## What you do NOT have (and don't need)

| Item | Access | Why |
|------|--------|-----|
| Production / staging servers | ❌ | Not needed to build the UI & flows |
| Real user data | ❌ | Privacy. Use the mock data. |
| API keys / secrets / tokens | ❌ | None required for this assignment |
| Firebase / database credentials | ❌ | Build against local mock data |
| Payment / Dinarz live systems | ❌ | Simulate locally; no real value moves |
| The real Souk implementation | ❌ | You build it — placeholders mark the spot |
| Other features' live behaviour | ❌ | Present as scaffold only; no backend behind them |

## The rule

**Build everything against the local mock data in `mock-data/`.** Treat it as if
it came from a real backend. Define a clean data layer so that *if* a real API
appears later, only that layer changes — not your whole app.

If you believe you genuinely need access to something on the "NOT" list to make
progress, **stop and ask first.** Explain what you need and why. Access is
granted only when there's no reasonable way around it. The default answer is
"build it with mocks."

## Data handling

- Don't commit secrets, keys, or `.env` files to any repo you create.
- Don't paste real personal data anywhere.
- Anything you build stays internal to Zarya Plus.
