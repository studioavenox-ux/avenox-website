# Avenox Studio website

AVENOX is a static, multi-page website built with semantic HTML, CSS and dependency-free JavaScript. The deployed site has no server-side runtime dependencies. Build and QA commands require Node.js 18 or newer.

## Routes

The build creates pages for `/`, `/work`, `/services`, `/about`, `/contact`, `/privacy`, `/cookies`, `/terms` and `/404`. It also writes a root `404.html` for unknown URLs. Configure the production host to serve route-directory index files and return `404.html` with an HTTP 404 status for unknown paths.

## Environment variables

| Variable | Required where | Purpose |
| --- | --- | --- |
| `SITE_ORIGIN` | Required by `npm run build:production` | The final public HTTPS origin used for canonical URLs, Open Graph URLs and image URLs, `sitemap.xml`, and the sitemap line in `robots.txt`. |
| `PORT` | Optional for the built-in local dev/preview server only | Overrides its port (defaults: 4173 for `npm run dev`, 4174 for `npm run preview`). It is not needed by the production build or a static host. |

There are no other build or runtime environment variables. `SITE_ORIGIN` is public configuration, not a secret. Set it in the build environment—not as a browser-side setting—to the exact primary origin, such as `https://your-real-domain.example` (replace this placeholder with the real domain). Use HTTPS, choose the canonical apex or `www` host, and do not include a path, query or fragment. The production build rejects a missing origin, non-HTTPS origin, or origin containing a path/query/fragment. Rebuild if the canonical domain changes.

The source uses root-relative routes and asset paths, so deploy the site at the origin root; subfolder deployment is not supported. A local build may omit `SITE_ORIGIN`, but that intentionally omits the sitemap and leaves canonical/social image URLs same-origin relative. Do not use that output as the final production build.

## Deployment guide

1. Choose the real domain and static hosting provider. Configure DNS and HTTPS using the records supplied by that provider; redirect any alternate host (for example, apex vs `www`) to the one canonical origin. No domain, DNS record, host or company detail is assumed here.
2. In the host/CI **build environment**, set `SITE_ORIGIN` to the final canonical HTTPS origin, with no path, query or fragment. It is not a secret and must be available during the build.
3. Build and verify with that same environment value:

   ```sh
   SITE_ORIGIN="https://your-real-domain.example" npm run qa
   SITE_ORIGIN="https://your-real-domain.example" npm run build:production
   ```

   Replace the example origin before running these commands. `npm run qa` rebuilds the site and checks the generated pages, metadata, asset references, legal placeholders and contact flow; `build:production` then creates the final `dist/` output and requires HTTPS `SITE_ORIGIN`.
4. Publish the **contents of `dist/`**, not the repository, at the domain root. The host must resolve `/work` and `/work/` (and the other route directories) to their generated `index.html` files, serve the root `404.html` for unknown paths with status 404, and serve the generated `robots.txt` and `sitemap.xml`.
5. After DNS and HTTPS are live, smoke-test every route, the favicon, `/images/avenox-social.png`, project images, `/assets/main.js`, `/assets/styles.css`, canonical URLs, the share preview and an unknown URL. The local production-output server is available with `npm run preview` (default port 4174; `PORT` can override it).

`SITE_ORIGIN` creates absolute canonical/Open Graph URLs and the sitemap. The sitemap intentionally omits `/404`. A deployment is not ready for public launch until the real domain is known, DNS/HTTPS are configured, and the final build is produced with that domain.

## Local development and QA

```sh
npm run dev
npm run qa
npm run build
npm run preview
```

The build is self-contained in `dist/`; development server/build/QA scripts, repository metadata, `node_modules`, and the editable social-card SVG source are not shipped. `dist/` and `node_modules/` are ignored by Git. The QA command performs static route/asset checks and client-renderer tests with browser stubs; it does not replace a real-browser visual, console, accessibility or production-host smoke test.

The favicon reuses the approved A mark. Open Graph and Twitter metadata use the 1200 × 630 PNG at `public/images/avenox-social.png`; its editable SVG source is `public/images/avenox-social.svg` and is intentionally excluded from the production output. Portfolio imagery is illustrative. NEO is a personal AI system / product concept; its interface art is an illustrative study, not a product screenshot.

## Contact form: what is required for email delivery

The current contact form validates the required fields and prepares a brief in the visitor's browser. It does **not** transmit or store the details; the visitor can copy or download the brief on that device. No email address, email provider, backend endpoint, API key, or contact-related environment variable has been configured.

To enable real delivery, the business still needs to choose an email provider and deploy a server-side or serverless endpoint. Add server-side validation, spam/rate-limit protections, safe error handling and appropriate data-retention controls. Connect the form at the `FORM DELIVERY INTEGRATION POINT` in `src/main.js`; keep provider credentials in the backend/host's private environment and never expose them in browser JavaScript. Only show a sent/success state after the endpoint confirms delivery. Update the privacy/cookie disclosures to describe the selected provider and data handling. The environment variable names/secrets depend on the provider and have deliberately not been invented.

## Legal details to replace before publication

The Privacy, Cookies and Terms pages visibly retain placeholders. Replace each with verified information supplied by the actual business, and obtain review for the applicable jurisdictions before publication:

| Placeholder | Page(s) | Real information required |
| --- | --- | --- |
| `[legal business name]` | Privacy, Terms | The legal entity/person responsible for the site and the correct contracting/operator identity. |
| `[registered business address]` | Privacy, Terms | The actual registered or service address required for the business and applicable law. |
| `[privacy contact email]` | Privacy, Cookies | A monitored privacy/data-rights contact address. |
| `[business contact email]` | Terms | A monitored business contact address for terms-related questions. |
| `[add hosting and retention details]` | Privacy | Actual hosting/log providers, data collected, retention period, legal basis and applicable safeguards. |
| `[complete before launch]` | Privacy | Jurisdiction-specific rights, request process, legal bases, retention details and supervisory authority, confirmed by counsel/operator. |
| `[add provider and cookie details if applicable]` | Cookies | Actual hosting/third-party services, cookies or similar storage they use, purpose/lifetime, and any required consent controls. Verify against the live deployment. |
| `[jurisdiction and legal wording to be supplied]` | Terms | Reviewed jurisdiction-specific warranty, liability and consumer-rights language. |
| `[insert applicable jurisdiction after legal review]` | Terms | Confirmed governing law, venue and dispute process. |
| `[date to be added]` | Privacy, Cookies, Terms | The real date each policy was last reviewed and approved. |

Also confirm ownership and usage rights for the site's text, project names and every visual asset; the Terms page calls this out separately from its bracketed fields. No legal entity, address, email, hosting provider, jurisdiction, domain or email backend has been assumed.
