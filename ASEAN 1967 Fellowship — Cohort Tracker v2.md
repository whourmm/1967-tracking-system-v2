**ASEAN 1967 Fellowship — Cohort Tracker v2**

*Rebuild specification & team task brief*

SEA Bridge Institute of Entrepreneurship · *Build Bold. Own Origins. Go Global.*

# **1\.  Executive summary**

The current site (int-asean1967.seabridge.space) is a read-only, single-surface cohort tracker built on six tabs — Fellows Roster, Capacity & Schedule, Teams, Cases Bank, Program Resources, Program Overview — with a static header of stat tiles and a single global sign-out. The data behind it is presumably maintained by hand in Google Sheets / Forms.

v2 keeps every feature that's already there, regroups them around the people who use them, and adds three big capabilities the program operations team has asked for:

•       Real authentication with role separation — Admin and Fellow surfaces become distinct apps living at different routes.

•       Admin CRUD — the cohort tracker becomes the source of truth instead of a mirror of a Google Sheet.

•       Google Form / Apps Script submission tracking — automatic visibility into who has and hasn't submitted each required form.

This document is structured so each module can be handed to one full-stack engineer end-to-end. The companion spreadsheet (Cohort\_Tracker\_v2\_Task\_Assignments.xlsx) is the row-per-use-case version ready for owner/priority/status assignment.

# **2\.  Brand & color system**

Palette extracted from the existing site so the new build stays visually continuous. The brand is red-dominant; every module reuses the same palette but is anchored by a different shade as its theme color (see Section 4).

| Swatch | Name | Hex | Used for |
| :---- | :---- | :---- | :---- |
|   | Brand Red | \#DC2626 | Primary brand. Logo, links, CTAs, active tab underline, COHORT TRACKER pill |
|   | Deep Red | \#991B1B | High-emphasis highlights. Gen SEA Summit week, early-start markers |
|   | Mid Red | \#EF4444 | Hover / active states, heatmap mid-saturation |
|   | Soft Pink | \#FCA5A5 | Availability heatmap (available weeks), badge fills |
|   | Pale Pink | \#FEE2E2 | Icon backgrounds on Program Resources cards |
|   | Charcoal | \#111827 | Primary text, footer background |
|   | Slate | \#6B7280 | Secondary text, labels, meta info |
|   | Border Grey | \#E5E7EB | Card borders, table grid lines |
|   | Surface | \#F9FAFB | Section backgrounds, card surfaces |
|   | Green | \#10B981 | Status: Confirmed, Active |
|   | Amber | \#F59E0B | Status: Pending, submission-tracker attention |

 

*Type and surface guidance: stay with the current black/grey type scale, white card surfaces on a very light grey page background, 1px Border-Grey card outlines, and a Charcoal footer. Status pills use Green / Amber / Red consistently across every screen.*

# **3\.  Module map**

Six modules. Each has a color anchor that should be used as its accent in nav highlights, badges, and dashboard cards. Total use cases and how many are net-new shown below.

| ID | Color | Module | \# Use cases | \# New |
| :---- | :---- | :---- | :---- | :---- |
| **M01** |   | **Authentication & Access Control** | 6 | **5** |
| **M02** |   | **Public Page** | 5 | **1** |
| **M03** |   | **Fellow (Intern) Portal** | 10 | **3** |
| **M04** |   | **Admin Portal** | 12 | **12** |
| **M05** |   | **Google Form / Apps Script Submission Tracker** | 7 | **7** |
| **M06** |   | **Shared Components & Cross-cutting** | 8 | **3** |

# **4\.  Modules in detail**

Each module below is a candidate hand-off to one full-stack engineer. Within a module the use cases are mid-level briefs — enough for the engineer to scope, but not a line-by-line spec. They'll write acceptance criteria as they pick up tickets.

   
**M01  ·  Authentication & Access Control**

| Theme color  \#991B1B |
| :---- |

 

Gatekeeper for the entire app. Replaces the current single 'Sign out' button with real account-level auth and role separation, so Admin and Fellow surfaces can diverge safely.

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M01.1** | **Sign in** | All users | Email \+ password, plus Google SSO (most fellows already have a Google account from the application form). Session cookie / JWT. Remember me. | **NEW** |
| **M01.2** | **Sign out** | All users | Clears session, redirects to public landing. Already exists in the header — keep button position. | Existing |
| **M01.3** | **Password reset** | All users | Forgot-password flow with one-time email link, token expiry, new password set. | **NEW** |
| **M01.4** | **Role-based access (RBAC)** | System | Roles: Public, Fellow, Admin, Super-Admin. Middleware enforces page \+ API access. Admin routes 403 for fellows and vice versa. | **NEW** |
| **M01.5** | **Account provisioning** | Admin | Admin invites a fellow by email after they're accepted. Invite link prompts them to set a password. Auto-links to their fellow profile. | **NEW** |
| **M01.6** | **Profile & password edit** | Fellow / Admin | Self-service: change name, nickname, photo, email, password. Audit logged. | **NEW** |

   
**M02  ·  Public / Marketing Pages**

| Theme color  \#DC2626 |
| :---- |

 

Pre-login surface for prospective fellows. Today these live on Notion \+ a Google Form — we keep linking out to those, but wrap them in branded landing pages so the funnel feels owned.

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M02.1** | **Landing / Fellowship Info** | Public | Hero, tagline 'Build Bold. Own Origins. Go Global.', program pitch, key dates, link to apply. Replaces (or wraps) the Notion fellowship info page. | Reorg |
| **M02.2** | **Apply page** | Public | Embeds or deep-links the Google Form application. Tracks click-through for funnel analytics. | Reorg |
| **M02.3** | **About / Program Overview** | Public | Public-facing version of the 4H / TeamFlow / WFACE / Tracks / Awards reference (currently behind login on the Program Overview tab). | Reorg |
| **M02.4** | **Cohort showcase** | Public | Optional: sanitized roster (names \+ country \+ university only, no contact info) to advertise the cohort. Off by default; admin toggle. | **NEW** |
| **M02.5** | **Contact / Footer** | Public | Footer block from current site (tagline, socials, nextgen@ \+ team@ emails). Reusable across all pages. | Existing |

   
**M03  ·  Fellow (Intern) Portal**

| Theme color  \#EF4444 |
| :---- |

 

What a logged-in fellow sees. Groups today's 6 tabs into a personal-first layout (My Dashboard first, then the reference tabs). Adds personal context everywhere (highlight me, my team, my deliverables).

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M03.1** | **My Dashboard** | Fellow | Landing page after login. Cards: my next sprint, my team, my open deliverables, submission status (links to M05), upcoming key dates, announcements. | **NEW** |
| **M03.2** | **Fellows Roster** | Fellow | Existing roster: 58 rows, search, country & TeamFlow filters, availability heatmap, sortable columns, Confirmed badge. Personal contacts stay hidden by default. | Existing |
| **M03.3** | **Cohort Stats Header** | Fellow | The 6 stat tiles (58 Fellows, 9 Countries, 41 Universities, 52 Confirmed, 4+ Sprints, Gen SEA Summit dates). Each tile drills into the relevant view. | Existing |
| **M03.4** | **Capacity & Schedule** | Fellow | Active-fellows-per-week bar chart, cohort-by-country chart, sprint schedule grid (Groups 1, 1.5, 2, 3), Key Dates, per-fellow availability heatmap. Highlight current fellow's row. | Existing |
| **M03.5** | **Teams** | Fellow | Sprint team cards (4–5 fellows, Finisher mandatory, ≥3 nationalities). Sprint dropdown. Pin 'My Team' to top across sprints. Sanitized fields only. | Existing |
| **M03.6** | **Cases Bank** | Fellow | Browse case briefs filtered by WFACE industry / type / sub-theme. Each card: sponsor, due date, scope, status. Add 'assigned-to-me' filter. | Existing |
| **M03.7** | **Program Resources** | Fellow | Apply/Learn-More cards (Notion \+ Form) and Cohort Resources cards (Handbook, Calendar, Case Briefs, Group Assignments, Mentor List). Replace 'coming soon' with live links as ready. | Existing |
| **M03.8** | **Program Overview** | Fellow | Reference cards: 4H Profile, TeamFlow Archetypes, WFACE Industries, Case Sub-themes, Project Tracks, Team Composition Rules, Support Structure, Awards. | Existing |
| **M03.9** | **My Submissions** | Fellow | Personal view of M05 form-tracker data: which Google Forms I've submitted, which I owe, deadlines, status badge (Submitted / Pending / Late). | **NEW** |
| **M03.10** | **Notifications & deadlines** | Fellow | In-app \+ email reminders for upcoming sprint kickoffs, submission deadlines, mentor check-ins. Toggle preferences. | **NEW** |

   
**M04  ·  Admin Portal**

| Theme color  \#111827 |
| :---- |

 

Separate URL space (/admin) gated by Admin role. Today everything is read-only — admins are presumably editing a Google Sheet or backend by hand. This module is the CRUD layer so the cohort tracker becomes the source of truth.

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M04.1** | **Admin Dashboard** | Admin | Top-level health: confirmed vs pending fellows, submission rates, sprint-ready teams, alerts (missing Finisher, dropoffs, late submissions). | **NEW** |
| **M04.2** | **Fellow Management** | Admin | CRUD on fellow profiles. Fields: name, nickname, country, university, major, TeamFlow tags, status (Confirmed / Pending / Dropped), early-start date, availability cells, contact details. | **NEW** |
| **M04.3** | **Team Builder** | Admin | Drag-and-drop or auto-suggest sprint teams. Validates composition rules (4–5 fellows, ≥1 Finisher, ≥3 nationalities, full reshuffle per sprint). Saves per-sprint snapshots. | **NEW** |
| **M04.4** | **Case Management** | Admin | CRUD on Cases Bank entries: title, WFACE industry, type, sub-theme, phase, sponsor, due date, description, status, assigned teams. | **NEW** |
| **M04.5** | **Sprint & Schedule Mgmt** | Admin | Define sprints, learning weeks, key dates. Drives the Capacity & Schedule view and the team-builder timeline. | **NEW** |
| **M04.6** | **Program Resources Mgmt** | Admin | Add / edit / order resource cards (handbook, calendar, mentor list…). Mark 'coming soon' vs live URL. Icon picker. | **NEW** |
| **M04.7** | **Mentor Management** | Admin | Alumni mentors, industry mentors, SEA Bridge coordinators. Assign per team per sprint. Stores expertise tags for matching. | **NEW** |
| **M04.8** | **Awards Management** | Admin | Track Certificate of Completion (auto-eligible rules), Outstanding Fellow nominations \+ peer-vote tallies, Founder's Spirit selections. Export winners list. | **NEW** |
| **M04.9** | **Form-Submission Tracker UI** | Admin | Admin view of M05 data: per-fellow x per-form matrix, filters, send reminder button, CSV export. (Engine lives in M05.) | **NEW** |
| **M04.10** | **User & Role Management** | Super-Admin | Invite / suspend admins and fellows. Reset passwords. Assign roles. Audit-log viewer. | **NEW** |
| **M04.11** | **Reports & Exports** | Admin | One-click CSV / Excel exports for roster, teams, submissions, awards. Used for end-of-cohort reports. | **NEW** |
| **M04.12** | **Branding & Cohort Settings** | Admin | Cohort name, tagline, dates, summit week, hero stats, logo, footer links. Editable so the same app can be reused next cohort year. | **NEW** |

   
**M05  ·  Google Form / Apps Script Submission Tracker**

| Theme color  \#F59E0B |
| :---- |

 

Net-new system. Each Google Form fellows are asked to submit (application, weekly check-ins, sprint deliverables, etc.) gets a small Apps Script trigger that pings our API. We store the submission and surface 'who has / hasn't submitted' to both fellows and admins.

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M05.1** | **Apps Script webhook setup** | Engineer / Admin | Standard Apps Script snippet attached to each Form's onFormSubmit. Posts {formId, fellowEmail, timestamp, responseId} to /api/submissions/ingest with a shared secret header. | **NEW** |
| **M05.2** | **Ingest endpoint** | System | Auth-verified POST endpoint. Validates secret, matches fellowEmail to a fellow record, upserts a Submission row. Idempotent on responseId. | **NEW** |
| **M05.3** | **Form registry** | Admin | Admin lists each tracked Form: title, Google Form URL, deadline, audience (all / specific group), required-yes/no. Used to compute 'who owes what'. | **NEW** |
| **M05.4** | **Per-fellow status matrix** | Admin | Form × Fellow grid: green \= submitted, amber \= pending (deadline not passed), red \= late. Sort and filter by sprint, group, country. | **NEW** |
| **M05.5** | **Fellow self-view** | Fellow | Surfaced as M03.9. Lists tracked forms with personal status, deadline, direct submit link, last-submitted timestamp. | **NEW** |
| **M05.6** | **Reminders** | Admin / System | Manual 'Send reminder' (email or in-app) from admin matrix. Optional automated reminder N days before deadline. | **NEW** |
| **M05.7** | **Submission analytics** | Admin | Submission-rate-over-time chart, per-form completion %, slowest groups. Drives dashboard widget M04.1. | **NEW** |

   
**M06  ·  Shared Components & Cross-cutting**

| Theme color  \#6B7280 |
| :---- |

 

Building blocks reused everywhere. Pull these out first so Admin and Fellow surfaces stay consistent and the team can parallelise.

 

| ID | Use case | Audience | What it does | Origin |
| :---- | :---- | :---- | :---- | :---- |
| **M06.1** | **Header / Top bar** | Both | Logo \+ program title \+ cohort badge \+ stat tiles \+ sign-out. Variants: Public (no stats / no signout), Fellow, Admin (admin badge). | Reorg |
| **M06.2** | **Footer** | All | Brand block, social links, contact emails, program links, confidentiality strip. From current site. | Existing |
| **M06.3** | **Search & filter primitives** | All | Search input \+ multi-select dropdowns used by Roster, Cases, Teams, Submissions. Single reusable component. | Reorg |
| **M06.4** | **Availability heatmap** | Both | Week-by-fellow grid with dark-red/mid-red/grey legend and bordered summit week. Used in Capacity & Schedule and submission matrix. | Existing |
| **M06.5** | **Status badges** | All | Confirmed / Pending / Active / Submitted / Late etc. Standardise colors against palette so every screen reads the same. | Reorg |
| **M06.6** | **Data export utility** | Admin | Server-side CSV \+ XLSX export shared by Fellow, Team, Case, Submission lists. Honours current filters. | **NEW** |
| **M06.7** | **Audit log** | Super-Admin | Append-only log of admin actions (created/edited/deleted entities, role changes, reminder sends). Viewable in M04.10. | **NEW** |
| **M06.8** | **Email / notification service** | System | Wrapper around SES/SendGrid for password resets, fellow invites, deadline reminders, admin alerts. Templates centralised. | **NEW** |

 

# **5\.  Suggested team assignment**

Because every engineer is full-stack, the cleanest cut is one module per person with shared modules built first as a pair-programmed foundation. Suggested ordering:

| Phase | Scope |
| :---- | :---- |
| **Phase 0 — Foundation (1 week, all engineers)** | M06 Shared Components, M01 Authentication. Lay the groundwork so M02–M05 can be built in parallel without colliding on header/footer/RBAC. |
| **Phase 1 — Core surfaces (3–4 weeks, parallel)** | Engineer A: M02 Public.  Engineer B: M03 Fellow Portal (read-side).  Engineer C: M04 Admin Portal (CRUD).  Engineer D: M05 Submission Tracker (Apps Script \+ ingest \+ matrix). |
| **Phase 2 — Integration (1 week, all engineers)** | Wire M05 into M03.9 and M04.9. Wire M04 CRUD into M03 reads. Add dashboard widgets (M04.1, M03.1). UAT with the program ops team. |
| **Phase 3 — Polish (1 week)** | Notifications (M03.10, M06.8), exports (M06.6, M04.11), audit log (M06.7, M04.10), accessibility pass, mobile responsiveness. |

 

## **Non-negotiables / acceptance bar**

•       Admin and Fellow surfaces live at separate route prefixes (/admin vs /app), gated by role middleware. A logged-in fellow hitting /admin gets a 403; a logged-in admin sees a sidebar to switch contexts.

•       Every Google Form fellows submit must be registered in M05.3 and have the Apps Script webhook attached. The 'who has submitted' status is the source of truth, not the form's own response sheet.

•       All copy and screen behaviour from the current six tabs must be present in v2 — nothing gets dropped, only regrouped.

•       The 11 status colors in Section 2 are the only colors used for state. No ad-hoc colors.

•       The same app can be reused for the next cohort by editing M04.12 (Branding & Cohort Settings) — no code change.

