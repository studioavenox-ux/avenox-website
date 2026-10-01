# Avenox Studio website

The AVENOX studio website: a responsive, multi-page static site built with semantic HTML, modern CSS and dependency-free JavaScript. It requires no runtime packages, external fonts, trackers or form-delivery service.

## Run locally

```sh
npm run dev
```

The development server binds to `0.0.0.0:4173`. All required routes are available directly: `/`, `/work`, `/services`, `/about`, `/contact`, `/privacy`, `/cookies`, `/terms` and `/404`.

## Build, preview and QA

```sh
npm run build
npm run preview
npm run qa
```

The build writes static route directories and a host-compatible `404.html` to `dist/`. For production, set `SITE_ORIGIN` to the real public origin before building. This generates absolute canonical and Open Graph URLs, plus `sitemap.xml` and its `robots.txt` reference:

```sh
SITE_ORIGIN=https://your-real-domain.example npm run build
```

`SITE_ORIGIN` is the only environment variable used by the current build. It may be omitted for local work; the sitemap is then deferred and same-origin canonical paths are used. No contact endpoint or email environment variable is configured.

## Launch checklist

- Select the real domain and hosting provider, point DNS to that host, and set `SITE_ORIGIN` to the final HTTPS origin for the production build.
- Deploy the contents of `dist/` on a host that serves the generated route directories and `404.html` correctly.
- Replace the illustrative project imagery only when approved, accurate project assets are available. NEO is a personal AI system / product concept; its interface image is explicitly an illustrative study, not a product screenshot.
- Complete every bracketed legal and business placeholder in Privacy, Cookies and Terms, then obtain review for the applicable jurisdiction. No legal entity, address, contact email, hosting details or governing law has been assumed here.
- The contact form currently validates and prepares a brief in the visitor's browser. It does not send or store submissions; the visitor can copy or download the brief on that device. The delivery integration point is marked in `src/main.js`. Connect and test a verified backend or email service, including its privacy disclosures, before inviting live submissions. No contact-related environment variable exists yet.

The favicon reuses the approved A mark. The social preview at `public/images/avenox-social.png` contains only the approved A mark, AVENOX wordmark and exact `Web • AI • Digital Systems` tagline; its editable SVG source is `public/images/avenox-social.svg`.
