## Navoro — Complete Product Redesign

This is a very large implementation spanning UI, content architecture, and database. Below is the plan, broken into phases that can be shipped incrementally. **Phase 1 will be implemented in this turn**; Phases 2–4 will follow in subsequent turns to keep changes reviewable and avoid breaking the app mid-build.

---

### Phase 1 — Global cleanup + Home Dashboard "Active Paths" (this turn)

1. **Remove Workplace Inbox everywhere**
   - Delete the inbox section from `src/pages/Careers.tsx`
   - Remove any nav/sidebar links referencing inbox
   - Search the codebase for stragglers (`Inbox`, `dailyScenarios`, etc.) and remove

2. **Home Dashboard — "Your Active Paths" section**
   - Rebuild `src/pages/Dashboard.tsx` so directly under the hero greeting there is a `Your Active Paths` block.
   - For each enrolled career (derived from `user_lesson_progress` joined to `lessons` grouped by `category`):
     - Career title, current level name + number (e.g. "Level 2 — Practitioner")
     - Animated SVG circular progress ring showing % of total path complete (completed lessons / total lessons in category)
     - Current stage name (next incomplete lesson title)
     - Continue button (Dark Green `#064635`) deep-linking to that lesson
     - Row of 5 level pips (gold = complete, green = current, gray outline = future)
   - Empty state card "Start your first career simulation" → CTA to `/careers`

3. **Brand tokens**
   - Verify `index.css` has Dark Charcoal `#111111`, surface `#1A1A1A`, text `#F0F0F0` / `#9A9A9A`, Dark Green `#064635`, Gold `#D4AF37`, Mint `#B7E4C7`. Adjust if missing.

### Phase 2 — Career Content Screen UI (next turn)

- New 3-column layout in `src/pages/Lesson.tsx`: 280px left sidebar (level/stage/task accordion), main task area, 240px right sidebar (colleagues + XP + streak beacon).
- Color-coded task type badges: Document=Teal, Decision=Purple, Briefing=Blue, Meeting=Gold, Lab=Coral.

### Phase 3 — Task type framework + AI feedback (next turn)

- New stage components: `StageDocumentTask`, `StageBriefingRoom`, `StageMeetingSimulation` (extending existing decision/lab components).
- Submission flow: "Reviewing your submission…" loader → feedback panel with Pass / Needs Revision + score + 3–5 structured items.
- Edge function `review-submission` calling Lovable AI Gateway (`google/gemini-2.5-flash`) for Document/Lab feedback.
- Decision Sandbox debrief screen; Meeting Simulation summary screen.

### Phase 4 — Biomedical "CardioSense Pro" 5-level content (next turn)

- Database migration: extend `lessons` with `stage_index`, `stage_name`, `task_type`, `task_index`, `estimated_minutes`, `project_thread` (`'CardioSense Pro'`).
- Seed all Biomedical lessons across Levels 1–5, all stages, all tasks exactly as specified in the brief (≈75 tasks total).
- Wire Stage Complete animation (gold particle burst + colleague comment).

---

### Technical details

- **Data model for "Active Paths"**: in this phase we treat each `lessons.category` the user has any progress in as an "active path". Total = `count(lessons where category=X)`, Completed = `count(user_lesson_progress where user=me, completed=true, lesson in category X)`. Current level = max(level) where any lesson in that level is completed, capped 1–5.
- **Continue link**: lowest `order_index` lesson in the user's current level that is not yet completed; falls back to next level's first lesson.
- **Circular ring**: SVG `<circle>` with `stroke-dasharray` animated via Tailwind `transition-all duration-700`.
- **Pips**: 5 dots; index < currentLevel = gold fill, == currentLevel = green fill, > currentLevel = transparent with `border-muted`.
- **Inbox removal**: also delete unused state/effects in `Careers.tsx`. Verify no other file imports `Inbox` from this page.

---

### Why phased

The full brief (≈75 tasks of bespoke content + 4 new task-type renderers + a 3-column lesson layout + AI review edge function + DB schema additions) is multiple thousand lines of code and content. Shipping it as one mega-edit risks breaking the running app and is hard to review. Phase 1 lands the highest-visibility change you'll see immediately (Home dashboard + inbox gone), and each subsequent phase is a self-contained, testable increment.

After Phase 1 ships, reply "continue" and I'll proceed straight into Phase 2.