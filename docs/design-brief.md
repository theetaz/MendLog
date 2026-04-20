# MendLog — Design Brief

> Paste-ready context for a UI/UX design tool. Start with the **Product in one paragraph** section, then feed the relevant screen(s) you want designed.

---

## Product in one paragraph

MendLog is a mobile app for industrial field technicians who repair factory machinery. Today they fill out paper forms after each repair — machine ID, root cause, corrective action, idle time, parts used, signatures. The paperwork gets skipped or forgotten because they fix multiple machines a day. MendLog replaces the form with a voice memo plus photos: the technician speaks what happened (in Sinhala or English), MendLog transcribes to English (keeping the Sinhala original), uses AI to structure it into the right form fields, and files the job. Past jobs are semantically searchable so when a similar fault happens, the technician can surface his own prior diagnosis.

---

## Who uses it

Field technician, mid-30s, on his feet, in loud factory environments, often with gloves or oily hands, in uneven lighting. Phone is mid-range Android. He opens the app when:

1. A breakdown is reported → starts a Job, takes photos, records voice
2. He needs to remember how he fixed something before → searches
3. End of shift → reviews what got filed
4. Weekly → glances at how productive the week was

---

## Design principles

- **Voice-first, not voice-optional.** The primary action on the new-job screen is a huge record button, not a form field.
- **One-thumb reachable.** Primary actions sit in the bottom 40% of the screen. Top nav is for status, not action.
- **Large targets, generous spacing.** Minimum 48dp touch targets. He might be wearing gloves.
- **Offline is the default assumption.** Show sync state at a glance. Nothing ever blocks on network. Jobs save locally first, sync when possible.
- **Bilingual without clutter.** Sinhala + English UI, user-selectable. Voice input auto-detects. Never force the user to pick a language before recording.
- **No dense paper-form UIs.** The source paper form has 10+ tight fields in a grid. Do NOT replicate that layout on mobile — it's the problem we're solving. Break it into a single-column flow with smart defaults.
- **Honor the source-of-truth format.** Jobs can be exported back to the original F-04-041-2-lk PDF layout for company records. But this is a rendering concern, not a UI concern.

---

## Visual direction (proposal — redirect if you want)

- **Feel**: workwear, honest, functional. Not slick-startup. Not enterprise-grey either. Carhartt-meets-Notion.
- **Palette**
  - Primary navigation/headers: deep industrial blue `#1E3A5F`
  - Primary CTA: hazard-yellow `#F5B800`
  - Background (light): off-white `#FAFAF7`
  - Background (dark): near-black `#0E0E0E` — shop floors are often dim, dark mode matters
  - Status: emerald `#1F9D55` (synced/done), amber `#D97706` (pending), red `#C53030` (error/overdue)
- **Type**: Inter or Geist
- **Corners**: 12–16px radius on cards, 24px on sheets/modals
- **Icons**: Phosphor or Lucide, stroke 1.75

---

## Navigation structure

**Bottom tab bar (5 tabs):**

1. **Home** — today view + quick-new-job CTA
2. **Jobs** — full history, filters
3. **[ + New ]** — center FAB-style tab, opens New Job flow
4. **Search** — semantic search
5. **Me** — stats + settings

**Modals / full-screens pushed over tabs:**

- New Job flow (voice recorder → review → save)
- Job detail
- Camera
- Voice recorder sheet
- PDF export preview
- Settings sub-pages

---

## Screen inventory

### 1. Splash
Logo on `#0E0E0E`, brief auth check, routes to Sign In or Home.

### 2. Sign In
- Email + password OR magic-link (Supabase auth)
- Large "Sign in" button
- "First time? Your admin invited you" helper text
- No sign-up screen — technicians are provisioned by admin

### 3. Permissions Onboarding (first run only)
- Three slides: Microphone, Camera, Photo library
- Each explains *why* in one line
- One "Grant permissions" button per slide; skip only on photo library

### 4. Home
- **Top bar**: "Hello, Nuwan" + sync status dot (green/amber/red)
- **Today card**: big number "3 jobs today", list of today's jobs with time + machine name. Tap → job detail
- **Contribution grid** (compact variant): GitHub-style 12-week heatmap of jobs per day. Max 8 rows tall. Tap any cell → **Day View** (screen 8a). Tap "See full year →" link → Profile tab with the full grid
- **Quick stats row**: this-week jobs, avg idle time, streak
- **Primary FAB**: `+ New Job` (matches center tab; prominent on this screen too)
- **Empty state**: "No jobs yet today — tap + to start."

### 5. New Job — Step 1: Capture
This is the screen that matters most.

- Title: "New Job"
- **Top 30%**: photo grid (2-col), first slot is a camera icon "Add photo". Thumbnails with delete-x on long press
- **Middle 40%**: huge circular record button (~120dp)
  - Idle: microphone icon + "Tap to record"
  - Recording: pulsing ring, live waveform, elapsed timer, "Sinhala"/"English" auto-detect badge
- **Below record button**: list of existing voice clips — each shows duration + "Transcribing…" / "Ready" state
- **Bottom 30%**: "Machine" and "Department" quick-pick chips (pre-populated from recent jobs), plus a "Next →" button (disabled until at least one voice clip OR one filled field exists)

### 6. New Job — Step 2: Review
Auto-generated form fields pre-filled by AI:

- Machine
- Department
- Inventory #
- Date & time reported (auto from device)
- Description of failure (long text)
- Root cause (long text)
- Corrective action (long text)
- Remarks (optional)
- **ABCD breakdown** — 4 numeric fields: Man power (A), Identification (B), Purchase of spare parts (C), Restoration (D) — each hours/minutes
- Total idle time (auto-computed from A+B+C+D or manual override)
- Date & time of completion (default: now)

Each auto-filled field shows a subtle "✨ filled from voice" badge — tappable to see which clip it came from.

Bottom: **[ Re-record ]**  **[ Save ]** — primary is Save.

Error state: if AI couldn't parse a field, show empty field with "⚠ couldn't fill this — tap to type" in the placeholder.

### 7. New Job — Step 3: Sign-off
- **Technician signature**: signature pad OR "Use my saved signature" toggle
- **Team Leader sign-off**: share a link to TL, OR pass the phone for signature, OR skip (filed as "awaiting TL")
- Big "File this job" button at the bottom
- **Success**: confetti-free → "Filed. Job #127 saved." → auto-navigates to Job Detail after 1.5s

### 8. Jobs (List + Calendar)
**Top bar**: search icon, filter icon, and a **view-toggle** on the far right — two segments: `List` / `Calendar`. Remembers last-used view.

**List view** (default):
- Filter icon opens bottom sheet: date range, machine, status {open / awaiting-TL / complete}, department
- List items: horizontal card — left = machine name bold + department small, right = date + small status pill, bottom edge = truncated root-cause snippet. Thumbnail of first photo on the right
- Sticky section headers by date ("Today", "Yesterday", "Last week", "March 2026")
- Infinite scroll
- Empty state: illustration + "No jobs match these filters."

**Calendar view**:
- Monthly grid (Mon–Sun rows), current month by default. Swipe left/right to change months. Small month/year pill at top is tappable → year picker
- Each day cell shows:
  - The date number (top-left)
  - A job count badge (top-right) if there were jobs that day — e.g. "3"
  - A small intensity fill based on job count (same color ramp as the contribution grid on the profile)
  - Today's cell has a ring outline
- Tap a day → **Day View** (screen 8a) opens as a bottom-up full-screen
- Long-press a day → quick peek popover showing the 1–3 machines worked on, with "Open day" button
- Empty-month state: "No jobs logged in March 2026." with a "Jump to today" link
- Sinhala: weekday labels respect locale (Mon → සඳු, etc.) when Sinhala UI is active

### 8a. Day View
Reached from: Jobs → Calendar → tap day, OR Profile contribution grid → tap cell, OR Home "today" card → "See full day".

- **Header**: big date, e.g. "Wednesday, 15 March 2026". Tiny "Today" / "Yesterday" relative label underneath. Left arrow and right arrow on either side of the date to step by ±1 day (swipeable too)
- **Day summary strip**: jobs count, total idle time, first job start → last job end window, unique machines touched. Four compact stat tiles
- **Timeline**: vertical timeline of jobs for that day, ordered by `date & time reported`
  - Each row: time on the left (e.g. "09:14"), then a job card (same `Job card` component, compact variant)
  - Connector line between rows with a small idle-time pill ("2h 30m idle" between jobs)
  - Voice clips and photo count shown as small icons on the card
- **Empty state** (day with no jobs): greyed-out day with "Nothing logged on this day." and two buttons: "Add a job for this date" (back-dated entry) and "Back to calendar"
- **Bottom action**: "Export this day as PDF" (shares a summary sheet — good for weekly reports)

### 9. Job Detail
- **Header**: machine name, dept, date, status pill
- **Photo carousel** (swipeable) at top
- **Voice clips strip**: each clip with play button, language badge, duration
- **Structured fields** laid out as read-only cards, same order as Step 2 review
- **Bottom**: **[ Edit ]** **[ Export PDF ]** **[ Duplicate ]** — secondary actions in a menu
- Offline: "This job hasn't synced yet" banner at top

### 10. Camera (full-screen)
- Strip at the bottom showing already-captured photos for this job
- Shutter button huge. Close (X) top-left. Flash toggle top-right
- After shutter: thumbnail slides into the strip, camera stays open
- "Done (3)" button appears after first shot, bottom-right

### 11. Voice Recorder Sheet (bottom sheet modal)
- Slides up from bottom, ~60% screen height
- Big record button (same as new-job step 1)
- **Live transcript preview**: scrolling text under the button as they speak
- **Language auto-detect pill** at top: "Detected: Sinhala" — tappable to override
- **[ Cancel ]**  **[ Save clip ]** at the bottom

### 12. Search
- **Hero input** at top: "Search past jobs — describe the fault, paste an error code, or add a photo"
- **Camera/image button** inside the search bar (right side) — taps open image picker; selected image shows as a chip inside the input
- If empty: "Recent searches", "Frequent machines"
- **Results**: ranked list with similarity % on the right. Each result shows machine, date, one-line matching snippet with the matched phrase highlighted
- Empty results: "No similar past jobs. This might be a new kind of fault — document it well."

### 13. Search Result Detail
- Same as Job Detail but with an extra "Why this matched" collapsible section at top: "Matched on: 'oil leak near hydraulic pump'" with the specific voice-clip excerpt highlighted
- "Copy diagnosis to new job" button — creates a pre-filled new job

### 14. Me (Profile + Stats)
- **Header**: avatar, name, role, years on the job, "Member since Feb 2024" meta
- **Contribution grid** (this is the GitHub-activity-tracker-style block, and it's a featured element of this screen):
  - Full year (52 weeks × 7 days), rows = weekdays, columns = weeks, reading left-to-right, oldest → newest
  - Color ramp: empty day = neutral-100, 1 job = emerald-200, 2–3 jobs = emerald-400, 4–6 = emerald-600, 7+ = emerald-800 (same ramp reused in the Calendar view day-cell intensity)
  - Month labels above the grid (Jan, Feb, Mar…) aligned to the first week of each month
  - Weekday labels on the left (Mon / Wed / Fri — skip alternating ones to save space)
  - Horizontally scrollable when year doesn't fit screen width; pinch-to-zoom for a denser/wider view
  - **Interactive**:
    - Tap a cell → small popover tooltip: date + "3 jobs on this day" + a "See day" link that opens the **Day View** (screen 8a)
    - Long-press a cell → same tooltip sticks open until dismissed
  - Legend underneath: "Less ▢▢▢▢▢ More"
  - Below the grid, a one-liner summary: "167 jobs in the last year. Longest streak: 14 days. Current streak: 3 days."
- **Year selector**: small chips above the grid — "This year / Last year / 2024" — lets the technician browse history
- **Stat tiles** (2×2 grid below contribution): total jobs, avg idle time, most common root cause, top 3 machines worked on
- **Quick-access row**: `[ Open calendar ]` button that deep-links to Jobs tab → Calendar view, pre-focused on today
- Bottom: link to Settings

### 15. Settings
- Account (email, sign out)
- Language (English / Sinhala / Auto)
- Transcription language preference
- Default signature (draw once, reuse)
- Sync status + "Force sync now"
- Data export (all jobs → ZIP of PDFs + CSV)
- About / version / licenses

### 16. PDF Export Preview
- Renders the job in the exact layout of the original F-04-041-2-lk paper form
- **[ Share ]** **[ Save to device ]**

### 17. Sync / Offline Queue
- List of locally-saved jobs that haven't synced, with per-item retry
- Global "Retry all" button

---

## Shared components

- **Sync status dot** — green / amber / red, top-right on every screen
- **Job card** — used in Jobs list + Home today-section + Day View timeline. Three variants: horizontal (home), full-width (list), compact (timeline)
- **Record button** — used in 3 places; consistent behavior
- **Language badge** — pill showing "සිං" or "EN"
- **Field card** — read-only card in Job Detail. Title small, value prominent, optional "filled from voice" footer
- **Empty state** — illustration + one-line copy + one CTA. Used on every potentially-empty list
- **Contribution grid** — one component, two variants:
  - *Compact*: 12 weeks, used on Home
  - *Full*: 52 weeks with month + weekday labels, year selector, legend, used on Profile
  - Both share the same color ramp and tap-to-open-Day-View interaction
- **Monthly calendar grid** — used in Jobs → Calendar view. 6-row × 7-col month grid with per-day job-count badge + intensity fill. Swipeable month-to-month
- **Day stepper header** — used in Day View. Big date + ±1 day arrows, swipe-navigable

---

## States to design for

Every screen must have these variants:

1. **Loading** — skeleton rows, not spinners
2. **Empty** — illustration + helpful copy + one CTA
3. **Error** — inline banner with retry, never a blocking alert
4. **Offline** — persistent top banner + disabled-remote-actions + local-save indication
5. **Sinhala mode** — all UI text reflows; nothing truncates or clips

---

## Out of scope for v1 (don't design these yet)

- Team Leader dashboard / admin app
- Multi-tenant company switching
- Notifications center
- In-app messaging

---

## Key UX details not to miss

- Recording can happen at any step — not locked to "new job." Users may add a voice clip to an existing job
- Record button behavior: **tap-to-toggle** (not hold-to-record), because gloves + long recordings
- Photos should be compressable client-side before upload
- "Filed from voice" badges on auto-filled fields build trust and let users verify quickly
- The original paper form is in the repo under `docs/reference/` for field reference — don't replicate its layout, just its data model
