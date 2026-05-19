# Your Science Guide (YSG) — Project Handover

Last updated: May 2026  
Repository: `your-science-guide` — Next.js 15 App Router **frontend mockup** with **browser-local persistence** for student progress and admin content. No production backend, database, or real auth service.

---

## 1. Exact current state of the mockup

### Stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3, shadcn-style primitives (`Button`, `Switch`, CVA, Radix Slot) |
| Font | DM Sans (`next/font/google`) |
| Icons | `lucide-react` |
| Rules | `.cursorrules.md` (YSG Frontend Rules) |

### Authentication (mock lock screen)

All routes are gated by a **full-screen sign-in** (`components/auth/sign-in-screen.tsx`) until the user authenticates. Session is stored in **`sessionStorage`** (tab-scoped).

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Student | `username` | `password` | Student, Parent, Settings |
| Admin | `admin` | `password` | Same + **Admin** nav link and `/admin` |

- Sign out: **Settings → Account → Sign out** (returns to lock screen).
- Non-admin users who open `/admin` see an access-denied message (nav still visible).

### Routes

| Path | Purpose |
|------|---------|
| `/` | Home — links to Student and Parent portal |
| `/student` | **Student hub** — course cards |
| `/student/[courseId]` | **Curriculum** — units, lessons, completion badges, companion textbook |
| `/student/[courseId]/[lessonId]` | **Lesson** — readings, video, assignment, links to practice/flashcards |
| `/student/.../practice` | **Extra Practice** (Alcumus-style), per lesson |
| `/student/.../flashcards` | **Flashcard Review** (Anki-style), per lesson |
| `/parent` | Parent portal dashboard |
| `/settings` | Dark mode + sign out |
| `/admin` | **Admin** content builder (admin role only) |
| `/api/lesson/assessment` | GET — base64-encoded default lesson + Alcumus payloads |

**Redirects** (`next.config.ts`): legacy `/lesson` paths redirect to `/student` (and default biology lesson for old flat practice/flashcard URLs).

### Global shell

- **Auth**: `AuthProvider` + `AuthShell` wrap the app in `app/layout.tsx` (nav hidden until signed in).
- **Top nav** (`components/top-nav.tsx`): sticky, solid white / stone, `max-w-5xl` via `lib/layout.ts` → `siteContainerClass`.
- Links: **Student**, Parent, Settings; **Admin** appears only when signed in as admin.
- **Theme**: default light (sky + white); dark mode in Settings (`localStorage` key `ysg-theme`).

### Student experience

#### Hub (`/student`)

Lists courses from **admin content store** (merged with seed). Default seed: **Biology · Year 1** (`biology-year-1`), 8 lessons across 5 units.

#### Curriculum (`/student/[courseId]`)

- Sticky **course progress rail** (% complete across lessons).
- **Companion textbook** card (mock cover SVG + metadata from `lib/student/textbook.ts`).
- Lesson list by unit with **Not started / In progress / Complete** badges and partial assignment % when in progress.
- Progress read from **`localStorage`** (`ysg-lesson-progress`).

#### Lesson (`/student/[courseId]/[lessonId]`)

Wrapped in `LessonShell` → `LessonAssessmentProvider` (fetches API, merges **per-lesson** admin overrides from `localStorage`).

Top to bottom:

1. **Lesson progress rail** — guided assignment only (3 questions).
2. **Lesson nav** — back to course, unit/title, Previous/Next lesson.
3. **Required readings** — textbook sections/pages before video (`components/student/required-readings.tsx`).
4. **Lesson video** — mock player **or** HTML5 `<video>` if admin uploaded a file for this lesson.
5. **Your assignment** — 3 questions (`QuestionPanel` + `lib/lesson/state-machine.ts`); progress persisted per lesson in `localStorage`.
6. CTA cards → **Extra Practice** and **Flashcard Review** (separate routes).

**Question display:** `CanvasText` rasterization (`variant`: `body` for assignment prompts, `prompt` for Alcumus stems, `option` for choices). Sizes (× root rem): **body 1.25**, **prompt 1.875**, **option 1.125**.

**Assignment defaults:** server seed in `lib/lesson/questions.server.ts`; admin can override per lesson in Admin → Assignment questions.

#### Extra Practice (`.../practice`)

- AoPS Alcumus-style adaptive problems (`lib/lesson/alcumus-machine.ts`).
- Sticky **mastery progress rail** + **Back to lesson**.
- State in **`sessionStorage`** per lesson (`ysg-alcumus-state-{courseId}-{lessonId}`).
- Problems: API seed merged with admin per-lesson overrides.

#### Flashcards (`.../flashcards`)

- Anki-style: show answer → rate Again/Hard/Good/Easy; deck stats (New/Learning/Review).
- Sticky mastery rail + back to lesson.
- Deck in **`sessionStorage`** per lesson (`ysg-flashcard-deck-state-...`).
- User can add cards in-session.

### Parent portal (`/parent`)

Unchanged mock: tabs (mobile) / sidebar (`lg+`). Sections: student progress (static table + rubric), notifications toggles, subscription card. Data: `lib/parent/mock-data.ts`. **Not wired** to student submissions or admin content.

### Admin (`/admin`)

Tabbed dashboard (`components/admin/admin-dashboard.tsx`). All edits persist to **`localStorage`** (`ysg-admin-content`) and broadcast via `ysg-content-updated` event.

| Tab | Capabilities |
|-----|----------------|
| **Curriculum & lessons** | Add courses; add/edit lessons (title, description, unit, order) |
| **Assignment questions** | Edit 3 questions per lesson (MC, short, long); answers and min length |
| **Extra practice (Alcumus)** | Per-lesson problem list: level 1–5, type, prompt, options/answers, hints; add/remove |
| **Lesson videos** | Title, description, file upload (data URL, **25 MB** mock cap) |

**Reset all content** restores seed defaults in `localStorage`.

### AI / integrity (lesson layout only)

`app/student/[courseId]/[lessonId]/layout.tsx` mounts hidden `AssessmentAiGuard` (off-screen integrity copy, honeypot checkpoint, copy blocking on assessment chrome). Question banks still decoded in the browser after fetch.

### Build status

`npx tsc --noEmit` passes. Run `npm run build` before deploy.

---

## 2. Core architectural and UI decisions

### Product / UX (from `.cursorrules.md`)

- **Simplicity and educational impact** over feature breadth.
- **No clutter** — no ads or decorative chrome; section cards + clear hierarchy only.
- **Same-tab navigation** — `next/link` only; never `target="_blank"`.
- **Whitespace and readable typography** for students.
- **Tailwind + shadcn-style** components for a consistent minimal UI.

### Information architecture (implemented)

- **Student** is the top-level learning area (not a single “lesson” page).
- **Course → lesson** mirrors a year-long curriculum (e.g. biology).
- **Lesson**, **Extra Practice**, and **Flashcards** are **separate pages** with their own mastery rails and back navigation.
- **Textbook** is surfaced on the curriculum page and as **required readings** before each lesson video.
- **Guided assignment** progress is independent from Alcumus/flashcard mastery.

### Visual design

- **Default:** sky blue + white (`sky-50`, `sky-600` buttons, `slate` text).
- **Dark:** stone palette (Settings).
- **Layout width:** `max-w-5xl` for nav and main (`siteContainerClass`).
- **Top nav:** solid background (no blur/glass).

### Technical patterns

- **App Router** with nested dynamic segments for course/lesson.
- **Client state machines** for lesson flow and Alcumus (`lib/lesson/state-machine.ts`, `alcumus-machine.ts`, `flashcard-machine.ts`).
- **Server-only default banks** + client fetch (`/api/lesson/assessment`) + **localStorage overrides** for admin edits.
- **Canvas-rendered assessment text** for lesson/Alcumus (tradeoff: limited screen-reader access to exact wording).
- **Browser persistence (mock “backend”):**
  - `ysg-auth-session` / `ysg-auth-role` — sessionStorage
  - `ysg-lesson-progress` — localStorage
  - `ysg-admin-content` — localStorage (courses, questions, Alcumus, videos)
  - `ysg-alcumus-state-*`, `ysg-flashcard-deck-state-*` — sessionStorage per lesson
  - `ysg-theme` — localStorage

### Explicit product splits

| Concern | Tracks |
|---------|--------|
| Lesson assignment | 3 questions, lesson progress rail |
| Extra practice | Alcumus level + mastery rail |
| Flashcards | Anki deck mastery rail |
| Course | Aggregate lesson completion on curriculum page |

---

## 3. Completed vs remaining

### Completed (mockup scope)

- [x] Next.js scaffold, Tailwind, TypeScript, ESLint.
- [x] Global layout, top nav, home, settings (dark mode).
- [x] **Sign-in lock screen** (student + admin mock credentials).
- [x] **Student hub** and **course curriculum** with lesson status (not started / in progress / complete).
- [x] **Per-lesson pages** with nav, readings, video, assignment, practice + flashcard routes.
- [x] **Textbook** on curriculum + required readings per lesson.
- [x] Lesson video mock player + **admin video upload** playback.
- [x] Alcumus-style extra practice (adaptive, mastery bar, per-lesson storage).
- [x] Anki-style flashcards (rating buttons, per-lesson deck).
- [x] **Admin dashboard** — curriculum, assignment questions, Alcumus, videos.
- [x] **localStorage** lesson progress across sessions (same browser).
- [x] Parent portal mock (three sections).
- [x] Assessment copy protection layer (API + canvas + hidden AI hooks).
- [x] Legacy `/lesson` redirects.
- [x] Typecheck passes.

### Remaining (not in mockup — typical next work)

**Backend / real product**

- [ ] Real authentication (OAuth, sessions, password reset, role management).
- [ ] Database for courses, lessons, questions, videos, progress, submissions.
- [ ] Server-side answer validation and long-answer grading workflow.
- [ ] Wire **parent portal** to real student submissions and course progress.
- [ ] Email notifications (lesson complete, grading).
- [ ] Real video hosting (CDN, transcoding) instead of data URLs in `localStorage`.
- [ ] Multi-device sync (admin edits and student progress currently **per browser only**).

**Frontend polish**

- [ ] README for env vars, deployment, and content authoring workflow.
- [ ] Accessibility pass for canvas questions (accommodation path with readable text).
- [ ] `generateMetadata` for admin-created courses/lessons (server still uses seed `getCourse` / `getLesson`).
- [ ] Loading/error UX beyond simple strings.
- [ ] Tests (state machines, lesson flow, admin editors).
- [ ] Admin: textbook/readings editor; flashcard seed per lesson; duplicate lesson/course.

**AI / integrity**

- [ ] Client-only guards do **not** block in-browser AI or vision tools reliably.
- [ ] Stronger model needs server-delivered questions, proctoring, or policy (out of UI-only scope).

**DevOps**

- [ ] CI pipeline, staging/production deploy docs.
- [ ] Confirm `server-only` usage in `*.server.ts` if clean installs ever fail (build currently OK).

---

## 4. Known bugs, limitations, and UI issues

### Addressed in recent sessions (watch for regressions)

| Issue | Resolution |
|--------|------------|
| Nav label “Lesson” / flat `/lesson` route | Renamed to **Student**; nested `/student/[courseId]/[lessonId]` routes. |
| Extra practice & flashcards inline on one page | Moved to **dedicated routes** with mastery bars and back links. |
| No curriculum navigation or completion state | Course page with units, badges, `localStorage` progress. |
| No sign-in | Full-screen lock; student vs admin roles. |
| Assignment question font too small (matched `text-sm`) | `CanvasText` **`body`** variant at 1.25rem; then user reported **both assignment and Alcumus too small** — bumped to **body 1.25**, **prompt 1.875**, **option 1.125** (May need further tuning). |
| Top nav / content width mismatch | Shared `siteContainerClass` (`max-w-5xl`). |
| Nav blur | Removed; solid backgrounds. |
| Visible AI banners | Hidden integrity components only. |
| Canvas zoom blur | `ResizeObserver` + `devicePixelRatio` redraw. |
| JSX `motion` typos during rapid edits | Grep shows **no remaining `motion` tags** in repo; fix if TypeScript/compile errors reappear. |

### Open / accepted limitations

1. **Persistence is browser-local only** — admin content, lesson progress, uploads, and Alcumus/flashcard state do not sync across devices or users.
2. **`localStorage` quota** — admin video uploads as data URLs can fill storage quickly; 25 MB cap in admin UI is a soft guard only.
3. **Canvas assessment text** — Screen readers get generic labels, not full question text (WCAG gap).
4. **Parent portal** — Static mock; no link to student `localStorage` or admin store.
5. **API assessment route** — Still returns **global** seed payloads; per-lesson customization happens **client-side** after fetch.
6. **Flashcard readings** — Still seed-based in `lib/student/textbook.ts`; not editable in Admin.
7. **In-browser AI** — Cannot be fully prevented on the frontend.
8. **MC option shuffle** — New order on remount (by design).
9. **Unused file** — `components/lesson/lesson-progress.tsx` (superseded by `lesson-progress-rail.tsx`) — safe to delete when cleaning up.
10. **Course page server metadata** — May be generic for admin-only courses until server reads shared store or metadata is client-driven.

### Was about to fix / likely next UI pass

- **Assessment & Alcumus font size** — User reported both were “way too small” after `body` variant tied assignment to `text-sm`; sizes were increased but **verify visually** on real displays and adjust `CanvasText` rem multipliers if needed.
- **Fine-tune** mastery formulas or progress copy if stakeholders want different “complete” semantics.
- **Admin → student parity** — Ensure new courses/lessons always resolve on student routes without relying on seed-only server checks (lesson pages no longer `notFound()` on missing seed; curriculum uses client store).

---

## 5. Key file map

```
app/
  layout.tsx                          # Theme + AuthProvider + AuthShell
  page.tsx                            # Home
  student/page.tsx                    # Student hub
  student/[courseId]/page.tsx         # Curriculum
  student/[courseId]/[lessonId]/
    layout.tsx                        # AssessmentAiGuard + LessonShell
    page.tsx                          # StudentLesson
    practice/page.tsx                 # ExtraPracticePage
    flashcards/page.tsx               # FlashcardReviewPage
  parent/page.tsx
  settings/page.tsx
  admin/page.tsx                      # AdminDashboard
  api/lesson/assessment/route.ts

components/
  auth/                               # sign-in, auth-provider, auth-shell
  admin/                              # dashboard + curriculum, assignment, alcumus, video panels
  student/                            # hub, curriculum, lesson-nav, readings, textbook, progress hooks
  lesson/                             # student-lesson, question-panel, video, alcumus, anki, rails
  parent/                             # dashboard + sections
  ai-guard/                           # canvas-text, protected, integrity, assessment-ai-guard
  top-nav.tsx, theme-*, ui/

lib/
  auth/                               # mock credentials, sessionStorage session
  admin/content-store.ts              # localStorage CMS mock
  student/                            # curriculum seed/types/client, paths, lesson-progress, textbook
  lesson/                             # state machines, types, server banks, flashcard seed
  parent/mock-data.ts
  layout.ts                           # siteContainerClass
  ai-guard/

public/textbooks/                     # biology-fundamentals-cover.svg
```

---

## 6. Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

| Task | Credentials |
|------|-------------|
| Student flow | `username` / `password` |
| Admin CMS | `admin` / `password` |

Default course: `/student/biology-year-1`  
Example lesson: `/student/biology-year-1/cells-introduction`

---

## 7. Handoff note for the next agent

Treat this repo as a **high-fidelity UI mock** with a **browser-local CMS** for admins and **localStorage progress** for students. Do not assume multi-user or deployed persistence works without a real API.

**Highest-risk misconception:** AI/copy blocking “stops cheating” — it only raises friction; server and policy layers are still required.

**Highest-value next steps (pick one track):**

1. **Real backend** — auth, Postgres (or similar), API for content + progress + parent submissions.  
2. **Polish** — font/accessibility, metadata, README, delete dead files, E2E tests.  
3. **Parent wiring** — read student progress and Q3 submissions from the same store/API admin uses.

When editing assessment UI, test **`CanvasText` variants** at 100% and 125% browser zoom — that is where readability issues were reported.
