# Your Science Guide (YSG) — Project Handover

Last updated: May 2026  
Repository: `your-science-guide` — Next.js 15 App Router **frontend mockup** (no production backend).

---

## 1. Exact current state of the mockup

### Stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3, shadcn-style primitives (`Button`, `Switch`, CVA, Radix Slot) |
| Font | DM Sans (`next/font/google`) |
| Icons | `lucide-react` (video controls) |
| Rules file | `.cursorrules.md` (YSG Frontend Rules) |

### Routes

| Path | Purpose |
|------|---------|
| `/` | Home — links to Lesson and Parent portal |
| `/lesson` | **Student lesson** (primary mock) |
| `/parent` | **Parent portal** dashboard |
| `/settings` | Dark mode toggle (stone palette) |
| `/api/lesson/assessment` | Dynamic API — base64-encoded lesson + Alcumus problem payloads (server-only source files) |

### Global shell

- **Top nav** (`components/top-nav.tsx`): sticky, **solid** white / stone background (no blur), `max-w-5xl` aligned with main via `lib/layout.ts` → `siteContainerClass`.
- Links: Lesson, Parent, Settings — all `next/link`, same tab.
- **Theme**: default **light** (sky-50 page, white cards, sky-600 accents); optional **dark mode** in Settings (stone palette), persisted in `localStorage` (`ysg-theme`).

### `/lesson` — student experience

Rendered by `StudentLesson` inside `LessonAssessmentProvider` (fetches assessment data client-side after mount).

**Top to bottom:**

1. **Sticky progress rail** (`LessonProgressRail`) — pins below nav (`top-14`); shows “Question N of 3” and %; tracks **guided lesson only** (not extra practice).
2. **Header** — “Today’s lesson” + short copy.
3. **Lesson video** (`LessonVideo`) — mock player: play/pause, seek bar, ±10s, playback speed, fullscreen; 8:42 duration; no real stream.
4. **Your assignment** — three **guided questions** (state machine in `lib/lesson/state-machine.ts`):
   - Q1: multiple choice (plant cell wall) — options **shuffled** per mount.
   - Q2: short answer (vinegar fraction; accepts `1/4`, `0.25`, etc.).
   - Q3: long answer (photosynthesis) — “Submit for Parent Review”; min 40 chars.
   - Correct → toast + progress; incorrect → “Let’s try a different approach…”
5. **Extra practice** (`AlcumusPractice`) — **separate** adaptive pool (5 levels, choice + numeric); own streak/difficulty meter; does not affect lesson progress bar.
6. **Flashcard review** — 3 seed cards + user-created cards (in-memory only).

**Question display:** prompts and MC options use **`CanvasText`** (canvas rasterization, not DOM text) for copy protection and sharp re-draw on zoom (`devicePixelRatio` + `ResizeObserver`). Sizes ~1.925× and ~1.4875× root rem for prompt vs option (after +40% bump).

**AI / integrity (lesson layout):** Coursera-style **hidden** blocks only (not shown to students):

- `ContentIntegrity` — off-screen instructions for browser AI.
- `AcknowledgmentCheckpoint` — honeypot “I understand” button (`data-action="acknowledge-guidelines"`).
- `AssessmentProtected` — `user-select: none`, block copy/cut/context menu on question chrome.

Question copy lives in `lib/lesson/questions.server.ts` / `alcumus-problems.server.ts` (not in client bundle); served via API.

### `/parent` — parent portal

`ParentDashboard`: **tabs on mobile**, **vertical sidebar on `lg+`**.

| Section | Mock content |
|---------|----------------|
| **Student progress** | Grade B+ (87%), course name, 66% progress bar; table of long-answer submissions with expandable **mock rubric** |
| **Notifications** | Toggles: email on lesson complete, email for manual grading; “Save preferences” mock confirmation |
| **Subscription** | “YSG Physics 101”, renew date, Active badge, “Manage payment method” |

Data: `lib/parent/mock-data.ts`.

### `/settings`

Single **Appearance** card: dark mode switch (`DarkModeToggle`).

### Build status

`npm run build` succeeds. Lesson route is ~17–18 kB page JS + shared chunks. API route is dynamic (`force-dynamic`).

---

## 2. Core architectural and UI decisions

### Product / UX (from `.cursorrules.md`)

- **Simplicity and educational impact** over feature breadth.
- **No clutter** — no extra sidebars, ads, or decorative chrome beyond nav + section cards.
- **Same-tab navigation only** — `next/link` / `target="_self"`; never `target="_blank"`.
- **Whitespace and readable typography** for students.
- **Tailwind + shadcn/ui** patterns for a clean, minimal UI.

### Visual design (implemented)

- **Default theme:** sky blue + white (`sky-50` background, `sky-600` primary buttons, `slate` text).
- **Dark theme:** stone neutrals (optional via Settings).
- **Layout width:** `max-w-5xl` shared by `TopNav` and `<main>` (`siteContainerClass`).
- **No glass / blur** on top nav (explicitly removed after user feedback).

### Technical patterns

- **App Router** with route-specific layout: `app/lesson/layout.tsx` mounts `AssessmentAiGuard` + metadata hints.
- **Client state machines** for lesson progression and Alcumus adaptive logic (mock, in-memory).
- **Server-only question banks** + **client fetch** to reduce plain-text in initial HTML (still decoded in browser for rendering).
- **Canvas-rendered assessment text** instead of DOM text nodes (tradeoff: weaker screen-reader access to exact question wording; generic `aria-label`).
- **Composable guards:** `AssessmentProtected`, `CanvasText`, hidden integrity components.
- **Theme:** `ThemeProvider` + inline `ThemeScript` to avoid flash; `class="dark"` on `<html>`.

### Explicit product split (lesson)

- **Guided lesson** = required 3 questions + progress bar.
- **Extra practice (Alcumus-style)** = optional, separate section and state.
- Labels intentionally generic (“Question 1 of 3”, “Your assignment”) — avoid “Step 1 / warm-up / multiple choice” in visible copy (reduces easy AI anchoring).

---

## 3. Completed vs remaining

### Completed (mockup scope)

- [x] Project scaffold (Next.js, Tailwind, TS, ESLint).
- [x] Global layout, top nav, home page.
- [x] Lesson: video mock, progress rail, 3-question flow, toasts, completion state.
- [x] Lesson: Alcumus-style extra practice (adaptive difficulty).
- [x] Lesson: flashcard review + custom card creation (session-only).
- [x] Parent portal: three-section dashboard (progress, notifications, billing).
- [x] Settings: dark mode.
- [x] Light/dark theming and aligned nav width.
- [x] Assessment copy protection layer (API + canvas + hidden AI instructions + copy blocking).
- [x] Production build passes.

### Remaining (not in mockup — typical next work)

**Backend / data**

- [ ] Real auth (student vs parent roles).
- [ ] Persistent storage (progress, submissions, flashcards, billing, notification prefs).
- [ ] Server-side answer validation and grading (especially long-answer + parent workflow).
- [ ] Real video hosting / progress tracking.
- [ ] Wire parent table to actual student submissions from lesson Q3.

**Frontend polish**

- [ ] README for local dev / env vars.
- [ ] Accessibility pass for canvas questions (e.g. accommodation path with controlled text exposure).
- [ ] Loading/error UX beyond “Loading lesson…” / single error string.
- [ ] Tests (unit for state machines, e2e for lesson flow).

**AI / integrity (known gap)**

- [ ] Client-only guards **do not reliably block** Ask Gemini or similar (can use page context, vision, or general knowledge). Coursera-style hidden prompts help but are not sufficient alone.
- [ ] Possible follow-up: server-delivered questions per session, proctoring, or policy-only (out of scope for pure UI mock).

**Parent / admin**

- [ ] Functional rubric grading, payment integration, email delivery.
- [ ] Sync notification toggles to backend.

**DevOps**

- [ ] CI, deployment, environment config.
- [ ] Rename or duplicate `.cursorrules.md` → `.cursorrules` if tooling should auto-load rules.

---

## 4. Known bugs, limitations, and UI issues

### Addressed recently (verify if regressions appear)

| Issue | Resolution |
|--------|------------|
| Top nav misaligned vs content (`max-w-3xl` vs `max-w-5xl`) | Shared `siteContainerClass` (`max-w-5xl`). |
| Nav blur distracting | Solid `bg-white` / `dark:bg-stone-900`. |
| Visible yellow AI banners ugly | Removed; Coursera-style **hidden** integrity only. |
| `ProtectedText` shadow `attachShadow` crash (Strict Mode) | Replaced with `CanvasText` + open shadow / re-draw logic. |
| Canvas text too small / pixelated on Ctrl+zoom | `ResizeObserver` + `devicePixelRatio` re-rasterize; larger rem-based sizes (+40%). |
| Alcumus mixed up with main lesson | Separated sections; progress bar lesson-only. |

### Open / accepted limitations

1. **Canvas question text** — Students see crisp text, but screen readers only get generic “Question content”; not WCAG-ideal for assessments.
2. **Flashcards** — Plain DOM text; not canvas-protected or API-loaded.
3. **Ask Gemini / in-browser AI** — Still may answer (e.g. “cell wall”) from general knowledge or screen understanding; **not fixable fully on frontend**.
4. **All parent + billing + notifications** — Mock only; no persistence.
5. **Lesson video** — Mock UI only.
6. **Flashcard custom cards** — Lost on refresh (no `localStorage` / API).
7. **MC shuffle** — New order on remount / question change only (expected).
8. **`server-only` package** — Used in `*.server.ts` files; ensure it stays a dependency if build ever fails on clean install (currently builds OK via Next bundling).

### Not started / discussed but deferred

- Server-side grading pipeline for long answers.
- Stronger anti-AI (per-session tokens, no answers in client).
- README and contributor docs.
- Git: repo exists with commits; no deployment docs in tree.

---

## 5. Key file map (quick navigation)

```
app/
  layout.tsx              # Root shell, TopNav, ThemeProvider, max-w-5xl main
  page.tsx                # Home
  lesson/layout.tsx       # AssessmentAiGuard (hidden)
  lesson/page.tsx         # LessonAssessmentProvider → StudentLesson
  parent/page.tsx         # ParentDashboard
  settings/page.tsx       # Dark mode
  api/lesson/assessment/route.ts

components/
  top-nav.tsx
  theme-provider.tsx, theme-script.tsx, dark-mode-toggle.tsx
  lesson/                 # student-lesson, question-panel, lesson-video,
                          # alcumus-practice, flashcard-review, progress rail
  parent/                 # dashboard + sections
  ai-guard/               # canvas-text, assessment-protected, content-integrity,
                          # acknowledgment-checkpoint
  ui/                     # button, switch

lib/
  layout.ts               # siteContainerClass
  lesson/                 # state machines, types, server question banks, shuffle
  parent/mock-data.ts
  ai-guard/               # encode, instructions
  theme.ts
```

---

## 6. Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — use **Lesson**, **Parent**, **Settings** from the nav.

---

## 7. Handoff note for next agent

Treat this repo as a **high-fidelity UI mock** with **mock state** everywhere. The highest-risk area for false expectations is **AI blocking** — document to stakeholders that real integrity needs server-side and policy layers. The highest-value next UX pass is either **real data wiring** (parent ← student submissions) or **accessibility** for canvas-based questions, depending on product priority.
