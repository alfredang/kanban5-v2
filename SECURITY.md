# Security notes

This is a client-only demo board for a **fictitious** bank. It has no backend, no login and no stored data, and a refresh resets it. The notes below are sized to that. Items marked *if productionised* only matter if the app were ever used for real.

## Reporting a problem

Open a GitHub issue without exploit details, or use GitHub's private vulnerability reporting on this repository.

## Trust boundaries

| # | Boundary | What crosses it |
|---|---|---|
| B1 | User input → DOM | Task title, description and assignee (free text). Other fields come from fixed lists or a date format. |
| B2 | Drag source → board | `dataTransfer` text. Another page or app can drop anything here. |
| B3 | Browser → FormSubmit | New-task fields as a JSON POST, sent only when an address is configured. |
| B4 | Repo → GitHub Pages | `index.html` and `docs/` only. |
| B5 | Third-party CI actions → repo | GitHub Actions used by the workflow. |

## Controls in v2

**XSS and injection (B1, B2)**
- Every task field rendered as HTML goes through `escapeHtml()`. Toasts and tooltips use `textContent`.
- **Content-Security-Policy** (`<meta>`): `default-src 'none'`. Only the page's own inline script and stylesheet run, allowed by SHA-256 hash. `connect-src` allows only `https://formsubmit.co`. There is no `unsafe-inline`, so injected `<script>`, `on*=` handlers and `style=""` attributes are blocked even if escaping were bypassed. Also sets `base-uri 'none'`, `form-action 'none'` and `object-src 'none'`.
- The priority CSS class comes from a fixed lookup table (`PRIORITY_CLASS`), not from task data.
- Drops accept only text that looks like a task ID (`ITPM-####`).
- `cleanLine()` / `cleanText()` strip control characters and bidi-override characters, which are used for spoofing ("Trojan Source"). Single-line fields have newlines removed before they reach an email subject.
- Length limits (title 80, description 500, assignee 60) are enforced in both the HTML (`maxlength`) and JavaScript. Due dates must be real calendar dates within 10 years.
- Constants (`STATUSES`, `PROJECTS`, `CATEGORIES`, `PRIORITIES`, `LIMITS`) are frozen.

**Data sent to the third party (B3)**
- While `FORMSUBMIT_ENDPOINT` holds the placeholder address, **no request is made**. The card is added and a warning toast explains why.
- Requests send no cookies or credentials, no referrer (`no-referrer` both page-wide and per request), use `cache: "no-store"` and refuse redirects.
- Requests time out after 10 s, so the form can't hang on "Sending…".
- A client-side throttle allows at most 5 notifications per minute.
- The Add Task form warns users not to enter real customer, staff or bank data.

**Publishing and CI (B4, B5)**
- CI (`.github/workflows/pages.yml`) runs a syntax check, the CSP hash check, the constraint scan, a placeholder check (no real email address committed), an HTML/JS sink scan (`eval`, `document.write`, inline handlers…) and a gitleaks secret scan.
- Workflow permissions default to `contents: read`. Only the deploy job gets `pages: write` and `id-token: write`. Checkout uses `persist-credentials: false`.
- All actions are pinned to full commit SHAs. Dependabot proposes updates.
- Only `index.html` and `docs/` are deployed.

## Residual risks (accepted for a demo)

| Item | Why it remains |
|---|---|
| The FormSubmit address is visible in page source once configured | It's a static site. Use FormSubmit's random-string alias instead of a raw inbox, and never commit a personal address. |
| `_captcha: "false"` | AJAX can't show FormSubmit's captcha. Anyone who copies the endpoint can still POST to it. Add server-side verification *if productionised*. |
| No `frame-ancestors` / clickjacking header | `<meta>` CSP can't set it and GitHub Pages can't add headers. There are no sensitive actions to hijack. |
| No `X-Content-Type-Options`, HSTS or similar headers | Not configurable on GitHub Pages. Pages serves over HTTPS. |
| No authentication, audit log or persistence | By design for a training demo. Required *if productionised*. |

## Changing the page safely

1. Render every new task field through `escapeHtml()`. Give every new free-text field a length limit in both `maxlength` and `validateForm()`.
2. Don't add inline `style=""` or `on*=` attributes. The CSP blocks them. Use classes, `addEventListener`, or the CSSOM (`applyGeometry()`).
3. After editing the `<script>` or `<style>` block, run `node scripts/check-csp.js --write`.
4. Before publishing, run the checks in `CLAUDE.md` and a secret scan.
