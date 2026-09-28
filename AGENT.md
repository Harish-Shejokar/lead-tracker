# AGENT.md: How AI was used in this project

This file records which AI tools were used, the prompts given to them, which parts they generated, which parts were written by hand, and the main engineering decisions.

The project was built in two phases:

| Phase | Dates | Commits | Who / what |
|---|---|---|---|
| 1. Initial build | Sep 23–28, 2026 | `bc0ba1c` … `81b2cbe` (5 commits) | Written and deployed by Harish (see [Phase 1](#phase-1-initial-build)) |
| 2. Review, tests, fixes, docs | Sep 28, 2026 | `1f2d74d` … this commit (8 commits) | Generated with Claude Code, then reviewed and committed by Harish. These commits carry a `Co-Authored-By: Claude` trailer. |

## AI tools used

| Tool | Model | Used for |
|---|---|---|
| **Claude Code** (VS Code extension) | Claude Opus 5.5 | Phase 2: reviewing the project against the assignment, writing tests, bug fixes, refactoring for testability, CI, README and this file |
| **TODO(Harish): tools used in Phase 1** | | e.g. ChatGPT / Claude chat / Copilot, and what each was used for. Write "none" if Phase 1 was written without AI. |

`frontend/AGENTS.md` and `frontend/CLAUDE.md` are generated automatically by Next.js (`create-next-app` / `next dev`). They are instructions for AI coding agents, not project documentation.

## Prompts

### Phase 2: Claude Code

These are the prompts given to Claude Code, in order. They are verbatim apart from typo fixes. The assignment PDF was attached to the first one.

1. *"This is the assignment I got. Check if my project is up to the mark or not."*
   Claude reviewed the repo against each requirement. It ran both builds, found that the backend `tsc` build was failing, checked the live API, and reported the missing deliverables (README, AGENT.md, tests, commit count) and the code issues it found.
2. *"Is my project done, everything according to requirements?"*
   Claude re-checked the repo state and gave a requirement-by-requirement checklist.
3. *"Generate the testing part. What is required?"*
   Claude added the backend and frontend test suites.
4. *"OK, let's commit."*
   Claude made two test commits.
5. *"Let's go to the next steps and complete this project, and also commit where required. After completion, tell me what's remaining."* (The live Vercel and Render URLs were given as a follow-up.)
   Claude made the bug fixes, cleanup, CI, README and AGENT.md commits.

### Phase 1

**TODO(Harish):** list the main prompts you used while building the first version, or write "none". For example: *"Create an Express + TypeScript API for leads with Postgres: create, list with search, update status"*.

## AI-generated vs. manually written

### Generated with Claude Code (Phase 2)

Every change was reviewed before committing. Each was also checked by running the tests, the TypeScript compiler and the production builds.

| Commit | What was generated |
|---|---|
| `1f2d74d` test: add api tests | Split `backend/src/server.ts` into `app.ts` (`createApp(pool)`) and a small `server.ts`. Wrote `backend/tests/leads.test.ts`. Added the missing `@types/cors` and `@types/pg`, which fixed `npm run build`. |
| `51f08bd` test: add frontend tests | Vitest config, setup file and `frontend/__tests__/*` |
| `5e39141` fix: validate lead input and ids | Input and id validation, `CORS_ORIGIN`, error logging, `CHECK` constraint in `schema.sql`, and the matching tests |
| `5bab9a2` fix: show api errors… | API error messages in the UI, the form keeping input on failure, a load-error state, debounced search, ignoring stale responses, a single status list, accessible labels, mobile table scrolling, and the page title |
| `09c0baf` chore: remove unused netlify config… | Root `.gitignore`, `.env.example` files, and removal of `netlify.toml`, the tracked `.DS_Store` and the boilerplate README |
| `29b27fa` ci | GitHub Actions workflow |
| `e0681cc` docs: add readme | `README.md` |
| this commit | `AGENT.md` (the TODO sections are for Harish to complete) |

### Written by Harish (Phase 1)

- **Database schema** (`backend/src/schema.sql`): the `leads` table with a unique email and the status column.
- **Express API**: all four endpoints (create, list and search, get by id, update status) with parameterised SQL.
- **Next.js UI**: the Lead Tracker page, `CreateLeadForm`, `LeadTable` and the API client in `lib/api.ts`.
- **Manual API testing** in Postman.
- **Deployment**: the Neon PostgreSQL database, the Render web service for the API, and the Vercel project for the frontend, including environment variables and the CORS fix for the deployed frontend.

**TODO(Harish):** adjust this list if any of these parts were AI-assisted.

In Phase 2, Harish chose which suggestions to act on, supplied the deployment URLs, and approved each commit.

## Key engineering decisions

| Decision | Made in | Reasoning |
|---|---|---|
| PostgreSQL over MongoDB | Phase 1 | Leads are fixed-shape, relational records. Postgres enforces uniqueness (`UNIQUE email`) and allowed values (`CHECK status`) in the database itself. |
| Express + raw SQL via `pg`, no ORM | Phase 1 | Four simple queries don't justify an ORM. Every query is parameterised (`$1`, `$2`) to prevent SQL injection. |
| Search in the backend with `ILIKE`, plus a status filter | Phase 1 | Case-insensitive partial matching on name or email with no extra infrastructure. The trade-off is covered in the README. |
| Status is a fixed list, starting at `NEW` | Phase 1 | The API always creates leads as `NEW` and rejects unknown statuses. Phase 2 added a database `CHECK` so bad data can't bypass the API. |
| Next.js (React + TypeScript) on Vercel, API on Render, database on Neon | Phase 1 | Meets the React + TypeScript requirement, and all three have free tiers that deploy from GitHub. |
| `createApp(pool)` dependency injection | Phase 2 | The routes can then be tested with an in-memory database, with no real Postgres needed and no risk to production data. |
| pg-mem for API tests rather than mocking `pool.query` | Phase 2 | Mocks would only check the SQL text. pg-mem runs the real `schema.sql` and queries, so it catches broken SQL, duplicate-email errors (`23505`) and `CHECK` violations. |
| Vitest for both backend and frontend | Phase 2 | One test runner across the repo. The Next.js docs recommend it, and TypeScript works without extra config. |
| Emails stored lowercase | Phase 2 | `John@x.com` and `john@x.com` are the same inbox, so the `UNIQUE` constraint should treat them as duplicates. |
| Errors shown inline, and the form keeps its input on failure | Phase 2 | Previously a failed create (e.g. a duplicate email) showed a generic alert and cleared the form. |
| Debounced search that ignores stale responses | Phase 2 | Previously every keystroke sent a request, and a slow earlier response could overwrite newer results. |
| `CORS_ORIGIN` env var, open by default | Phase 2 | Production can be locked to the Vercel URL without breaking local development or the current deployment. |

## Verifying AI output, and mistakes caught

- **Tests were checked for real failures.** For each suite, the app code was deliberately broken (sort order, duplicate-email handling, the status dropdown, the debounce, the stale-response guard, the `CHECK` constraint). The relevant tests failed each time, then the code was restored.
- **Builds and live checks:** `tsc`, `next build`, both test suites, and `npm ci --dry-run` (to confirm the lockfiles CI uses) were run before each commit. The live API and the deployed frontend's API URL and CORS headers were checked with `curl`.
- **Mistakes caught during Phase 2:**
  - **Wrong frontend host:** Claude assumed the frontend was on Netlify because `netlify.toml` existed. It was actually on Vercel, so the unused config was removed.
  - **Wrong database host:** the README draft said the database was on Render. The `DATABASE_URL` hostname (only the hostname was inspected) showed Neon, and the README was corrected before committing.
  - **Lost schema edit:** while double-checking the schema test, a backup/restore step ran `git checkout` on `schema.sql` and wiped the uncommitted edit. It was noticed and rewritten before the commit.
  - **Dependency and config issues:** Vitest 5 needed `@types/node` 22, so it was bumped to match the Node 22 runtime. A Vite warning about `vite-tsconfig-paths` led to using Vite's built-in `resolve.tsconfigPaths` instead.
- **Things AI did not decide:** the tech stack, the hosting providers, and what to submit.
