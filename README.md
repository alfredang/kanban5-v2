# kanban5-v2 — IT PMO Kanban Board

[![CI and deploy](https://github.com/alfredang/kanban5-v2/actions/workflows/pages.yml/badge.svg)](https://github.com/alfredang/kanban5-v2/actions/workflows/pages.yml)
[![Live site](https://img.shields.io/badge/live-alfredang.github.io%2Fkanban5--v2-2ea44f)](https://alfredang.github.io/kanban5-v2/)

A single-file Kanban board for tracking IT project tasks, built for a **fictitious** bank's internal demo and training use. Version 2 adds a portfolio dashboard, a project timeline, a footer and a hardened security posture. It's still vanilla HTML, CSS and JavaScript in one `index.html`, with no frameworks and no build step.

**Live demo:** https://alfredang.github.io/kanban5-v2/

![IT PMO board v2: KPI tiles for total, backlog, in-progress, blocked, done, overdue and due-in-7-days tasks; a status-mix bar, workstream bars and a needs-attention list; filters; and Backlog, In Progress, Blocked and Done columns of ITPM task cards with overdue badges](docs/screenshot.png)

> Version 1 is still live at https://alfredang.github.io/kanban5/ (repo [alfredang/kanban5](https://github.com/alfredang/kanban5)).

## What's new in v2

- **Portfolio dashboard** at the top of the page:
  - Large KPI tiles (total, per-status, overdue, due in the next 7 days). The Blocked and Overdue tiles turn red when they're non-zero.
  - A status-mix bar with % complete, a per-workstream breakdown, and a **Needs attention** list of blocked or overdue tasks. Click a task to jump to its card.
- **Project timeline:** one row per workstream, a marker per task at its due date, a week grid and a **Today** line.
  - Markers show status by colour and shape, and overdue tasks get a red ring. Hover or focus a marker for details, or click it to jump to the card.
  - The timeline follows the filters and has a "Show timeline as a table" view.
- **Footer** with in-page navigation, data and privacy notes, and keyboard tips.
- **Security hardening** (details in [SECURITY.md](SECURITY.md)):
  - Hash-based Content-Security-Policy with no `unsafe-inline`.
  - No referrer leaks.
  - FormSubmit is never called while the placeholder address is set; sends time out and are throttled.
  - Control and bidi characters are stripped from input, and dropped text is validated.
  - SHA-pinned CI actions and extra CI scans.
- Accessibility fixes: higher-contrast focus ring and muted text, larger close buttons, and a skip link.

## Features

- Four columns: **Backlog, In Progress, Blocked, Done**. Move cards by drag-and-drop or with the keyboard-accessible **Move ▸** menu.
- Filters for project/workstream, assignee and priority. Column counts and the timeline follow the filters. The dashboard always counts every task.
- An **Add Task** modal with inline validation. New tasks get `ITPM-####` IDs.
- Deletion is confirmed inline on the card, with no browser dialogs.
- Overdue badges. Seed due dates are relative to today, so the overdue examples always show.
- Optional email notification for new tasks via [FormSubmit](https://formsubmit.co).

## Demo data and placeholders

- All tasks, people and projects are sample data. The bank is fictitious, and there are no real bank names or logos.
- **There's no persistence.** Tasks live in memory, so refreshing the page resets the board to the seed data. This is intentional.
- The notification endpoint is a placeholder: `YOUR_EMAIL@example.com`.

## Running locally

Double-click `index.html`, or:

```bash
start index.html          # Git Bash on Windows
open index.html           # macOS
```

It works straight from `file://`. You don't need a server.

## Configuration

Only one setting is configurable: the `FORMSUBMIT_ENDPOINT` constant at the top of the `<script>` block in `index.html`.

```js
const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/YOUR_EMAIL@example.com";
```

While the placeholder is in place, the app doesn't contact FormSubmit at all. It adds the card and shows a warning toast.

To turn notifications on, replace the placeholder with an address. FormSubmit sends that address an activation email once, and until it's activated, submissions return `success: "false"` and the app shows a warning toast. Email subjects are prefixed with `[IT PMO]`.

The endpoint is visible to anyone who views the page source, so use FormSubmit's random-string alias rather than a personal inbox. CI deliberately fails if a real address is committed. Configure it in your own deployment copy.

Editing the `<script>` or `<style>` block changes the CSP hashes, so run this afterwards:

```bash
node scripts/check-csp.js --write
```

## Tech constraints

- Vanilla HTML, CSS and JavaScript in a single file. There are no frameworks, libraries, bundlers or npm.
- It runs from `file://`. The only network call is the optional FormSubmit request.
- There are no external resources: no CDNs, web fonts or image files. It uses the system font stack and inline SVG/Unicode icons.
- There's no persistence. It doesn't use `localStorage`, `sessionStorage`, IndexedDB or cookies.

## Project structure

```
index.html                    # The whole app: markup, <style> and <script>
scripts/check-csp.js          # Verifies / refreshes the CSP script and style hashes
docs/screenshot.png           # README screenshot
.github/workflows/pages.yml   # CI and GitHub Pages deploy
.github/dependabot.yml        # Keeps the SHA-pinned actions up to date
SECURITY.md                   # Threat model, controls and residual risks
CLAUDE.md                     # Architecture notes and project rules
README.md
```

## CI/CD

[.github/workflows/pages.yml](.github/workflows/pages.yml) has two jobs:

- **`ci`** runs on pushes and pull requests to `main`:
  - Node syntax check of the script block and the CSP hash check.
  - The constraint scan from `CLAUDE.md`: only the FormSubmit URL and the CSP `connect-src` may match.
  - A placeholder check that the FormSubmit address is still `YOUR_EMAIL@example.com`.
  - An HTML/JS sink scan and a [gitleaks](https://github.com/gitleaks/gitleaks) secret scan.
- **`deploy`** runs after `ci` passes, on pushes to `main` and manual runs. It copies `index.html` and `docs/` into `_site/` and publishes that folder to GitHub Pages.

All actions are pinned to commit SHAs, and the workflow runs with least-privilege permissions.

## Contributing conventions

The full list is in [CLAUDE.md](CLAUDE.md). The main rules:

- Vanilla only: no libraries, CDNs, web fonts or image files. Use inline SVG or Unicode for icons.
- Don't use `localStorage`, `sessionStorage`, IndexedDB or cookies.
- Don't use `alert()`, `confirm()` or `!important`. Colours and spacing come from CSS custom properties on `:root`.
- Pass every task field rendered as HTML through `escapeHtml()`. Don't add inline `style=""` or `on*=` attributes, because the CSP blocks them.
- Status keys (`backlog`, `inprogress`, `blocked`, `done`) are tied to element IDs (`list-<key>`, `count-<key>`, `sum-<key>`, `col-<key>-title`). If you change `STATUSES`, update the markup too.
- Keep branding neutral, and keep the `ITPM-####` ID format.

## Testing

There's no test suite. Check changes manually in a browser, then run:

```bash
node -e "const h=require('fs').readFileSync('index.html','utf8');new Function(h.match(/<script>([\s\S]*?)<\/script>/)[1]);console.log('ok')"
node scripts/check-csp.js
```

## Licence

No licence has been chosen yet, so all rights are reserved by default. Add a `LICENSE` file before others reuse the code.
