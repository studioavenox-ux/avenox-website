import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROJECTS, ROUTES, SERVICES } from "../src/site-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const siteOriginInput = process.env.SITE_ORIGIN?.trim();

function safeOrigin(input) {
  if (!input) return "";
  const parsed = new URL(input);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("SITE_ORIGIN must use http:// or https://");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("SITE_ORIGIN must be an origin without a path, query or hash");
  return parsed.origin;
}

const siteOrigin = safeOrigin(siteOriginInput);
const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const htmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function staticFallback(route) {
  if (route.path === "/") return "";
  const headings = {
    "/work": "IDEAS, MADE<br /><span>CONSIDERED.</span>",
    "/services": "DIGITAL WORK,<br /><span>WITH INTENT.</span>",
    "/about": "THOUGHTFUL<br /><span>BY DESIGN.</span>",
    "/contact": "TELL US WHAT<br /><span>YOU'RE MAKING.</span>",
    "/privacy": "PRIVACY,<br /><span>IN PLAIN WORDS.</span>",
    "/cookies": "A SMALL NOTE<br /><span>ON COOKIES.</span>",
    "/terms": "THE TERMS<br /><span>OF THIS SITE.</span>",
    "/404": "THIS PAGE<br /><span>DOESN'T EXIST.</span>",
  };
  const safeTitle = htmlEscape(route.title);
  const description = htmlEscape(route.description);
  const isNotFound = route.path === "/404";
  let detail = "";
  if (route.path === "/work") {
    detail = `<ul class="boot-fallback-list">${PROJECTS.map((project) => `<li><strong>${htmlEscape(project.name)}</strong><span>${htmlEscape(project.kind)}</span><span>${htmlEscape(project.description)}</span></li>`).join("")}</ul>`;
  } else if (route.path === "/services") {
    detail = `<ul class="boot-fallback-list">${SERVICES.map((service) => `<li><strong>${service.name}</strong><span>${htmlEscape(service.summary)}</span></li>`).join("")}</ul>`;
  } else if (route.path === "/contact") {
    detail = "<p class=\"boot-fallback-note\">JavaScript is required to prepare an inquiry brief. The current form does not send or store your details; with JavaScript enabled, you can copy or download the brief on this device.</p>";
  } else if (["/privacy", "/cookies", "/terms"].includes(route.path)) {
    detail = "<p class=\"boot-fallback-note\">This legal page is a draft. Replace every bracketed placeholder with verified business information and obtain review before publication.</p>";
  }
  const eyebrow = isNotFound ? "404" : safeTitle;
  const descriptionMarkup = isNotFound ? "" : `<p>${description}</p>`;
  const navigation = isNotFound
    ? `<nav aria-label="Page navigation"><a href="/">RETURN HOME <span aria-hidden="true">→</span></a></nav>`
    : `<nav aria-label="Page navigation"><a href="/">HOME <span aria-hidden="true">↗</span></a><a href="/work">WORK <span aria-hidden="true">↗</span></a><a href="/contact">START A PROJECT <span aria-hidden="true">↗</span></a></nav>`;
  return `<main id="main" class="boot-fallback shell${isNotFound ? " boot-fallback--not-found" : ""}" tabindex="-1"><p class="eyebrow">${eyebrow}</p><h1 id="page-heading">${headings[route.path] || "AVENOX"}</h1>${descriptionMarkup}${detail}${navigation}</main>`;
}

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "assets"), { recursive: true });
await cp(path.join(root, "public"), output, { recursive: true });

for (const asset of ["main.js", "site-data.js", "styles.css"]) {
  await cp(path.join(root, "src", asset), path.join(output, "assets", asset));
}

const sourceHtml = await readFile(path.join(root, "index.html"), "utf8");
let htmlTemplate = sourceHtml
  .replace('href="/src/styles.css"', 'href="/assets/styles.css"')
  .replace('src="/src/main.js"', 'src="/assets/main.js"');

function pageHtml(route) {
  const routePath = route.path === "/" ? "/" : `${route.path}/`;
  const canonical = siteOrigin ? `${siteOrigin}${routePath}` : routePath;
  const ogImage = siteOrigin ? `${siteOrigin}/images/avenox-social.png` : "/images/avenox-social.png";
  const title = htmlEscape(route.title);
  const description = htmlEscape(route.description);
  let html = htmlTemplate
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/i, `<meta property="og:image" content="${ogImage}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/i, `<meta name="twitter:image" content="${ogImage}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonical}" />`);

  const robots = route.noindex ? "noindex,follow" : "index,follow";
  if (/<meta name="robots"/i.test(html)) {
    html = html.replace(/<meta name="robots" content="[^"]*"\s*\/>/i, `<meta name="robots" content="${robots}" />`);
  } else {
    html = html.replace("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />", `<meta name="viewport" content="width=device-width, initial-scale=1" />\n    <meta name="robots" content="${robots}" />`);
  }

  const existingOgUrl = html.match(/<meta property="og:url" content="[^"]*"\s*\/>/i);
  if (existingOgUrl) {
    html = html.replace(existingOgUrl[0], `<meta property="og:url" content="${canonical}" />`);
  } else {
    html = html.replace("<meta property=\"og:site_name\" content=\"Avenox Studio\" />", `<meta property="og:site_name" content="Avenox Studio" />\n    <meta property="og:url" content="${canonical}" />`);
  }

  const fallback = staticFallback(route);
  if (fallback) html = html.replace(/<main class="boot-fallback shell" id="main">[\s\S]*?<\/main>/, fallback);
  return html;
}

for (const route of ROUTES) {
  const html = pageHtml(route);
  if (route.path === "/") {
    await writeFile(path.join(output, "index.html"), html);
  } else {
    const routeDirectory = path.join(output, route.path.slice(1));
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(path.join(routeDirectory, "index.html"), html);
  }
}

const notFound = ROUTES.find((route) => route.path === "/404");
await writeFile(path.join(output, "404.html"), pageHtml(notFound));

const robotsLines = ["User-agent: *", "Allow: /"];
if (siteOrigin) robotsLines.push(`Sitemap: ${siteOrigin}/sitemap.xml`);
await writeFile(path.join(output, "robots.txt"), `${robotsLines.join("\n")}\n`);

if (siteOrigin) {
  const publicRoutes = ROUTES.filter((route) => route.path !== "/404");
  const entries = publicRoutes.map((route) => {
    const routePath = route.path === "/" ? "/" : `${route.path}/`;
    return `  <url><loc>${xmlEscape(`${siteOrigin}${routePath}`)}</loc></url>`;
  }).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  await writeFile(path.join(output, "sitemap.xml"), sitemap);
} else {
  console.log("SITE_ORIGIN is not set: canonical URLs use same-origin paths; sitemap generation is deferred until the production domain is known.");
}

console.log(`Built ${ROUTES.length} route pages in ${path.relative(root, output)}${siteOrigin ? ` for ${siteOrigin}` : ""}.`);
