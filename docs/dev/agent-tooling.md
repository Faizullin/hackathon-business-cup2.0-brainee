# Agent tooling: skills and MCP

Which agent skills and tools are worth having for this project, for Claude Code and Codex. Evaluated against a generic "premium web UI" prompt that listed popular skills. **Rule of thumb:** a skill earns its place only if it changes the output for *this* project. Each loaded skill costs context tokens.

## Verdict

| Tool | Verdict | Why / when |
|---|---|---|
| **webapp-testing** (Playwright) | ✅ Adopt | Checks the [acceptance criteria](../product/rules.md#mvp-acceptance-criteria) and the two-device demo flow. Use after each screen is built (P3–P7). Codex: call Playwright directly. |
| **vercel-react-best-practices** | ✅ Adopt | Rules for Next.js/React performance and data fetching (server components, avoiding waterfalls). Cheap; only triggers on React work. Works for Claude and Codex. |
| **frontend-design** | ✅ Adopt, with limits | Good for polish and distinctive layouts (landing, post-game screen). **It must use the prototype tokens** (`packages/ui`) and must not invent a new visual identity. |
| **web-design-guidelines** | 🟡 On demand | Accessibility and UX audit. Run once before the demo (T-70), not during the build. |
| **shadcn/ui + Lucide** | ✅ Already in stack | Parent dashboard: forms, tabs, dialogs. Code is copied in, so it's own-domain safe. |
| **Motion Primitives** | 🟡 Selective | Copy individual components (animated number for ★ counters, text/transition effects for "before → after"). Never the whole library. |
| **Magic UI** | 🟡 Landing only | Marketing flair suits `apps/landing`. It doesn't fit the kids' UI (busy effects, against the calm product rules). |
| **ui-ux-pro-max** | ❌ Skip | A generic style, palette and font database. Our visual identity is already set by the prototype, so it would cause drift and burn tokens. |
| **vercel-composition-patterns** | ❌ Skip | Advanced component API design. Overkill for a hackathon `ui` package. |

## MCP servers (optional)

| Server | Verdict | Why |
|---|---|---|
| Context7 (live library docs) | 🟡 Useful | Next.js 16, Drizzle and Serwist APIs change fast; avoids outdated code from memory. |
| Playwright MCP | 🟡 Codex | Lets Codex see and drive the UI. Claude here can use the `uishot` / `webapp-testing` skills instead. |
| next-devtools-mcp | 🟡 Optional | Shows runtime errors and routes from a running Next dev server. |
| shadcn MCP | ❌ Skip | `npx shadcn add <c>` is enough. |

## Rules from that prompt worth keeping
- Frontend changes don't add new backend services, AI SDKs, auth or payment providers ([decisions.md](decisions.md)).
- Use local sample data **only** for isolated visual work (`/lab`, Brainy scenarios). Real screens read from `db` via seeds.
- After building UI: render it, check phone and iPad widths, test the main interactions with Playwright.

## Install
Skills go at project level so every teammate gets them: `.claude/skills/` for Claude Code, and Codex's skills directory for Codex. Follow each skill's repo README for the current install command (`anthropics/skills` for frontend-design and webapp-testing; `vercel-labs/agent-skills` for the Vercel skills). After installing, list them in the table above with ✅ installed.
