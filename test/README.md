# Your Science Guide — unit tests

Vitest unit tests for core business logic in `lib/`. React pages and API routes are covered indirectly through these pure functions and state machines.

## Run tests

```bash
npm test          # single run
npm run test:watch  # watch mode
npm run test:coverage  # with coverage report
```

## Layout

```
test/
  setup.ts                 # localStorage mock, per-test cleanup
  helpers/
    factories.ts           # shared test fixtures
  unit/
    lesson/                # answers, state machines, flashcards
    admin/                 # content store, CSV import, lesson keys
    cms/                   # Supabase payload mapping
    student/               # curriculum, paths, progress, history
    family/                # student profiles
    guest/                 # preview tiers and limits
    billing/               # subscription helpers
    ai-guard/              # assessment encoding
    utils.test.ts
```

## What is tested


| Area     | Modules                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Lessons  | `validate-answer`, `fill-in-blank`, `state-machine`, `alcumus-machine`, `shuffle-multiple-choice`, `flashcard-machine`, `progress-labels` |
| Admin    | `content-store`, `csv-questions`, `lesson-key`, `textbook-cover`                                                                          |
| CMS      | `question-payload` round-trips                                                                                                            |
| Students | `curriculum`, `curriculum-client`, `paths`, `textbook`, `lesson-progress`, `question-history.types`                                       |
| Family   | `format-student`, `active-student`, constants                                                                                             |
| Guests   | `lesson-tiers`, `guest-progress`                                                                                                          |
| Billing  | `subscription`                                                                                                                            |
| AI guard | `encode`                                                                                                                                  |


## Not covered here (integration / E2E)

- Clerk authentication flows
- Supabase CMS read/write (`lib/cms/*.server.ts`)
- Mux video upload API routes
- React component rendering (add `@testing-library/react` later if needed)

