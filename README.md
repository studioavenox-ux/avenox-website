# AVENOX website

A responsive, multi-page studio website built with semantic HTML, modern CSS and dependency-free JavaScript. No external fonts, trackers or runtime packages are required.

## Run locally

```sh
npm run dev
```

The development server binds to `0.0.0.0:4173` and serves the app at `/`. Every route is available directly, including `/work`, `/services`, `/about`, `/contact`, `/privacy`, `/cookies`, `/terms` and `/404`.

## Build and preview

```sh
npm run build
npm run preview
npm run qa
```

The build creates static route directories and a host-compatible `404.html` in `dist/`. Set the real production origin when it is known to generate absolute canonical/Open Graph URLs and a sitemap:

```sh
SITE_ORIGIN=https://your-real-domain.example npm run build
```

The sitemap and its `robots.txt` reference are intentionally deferred when no production domain has been supplied. Same-origin canonical paths are used in that case.

## Before launch

- The project imagery is illustrative; replace it with approved product and project assets when available.
- The inquiry form validates and prepares a brief for copying or download in the browser. It is not connected to an inbox or backend and does not transmit or store submissions. Connect a delivery service in `src/main.js` before inviting live submissions.
- Complete the bracketed legal and business placeholders in the Privacy, Cookie and Terms pages, and have the copy reviewed for the applicable jurisdiction.
