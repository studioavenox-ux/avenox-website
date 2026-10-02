# AVENOX — Web • AI • Digital Systems

A static, multi-page AVENOX website built with semantic HTML, CSS and dependency-free JavaScript. The approved visual design and assets are unchanged. Build, local preview and QA require Node.js 18 or newer; there are no third-party runtime or development dependencies.

## Routes

The build creates all nine public pages: `/`, `/work`, `/services`, `/about`, `/contact`, `/privacy`, `/cookies`, `/terms` and `/404`. Each route is emitted as a directory `index.html`; the build also emits a root `404.html` for unknown URLs. The `/404` page is a normal, directly addressable page; an unknown URL should instead receive the host's 404 response and render the custom `404.html`.

## Local development and verification

```sh
npm ci
npm run qa
npm run build
```

To serve the site locally, run either command in its own terminal; each server stays running until stopped:

```sh
npm run dev      # source-based development server, default port 4173
npm run preview  # static dist/ preview, default port 4174
```

`npm ci` installs from the committed lockfile (there are currently no packages to install). Both servers accept optional `PORT` and `HOST` overrides (they bind to all interfaces by default; set `HOST=127.0.0.1` to keep them reachable only from this machine). `npm run qa` rebuilds `dist/` and checks generated routes, metadata, links and assets, accessibility-related markup, responsive CSS, the mobile-menu behavior, and contact-form behavior using browser stubs. It is not a substitute for a real-browser visual/console check or a deployed-host smoke test. The repository has no configured lint tool; syntax checks can be run without extra packages with `node --check` on the JavaScript files.

The build output is `dist/`. It excludes source scripts, repository documentation and the editable social-card SVG source. `dist/` and `node_modules/` are ignored by Git.

## Environment variables and SEO origin

| Variable | Where it is used | Purpose |
| --- | --- | --- |
| `SITE_ORIGIN` | Build-time; required by `npm run build:production` | The selected canonical public HTTPS origin. Used for absolute canonical/Open Graph URLs, the sitemap, and the sitemap entry in `robots.txt`. |
| `PORT` | Optional, local dev/preview server only | Overrides the local server port (defaults to 4173 for `dev`, 4174 for `preview`). It is not used by the static production output. |
| `HOST` | Optional, local dev/preview server only | Overrides the bind address (default `0.0.0.0`). It is not used by the static production output. |

No other project environment variables are read. `SITE_ORIGIN` is public configuration, not a secret; it must be the exact origin only (HTTPS, no path, query or fragment). Keep it blank until the real domain and canonical host are chosen. `.env.example` is a blank reference template and is **not** auto-loaded by these Node scripts. Do not add credentials or a guessed domain to it.

`npm run build` can run with `SITE_ORIGIN` unset, but intentionally leaves canonical/social URLs relative and does not generate a sitemap. Do not publish that output as the final production build. Once the real origin is selected, set `SITE_ORIGIN` in the production build environment and run:

```sh
SITE_ORIGIN="https://<selected-canonical-origin>" npm run build:production
SITE_ORIGIN="https://<selected-canonical-origin>" npm run qa
```

Replace the quoted placeholder with the actual origin before running either command. The strict production build rejects a missing or invalid origin. Rebuild if the canonical host changes. The site uses root-relative routes and asset URLs, so deployment at a subpath is not supported.

## Vercel deployment

The repository includes a minimal `vercel.json` for the existing static build:

- Build command: `npm run build`
- Output directory: `dist`
- `trailingSlash: true`, matching the site's trailing-slash canonical paths and generated route directories

To deploy:

1. Import this repository as a Vercel project, use the repository root as the project root, and select the **Other** framework preset (this is not a framework app). Keep the build and output settings from `vercel.json`; no rewrite, API function, or extra package is required.
2. After choosing the real production domain and canonical host, add `SITE_ORIGIN` under the Vercel project's **Production** environment variables as the exact HTTPS origin. Do not substitute a Vercel preview URL or a guessed domain. Without it the static build can complete, but production canonical/social metadata and the sitemap will be incomplete.
3. Deploy, add the selected domain in Vercel, and configure DNS and HTTPS using the records Vercel provides for that domain. Redirect any alternate host to the chosen canonical host. No domain or DNS record is specified in this repository.
4. After deployment, verify each route, its canonical URL and assets, and confirm that an unknown URL returns HTTP 404 with the custom `404.html`. Confirm that `/robots.txt` and `/sitemap.xml` use the selected origin. The `/404` route itself should remain directly reachable and noindexed.

Vercel's static output uses the generated route-directory index files; `trailingSlash: true` normalizes extensionless public routes to the canonical slash form. The site is static and does not require a server runtime after deployment. The production sitemap omits `/404`.

## Approved brand and imagery

The approved favicon reuses the existing AVENOX mark; no replacement logo has been introduced. Open Graph and Twitter cards use `public/images/avenox-social.png` (1200 × 630). Its editable SVG source is kept in `public/images/avenox-social.svg` and intentionally excluded from `dist/`. Portfolio visuals are real screenshots captured from the actual projects (NEO, Atlas, NEXORA) and are stored in `public/projects/`; see `PORTFOLIO-ASSETS.md` for the source repository and capture method of each file. The Silent Atlas has no verified assets yet and shows a "screenshot pending" panel. Never add generated, stock or illustrative imagery to the portfolio; replace the pending panel only with a real capture.

## Contact form status

The form validates the required fields and prepares a brief locally in the visitor's browser. It does **not** send or store the details; visitors can copy or download the brief on their own device. No email provider, backend endpoint, API key, delivery credentials or contact-related environment variable is configured.

No delivery address is stored in this repository or in the shipped JavaScript. The documented `FORM DELIVERY INTEGRATION POINT` is in `submitInquiry` in `src/main.js`. When an email provider is selected, connect a verified server-side endpoint there; keep the recipient address and provider credentials in server-side environment variables (never in client code or Git), re-validate every field on the server, add spam and rate-limit protection (for example a honeypot field plus per-IP limits or a bot challenge), strip line breaks from anything placed in an email header, and only report delivery after the endpoint confirms it. The CSP in `vercel.json` currently sets `connect-src 'self'` and `form-action 'self'`, so the endpoint must be same-origin or the policy must be deliberately widened for that one host. Update the privacy/cookie disclosures to match the actual provider and data handling. Do not send messages directly from client-side JavaScript.

## Launch tasks still requiring verified information

The Privacy, Cookies and Terms pages intentionally retain visible placeholders. Replace them with details supplied and approved by the responsible business, and obtain jurisdiction-appropriate review before publication:

| Placeholder | Page(s) | Information to confirm |
| --- | --- | --- |
| `[legal business name]` | Privacy, Terms | Correct legal operator/contracting identity. |
| `[registered business address]` | Privacy, Terms | Actual address required for the business and applicable law. |
| `[privacy contact email]` | Privacy, Cookies | Monitored privacy/data-rights contact. |
| `[business contact email]` | Terms | Monitored business contact for terms questions. |
| `[add hosting and retention details]` | Privacy | Actual host/log providers, collected data, retention, legal basis and safeguards. |
| `[complete before launch]` | Privacy | Applicable rights, request process, legal bases, retention details and supervisory authority. |
| `[confirm that hosting-level analytics are off, or describe them]` | Privacy | Whether any analytics or similar feature is enabled in the hosting dashboard (this is outside the repository code). |
| `[add contact method]` | Terms | The published way for visitors to actually contact the studio (the form does not send anything). |
| `[add provider and cookie details if applicable]` | Cookies | Actual hosting/third-party services, cookies or similar storage, purposes/lifetimes, and required consent controls. |
| `[jurisdiction and legal wording to be supplied]` | Terms | Reviewed jurisdiction-specific warranty, liability and consumer-rights wording. |
| `[insert applicable jurisdiction after legal review]` | Terms | Confirmed governing law, venue and dispute process. |
| `[date to be added]` | Privacy, Cookies, Terms | Actual review and approval dates. |

Before launch, also confirm rights to the site's text, project names and every visual asset. Select the real domain/canonical host, configure DNS and HTTPS, build with its `SITE_ORIGIN`, and complete the post-deploy route, 404, asset and SEO checks. Email delivery remains a separate, optional backend integration and is not active in this version.

## Security and privacy

Reviewed 2026-10-02. This is a static site with no backend, no dependencies and no secrets; that removes whole classes of risk, but it is not a guarantee. See the report in the pull request for evidence and remaining risks.

- **Secrets:** none are required or present. `.env`, `.env.*` (except `.env.example`), keys and certificates are git-ignored. `.env.example` holds only the public `SITE_ORIGIN` setting. Never put credentials in `public/`, `src/` or client-side code.
- **Headers** (`vercel.json`, applied to every response and also sent by the local servers): a same-origin Content-Security-Policy (no inline scripts or styles, no third-party origins, no framing, `object-src 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, a restrictive `Permissions-Policy`, `X-Frame-Options` and `Cross-Origin-Opener-Policy`. HSTS is not set in the file: Vercel serves it on its HTTPS domains by default; if the site is hosted elsewhere, configure HSTS there (and decide separately about `includeSubDomains`/`preload`, which are hard to reverse). Adding any script, font, embed, analytics or form endpoint requires a deliberate CSP change.
- **Tracking:** none. No analytics, pixels, third-party scripts or fonts, cookies, `localStorage`/`sessionStorage`/IndexedDB, `fetch`/XHR or beacons. `npm run qa` fails if these appear in the shipped JavaScript.
- **Untrusted input:** the only inputs are the contact-form fields and the `project`/`service` URL parameters. Text is cleaned (control and bidi-override characters removed, lengths capped) and HTML-escaped before display; `service` is matched against a fixed list. There are no external links, redirects or `target="_blank"` links.
- **Static assets:** only files under `public/` are published, and the build copies an allowlist of file types and no dotfiles. `npm run qa` fails if anything unexpected reaches `dist/`.
- **Local servers:** `npm run dev` serves only `src/` and `public/` (never `package.json`, scripts, env files or `.git`); both servers answer malformed requests with generic errors and do not crash or print paths.
