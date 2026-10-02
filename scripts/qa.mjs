import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { PROCESS, PROJECTS, ROUTES, SERVICES } from "../src/site-data.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const browserSource = (await readFile(path.join(root, "src/main.js"), "utf8"))
  .replace(/^import[^\n]*\n/gm, "");
const expectedHeadings = new Map([
  ["/", "LET'S MAKE"],
  ["/work", "IDEAS, MADE"],
  ["/services", "DIGITAL WORK,"],
  ["/about", "THOUGHTFUL"],
  ["/contact", "TELL US WHAT"],
  ["/privacy", "PRIVACY,"],
  ["/cookies", "A SMALL NOTE"],
  ["/terms", "THE TERMS"],
  ["/404", "THIS PAGE"],
]);
const decoded = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");
const siteOrigin = process.env.SITE_ORIGIN ? new URL(process.env.SITE_ORIGIN).origin : "";
const routeUrl = (route) => `${siteOrigin}${route.path === "/" ? "/" : `${route.path}/`}`;
const socialImageUrl = siteOrigin ? `${siteOrigin}/images/avenox-social.png` : "/images/avenox-social.png";
const vercelConfig = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
assert.equal(vercelConfig.buildCommand, "npm run build", "Vercel should use the existing static build command");
assert.equal(vercelConfig.outputDirectory, "dist", "Vercel should publish the generated static output");
assert.equal(vercelConfig.trailingSlash, true, "Vercel route normalization should match the canonical paths");
const environmentExample = await readFile(path.join(root, ".env.example"), "utf8");
assert.match(environmentExample, /^SITE_ORIGIN=$/m, "Environment template should keep the unselected site origin blank");
assert.doesNotMatch(environmentExample, /https?:\/\//, "Environment template must not invent or assume a domain");

function assertBalancedMarkup(html, route) {
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const stack = [];
  for (const match of html.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi)) {
    const token = match[0];
    const name = match[1].toLowerCase();
    if (token.startsWith("</")) {
      assert.equal(stack.pop(), name, `${route}: mismatched closing tag ${token}`);
    } else if (!voidTags.has(name) && !token.endsWith("/>")) {
      stack.push(name);
    }
  }
  assert.deepEqual(stack, [], `${route}: unclosed HTML elements: ${stack.join(", ")}`);
}

function renderWithBrowserStubs(pathname, search = "", FormDataClass = FormData, overrides = {}) {
  const attributes = new Map();
  const meta = (key, initial = "") => {
    const item = {
      content: initial,
      href: initial,
      rel: "",
      setAttribute(name, value) { this[name] = value; attributes.set(`${key}:${name}`, value); },
    };
    attributes.set(key, item);
    return item;
  };
  const app = { innerHTML: "" };
  const document = {
    title: "",
    documentElement: { classList: { add() {} } },
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    head: { append() {} },
    listeners: [],
    addEventListener(type, handler) { this.listeners.push([type, handler]); },
    createElement() { return { setAttribute() {}, append() {}, click() {}, remove() {} }; },
    querySelector(selector) {
      if (selector === "#app") return app;
      const keys = {
        'meta[name="description"]': "description",
        'meta[property="og:title"]': "og:title",
        'meta[property="og:description"]': "og:description",
        'meta[property="og:image"]': "og:image",
        'meta[property="og:url"]': "og:url",
        'meta[name="twitter:title"]': "twitter:title",
        'meta[name="twitter:description"]': "twitter:description",
        'meta[name="twitter:image"]': "twitter:image",
        'link[rel="canonical"]': "canonical",
        'meta[name="robots"]': "robots",
      };
      const key = keys[selector];
      if (!key) return null;
      return attributes.get(key) || meta(key);
    },
    querySelectorAll() { return []; },
    getElementById() { return null; },
  };
  const location = new URL(`http://avenox.local${pathname}${search}`);
  const history = { scrollRestoration: "auto", pushed: [], pushState(_state, _title, url) { this.pushed.push(url); } };
  const window = {
    location,
    history,
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    scrollTo() {},
  };
  const context = {
    PROCESS, PROJECTS, ROUTES, SERVICES,
    document, window, history,
    URL, URLSearchParams, FormData: FormDataClass, Blob,
    console, setTimeout, clearTimeout,
    requestAnimationFrame(callback) { callback(); },
    ...overrides,
  };
  vm.runInNewContext(browserSource, context, { timeout: 1500, filename: "src/main.js" });
  return { app, document, attributes, history, listeners: document.listeners };
}

// Social preview must be a light, correctly sized PNG using only the approved mark and brand typography.
const socialPng = await readFile(path.join(dist, "images/avenox-social.png"));
assert.deepEqual([...socialPng.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "Social preview should be a valid PNG");
assert.equal(socialPng.readUInt32BE(16), 1200, "Social preview should be 1200 pixels wide");
assert.equal(socialPng.readUInt32BE(20), 630, "Social preview should be 630 pixels high");
assert.ok(socialPng.length < 100_000, "Social preview should stay lightweight");
const socialSvg = await readFile(path.join(root, "public/images/avenox-social.svg"), "utf8");
const faviconSvg = await readFile(path.join(root, "public/favicon.svg"), "utf8");
const approvedMarkPath = faviconSvg.match(/<path d="([^"]+)" fill="#11110f"/)?.[1];
const approvedAccentPath = faviconSvg.match(/<path d="([^"]+)" stroke="#89b6b7" stroke-width="2\.4"/)?.[1];
assert.ok(approvedMarkPath && socialSvg.includes(`d="${approvedMarkPath}"`), "Social preview should reuse the approved favicon mark geometry");
assert.ok(approvedAccentPath && socialSvg.includes(`d="${approvedAccentPath}"`), "Social preview should reuse the approved favicon accent geometry");
assert.match(socialSvg, /<text[^>]*>AVENOX<\/text>/, "Social preview source must use the AVENOX wordmark");
assert.match(socialSvg, /Web • AI • Digital Systems/, "Social preview source must preserve the exact tagline");
assert.doesNotMatch(socialSvg, /studio|independent|contact|project|award|leading/i, "Social preview must not add promotional claims");

const productionEntries = new Set(await readdir(dist));
for (const devArtifact of [".git", "node_modules", "scripts", "src", "README.md", "package.json", "package-lock.json", "vercel.json", ".env", ".env.example", ".env.production"]) {
  assert.ok(!productionEntries.has(devArtifact), `Production output must not contain development-only artifact ${devArtifact}`);
}
const productionImages = new Set(await readdir(path.join(dist, "images")));
assert.ok(!productionImages.has("avenox-social.svg"), "Editable social-source SVG should not be shipped when the PNG is used for metadata");
await access(path.join(dist, "favicon.svg"));
assert.match(await readFile(path.join(dist, "favicon.svg"), "utf8"), /<svg\b/, "Approved favicon should be present in the production output");
const builtHome = await readFile(path.join(dist, "index.html"), "utf8");
assert.match(builtHome, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/, "Production HTML should link to the approved favicon");
assert.match(builtHome, /<link rel="stylesheet" href="\/assets\/styles\.css"/, "Production HTML should use built stylesheet assets");
assert.match(builtHome, /<script type="module" src="\/assets\/main\.js"/, "Production HTML should use the built runtime entrypoint");
assert.doesNotMatch(builtHome, /\/(?:src|scripts)\//, "Production HTML must not reference source or development scripts");

// The actual build output must contain a page entry for every requested route.
for (const route of ROUTES) {
  const file = route.path === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, route.path.slice(1), "index.html");
  await access(file);
  const html = await readFile(file, "utf8");
  const staticHeading = expectedHeadings.get(route.path);
  if (staticHeading) assert.ok(html.includes(staticHeading), `${route.path}: static fallback heading missing`);
  assert.equal(decoded(html.match(/<title>([^<]+)<\/title>/i)?.[1] || ""), route.title, `${route.path}: route-specific title is incorrect`);
  assert.equal(decoded(html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || ""), route.description, `${route.path}: route-specific description is incorrect`);
  assert.equal(decoded(html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || ""), route.title, `${route.path}: Open Graph title is incorrect`);
  assert.equal(decoded(html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] || ""), route.description, `${route.path}: Open Graph description is incorrect`);
  assert.equal(html.match(/<meta property="og:site_name" content="([^"]+)"/i)?.[1], "Avenox Studio", `${route.path}: Open Graph studio name is incorrect`);
  assert.equal(html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1], socialImageUrl, `${route.path}: Open Graph image is incorrect`);
  assert.equal(html.match(/<meta name="twitter:image" content="([^"]+)"/i)?.[1], socialImageUrl, `${route.path}: Twitter image is incorrect`);
  assert.equal(html.match(/<meta property="og:image:type" content="([^"]+)"/i)?.[1], "image/png", `${route.path}: Open Graph image type is incorrect`);
  assert.equal(html.match(/<meta property="og:image:width" content="([^"]+)"/i)?.[1], "1200", `${route.path}: Open Graph image width is incorrect`);
  assert.equal(html.match(/<meta property="og:image:height" content="([^"]+)"/i)?.[1], "630", `${route.path}: Open Graph image height is incorrect`);
  assert.equal(decoded(html.match(/<meta property="og:image:alt" content="([^"]+)"/i)?.[1] || ""), "AVENOX — Web • AI • Digital Systems", `${route.path}: Open Graph image alt is incorrect`);
  assert.equal(decoded(html.match(/<meta name="twitter:image:alt" content="([^"]+)"/i)?.[1] || ""), "AVENOX — Web • AI • Digital Systems", `${route.path}: Twitter image alt is incorrect`);
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1], routeUrl(route), `${route.path}: canonical URL is incorrect`);
  assert.equal(html.match(/<meta property="og:url" content="([^"]+)"/i)?.[1], routeUrl(route), `${route.path}: Open Graph URL is incorrect`);
  if (route.noindex) {
    assert.match(html, /<meta name="robots" content="noindex,follow"/, "404 route should not be indexed");
    assert.match(html, /<p class="eyebrow">404<\/p>/, "404 fallback should use a minimal 404 label");
    assert.match(html, /THIS PAGE<br \/><span>DOESN'T EXIST\.<\/span>/, "404 fallback should state that the page does not exist");
    assert.match(html, /RETURN HOME <span aria-hidden="true">→<\/span>/, "404 fallback should offer one return-home action");
    assert.doesNotMatch(html, /VIEW OUR WORK|START A PROJECT|may have moved/i, "404 fallback should stay minimal");
  }
}
await access(path.join(dist, "404.html"));
const builtRobots = await readFile(path.join(dist, "robots.txt"), "utf8");
if (siteOrigin) {
  assert.ok(builtRobots.split(/\r?\n/).includes(`Sitemap: ${siteOrigin}/sitemap.xml`), "robots.txt should publish the production sitemap URL");
  await access(path.join(dist, "sitemap.xml"));
  const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(sitemapUrls, ROUTES.filter((route) => !route.noindex).map(routeUrl), "Production sitemap should list only public routes");
} else {
  assert.ok(!productionEntries.has("sitemap.xml"), "Sitemap should not be emitted without a known production origin");
  assert.doesNotMatch(builtRobots, /^Sitemap:/m, "robots.txt should not advertise a sitemap without a production origin");
}

// Exercise the client renderer on each route using a minimal browser surface.
for (const [route, expectedHeading] of expectedHeadings) {
  const { app, document, attributes } = renderWithBrowserStubs(route);
  assert.ok(app.innerHTML.includes(expectedHeading), `${route}: expected page heading was not rendered`);
  assertBalancedMarkup(app.innerHTML, route);
  const routeData = ROUTES.find((item) => item.path === route) || ROUTES.find((item) => item.path === "/404");
  const canonicalPath = routeData.path === "/" ? "/" : `${routeData.path}/`;
  assert.equal(document.title, routeData.title, `${route}: document title was not set correctly`);
  assert.equal(attributes.get("canonical")?.href, `http://avenox.local${canonicalPath}`, `${route}: client canonical is incorrect`);
  assert.equal(attributes.get("og:url")?.content, `http://avenox.local${canonicalPath}`, `${route}: client Open Graph URL is incorrect`);
  assert.equal(attributes.get("og:image")?.content, "http://avenox.local/images/avenox-social.png", `${route}: client Open Graph image is incorrect`);
  assert.equal(attributes.get("twitter:image")?.content, "http://avenox.local/images/avenox-social.png", `${route}: client Twitter image is incorrect`);
  assert.ok(attributes.get("robots")?.content, `${route}: robots metadata was not set`);

  const ids = [...app.innerHTML.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: duplicate element IDs`);
  for (const match of app.innerHTML.matchAll(/<img\b([^>]*)>/g)) {
    assert.match(match[1], /\balt="[^"]+"/, `${route}: content image needs descriptive alt text`);
    assert.match(match[1], /\bwidth="\d+"/, `${route}: image needs intrinsic width to limit layout shift`);
    assert.match(match[1], /\bheight="\d+"/, `${route}: image needs intrinsic height to limit layout shift`);
    assert.match(match[1], /\bdecoding="async"/, `${route}: image should decode asynchronously`);
    const src = match[1].match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src?.startsWith("/images/") || src?.startsWith("/projects/"), `${route}: image source should be same-origin`);
    await access(path.join(dist, src.slice(1)));
  }

  for (const match of app.innerHTML.matchAll(/<a\b([^>]*)>/g)) {
    const hrefMatch = match[1].match(/\bhref="([^"]*)"/);
    assert.ok(hrefMatch, `${route}: anchor without href`);
    const href = decoded(hrefMatch[1]);
    if (href.startsWith("/")) {
      const destination = href.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
      assert.ok(ROUTES.some((item) => item.path === destination), `${route}: broken internal destination ${href}`);
    }
  }
}

for (const [route, label] of [["/work", "Work"], ["/services", "Services"], ["/about", "Studio"], ["/contact", "Contact"]]) {
  const page = renderWithBrowserStubs(route).app.innerHTML;
  assert.ok(page.includes(`href="${route}" data-link aria-current="page">${label}</a>`), `${route}: primary navigation should identify the current page`);
}

const renderedHome = renderWithBrowserStubs("/").app.innerHTML;
assert.match(renderedHome, /Web • AI • Digital Systems/, "Header/footer should use the exact approved brand line");
assert.match(renderedHome, /AVENOX<span class="brand-mark" aria-hidden="true">\/<\/span>/, "Header/footer should keep the approved wordmark treatment");
assert.match(renderedHome, /href="\/contact" data-link>START A PROJECT/, "Primary project CTA should remain clear and working");
assert.match(renderedHome, /LET'S MAKE<br \/>SOMETHING<br \/><span>USEFUL\.<\/span>/, "Approved home hero line should be preserved");
const renderedAbout = renderWithBrowserStubs("/about").app.innerHTML;
assert.match(renderedAbout, /Good digital work starts with the right question and careful attention to the people who use it\./, "About page should keep the approved lead");
assert.match(renderedAbout, /Across websites, AI products, automation and software, we bring design and engineering into the same conversation\./, "About page should explain the studio's practice clearly");
assert.match(renderedAbout, /Clear decisions keep the work focused, with care for the details that shape everyday use\./, "About page should connect decisions to everyday experience");
assert.match(renderedAbout, /<article class="principle reveal"><h3>/, "Studio principles should use proper h3 headings");

const renderedWork = renderWithBrowserStubs("/work").app.innerHTML;
const neoProject = PROJECTS.find((project) => project.name === "NEO");
const silentAtlas = PROJECTS.find((project) => project.name === "THE SILENT ATLAS");
const atlasProject = PROJECTS.find((project) => project.name === "ATLAS");
const nexoraProject = PROJECTS.find((project) => project.name === "NEXORA");
for (const project of [neoProject, atlasProject, nexoraProject]) {
  assert.ok(project?.image?.startsWith("/projects/"), `${project?.name}: should use a verified real screenshot under /projects/`);
  assert.match(project.visualLabel, /^Real project screenshot/, `${project.name}: real screenshots must be labelled as such`);
  assert.doesNotMatch(`${project.visualLabel} ${project.alt}`, /illustrative|not a product screenshot/i, `${project.name}: real screenshots must not be called illustrative`);
}
assert.equal(silentAtlas?.image, null, "The Silent Atlas has no verified assets and must stay an honest placeholder");
assert.match(silentAtlas?.visualLabel || "", /^Concept — screenshot pending/, "The Silent Atlas must be labelled a concept with its screenshot pending");
assert.doesNotMatch(silentAtlas?.visualLabel || "", /real project screenshot/i, "The Silent Atlas placeholder must not imply a screenshot exists");
const publicImages = new Set((await readdir(path.join(root, "public/images"))));
assert.deepEqual([...publicImages].sort(), ["avenox-social.png", "avenox-social.svg"], "public/images should hold only the AVENOX social card; portfolio imagery lives in public/projects");
const projectFiles = (await readdir(path.join(root, "public/projects"), { recursive: true })).filter((file) => /\.(webp|png|jpe?g|svg|avif|gif)$/i.test(file));
assert.deepEqual(projectFiles.map((file) => `/projects/${file}`).sort(), PROJECTS.filter((project) => project.image).map((project) => project.image).sort(), "Every file in public/projects must be a verified portfolio image that is actually used");
assert.match(renderedWork, /SCREENSHOT PENDING/, "The pending placeholder should be visible in the work archive");
assert.match(renderedWork, /Personal AI agent \/ interactive prototype/, "NEO's project type should be visible in the archive");
assert.match(renderedWork, /Editorial website concept/, "Silent Atlas should be identified as a website concept");
assert.match(renderedWork, /Academic productivity platform/, "Atlas's project type should be visible in the archive");
assert.match(renderedWork, /Company website/, "NEXORA's project type should be visible in the archive");
assert.ok(!renderedWork.includes("studio-desk"), "The generic studio desk image must not be used");
for (const project of [neoProject, atlasProject, nexoraProject]) await access(path.join(dist, project.image.slice(1)));
const staticWork = await readFile(path.join(dist, "work/index.html"), "utf8");
for (const project of PROJECTS) {
  assert.ok(staticWork.includes(project.kind), `Static work fallback is missing the honest type for ${project.name}`);
  assert.ok(staticWork.includes(project.name), `Static work fallback is missing ${project.name}`);
}
for (const layout of ["standard", "reverse", "asymmetric"]) {
  assert.ok(renderedWork.includes(`project-row--${layout}`), `Work archive is missing the ${layout} project composition`);
}
for (const label of ["Discuss NEO", "Discuss Silent Atlas", "Discuss Atlas", "Discuss web work"]) {
  assert.ok(renderedWork.includes(label), `Work archive is missing the working ${label} action`);
}
assert.ok(renderedWork.includes('id="project-01"'), "NEO archive entry should expose the anchor used by its feature link");
assert.ok(renderWithBrowserStubs("/").app.innerHTML.includes('href="/work#project-01"'), "NEO feature should link to its real archive entry");

function testMobileMenu() {
  const { document, listeners } = renderWithBrowserStubs("/");
  const buttonAttributes = new Map([["aria-expanded", "false"], ["aria-label", "Open navigation"]]);
  const navClasses = new Set();
  const bodyClasses = new Set();
  const button = {
    getAttribute(name) { return buttonAttributes.get(name) || null; },
    setAttribute(name, value) { buttonAttributes.set(name, value); },
    focus() { this.focused = true; },
  };
  const nav = {
    classList: {
      toggle(name, force) { force ? navClasses.add(name) : navClasses.delete(name); },
      remove(name) { navClasses.delete(name); },
    },
  };
  const originalQuerySelector = document.querySelector.bind(document);
  document.querySelector = (selector) => {
    if (selector === "#primary-nav") return nav;
    if (selector === "#menu-toggle") return button;
    if (selector.startsWith("#menu-toggle[aria-expanded=")) return button.getAttribute("aria-expanded") === "true" ? button : null;
    return originalQuerySelector(selector);
  };
  document.body.classList.toggle = (name, force) => { force ? bodyClasses.add(name) : bodyClasses.delete(name); };
  document.body.classList.remove = (name) => bodyClasses.delete(name);
  const click = listeners.find(([type]) => type === "click")?.[1];
  const keydown = listeners.find(([type]) => type === "keydown")?.[1];
  click({ target: { closest(selector) { return selector === "#menu-toggle" ? button : null; } } });
  assert.equal(button.getAttribute("aria-expanded"), "true", "Mobile navigation should expose its expanded state");
  assert.ok(navClasses.has("is-open") && bodyClasses.has("menu-open"), "Opening the mobile menu should expose it and lock background scrolling");
  keydown({ key: "Escape" });
  assert.equal(button.getAttribute("aria-expanded"), "false", "Escape should close the mobile menu");
  assert.ok(!navClasses.has("is-open") && !bodyClasses.has("menu-open") && button.focused, "Escape should close the menu and return focus to its button");
}
testMobileMenu();

const contact = renderWithBrowserStubs("/contact", "?project=NEO&service=ai").app.innerHTML;
for (const [field, label] of Object.entries({ name: "Name ", email: "Email ", business: "Business / Project", service: "Service ", budget: "Budget", message: "Message " })) {
  assert.ok(contact.includes(`<label for="${field}">${label}`), `Contact form label is missing or unclear for ${field}`);
  assert.match(contact, new RegExp(`name="${field}"`), `Contact form is missing ${field}`);
}
for (const field of ["name", "email", "service", "message"]) {
  assert.match(contact, new RegExp(`<(?:input|select|textarea) id="${field}"[^>]*required`), `${field} should be required`);
}
assert.match(contact, /aria-live="polite"/, "Contact success state should be announced accessibly");
assert.match(contact, /has no email or backend connection/, "Contact form must explain that delivery is not connected");
assert.match(contact, /nothing you type is sent anywhere and this website does not save it/, "Contact form must say plainly that nothing is sent or saved");
assert.match(contact, /only builds a text summary in this browser tab, which you can copy or download/, "Contact form must explain what happens after preparation");
assert.match(browserSource, /FORM DELIVERY INTEGRATION POINT/, "The future delivery integration point should be obvious in code");
assert.match(browserSource, /Configure the recipient and any provider credentials server-side/, "The integration point should say that the recipient and credentials belong server-side");
assert.match(browserSource, /has <strong>not<\/strong> been sent to Avenox Studio or anyone else, and this website has not saved it/, "Contact success state must clearly explain that the brief was not sent or saved");
assert.match(browserSource, /COPY BRIEF[\s\S]*DOWNLOAD BRIEF/, "Prepared brief should offer copy and download actions");
assert.doesNotMatch(browserSource, /fetch\s*\(|XMLHttpRequest|mailto:/i, "Contact form should not imply or attempt delivery without a backend");
assert.match(contact, /value="NEO"/, "Project context should prefill the project field");

for (const [route, requiredPlaceholders] of [
  ["/privacy", ["[legal business name]", "[registered business address]", "[privacy contact email]", "[date to be added]"]],
  ["/cookies", ["[add provider and cookie details if applicable]", "[privacy contact email]", "[date to be added]"]],
  ["/terms", ["[legal business name]", "[registered business address]", "[jurisdiction and legal wording to be supplied]", "[business contact email]", "[date to be added]"]],
]) {
  const legalPage = renderWithBrowserStubs(route).app.innerHTML;
  assert.match(legalPage, /Before publication:/, `${route}: legal review note should be visible`);
  for (const placeholder of requiredPlaceholders) {
    assert.ok(legalPage.includes(placeholder), `${route}: missing verified-information placeholder ${placeholder}`);
  }
}
const rendered404 = renderWithBrowserStubs("/404").app.innerHTML;
assert.match(rendered404, /<p class="eyebrow">404<\/p>/, "Client 404 should show its status code");
assert.match(rendered404, /THIS PAGE<br \/><span>DOESN'T EXIST\.<\/span>/, "Client 404 should use the approved concise wording");
assert.match(rendered404, />RETURN HOME <span aria-hidden="true">→<\/span>/, "Client 404 should offer a return-home action");
assert.doesNotMatch(rendered404, /The page may have moved|VIEW OUR WORK/, "Client 404 should avoid extra copy and competing actions");

function testSubmission({ nameValue, emailValue = "person@example.com", serviceValue = "web", messageValue = "A considered digital project.", expectSuccess, invalidField = "name", inspect }) {
  class TestFormData {
    constructor(target) { this.values = target.values; }
    get(key) { return this.values[key]; }
  }
  const { listeners } = renderWithBrowserStubs("/contact", "", TestFormData);
  const fields = {
    name: { value: nameValue, customValidity: "", setCustomValidity(value) { this.customValidity = value; }, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    email: { value: emailValue, customValidity: "", setCustomValidity(value) { this.customValidity = value; }, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    business: { value: "A project" },
    service: { value: serviceValue, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    budget: { value: "Not sure yet" },
    message: { value: messageValue, customValidity: "", setCustomValidity(value) { this.customValidity = value; }, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
  };
  const result = { hidden: true, innerHTML: "", scrollIntoView() {} };
  const form = {
    id: "inquiry-form",
    dataset: {},
    values: Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])),
    elements: { namedItem(name) { return fields[name]; } },
    matches(selector) { return selector === "#inquiry-form"; },
    reportValidity() {
      const emailParts = fields.email.value.split("@");
      const emailValid = emailParts.length === 2 && Boolean(emailParts[0]) && emailParts[1].includes(".") && emailParts.every((part) => part.trim() === part);
      const checks = [
        ["name", Boolean(fields.name.customValidity) || !fields.name.value.trim()],
        ["email", !emailValid || Boolean(fields.email.customValidity)],
        ["service", !fields.service.value],
        ["message", fields.message.value.trim().length < 12 || Boolean(fields.message.customValidity)],
      ];
      this.invalidField = checks.find(([, invalid]) => invalid)?.[0] || "";
      return !this.invalidField;
    },
    querySelector(selector) {
      if (selector === "#form-result") return result;
      if (selector === ":invalid") return this.invalidField ? fields[this.invalidField] : null;
      return null;
    },
  };
  const submit = listeners.find(([type]) => type === "submit")?.[1];
  assert.equal(typeof submit, "function", "Contact form submit handler should be registered");
  let prevented = false;
  submit({ target: form, preventDefault() { prevented = true; } });
  assert.ok(prevented, "Contact form must not post to an unconfigured backend");
  if (expectSuccess) {
    assert.equal(result.hidden, false, "Valid inquiry should show its confirmation state");
    assert.match(result.innerHTML, /has <strong>not<\/strong> been sent to Avenox Studio or anyone else/);
    assert.match(form.dataset.brief, /person@example\.com/);
    inspect?.(form.dataset.brief);
  } else {
    assert.equal(result.hidden, true, "Invalid inquiry must not show success");
    assert.equal(fields[invalidField]["aria-invalid"], "true", "Invalid field should be marked for assistive technology");
    assert.ok(fields[invalidField].focused, "Invalid field should receive focus");
  }
}

// Exercise required name, email, service and message validation, plus local-only success.
testSubmission({ nameValue: "   ", expectSuccess: false });
testSubmission({ nameValue: "Avery", emailValue: "not-an-email", expectSuccess: false, invalidField: "email" });
testSubmission({ nameValue: "Avery", serviceValue: "", expectSuccess: false, invalidField: "service" });
testSubmission({ nameValue: "Avery", messageValue: "Short", expectSuccess: false, invalidField: "message" });
testSubmission({ nameValue: "Avery", expectSuccess: true });
// Hardened validation: whitespace-only content, malformed addresses and hidden characters.
testSubmission({ nameValue: "Avery", messageValue: "              ", expectSuccess: false, invalidField: "message" });
testSubmission({ nameValue: "Avery", messageValue: "\u200B\u202E\u0000          \u202E", expectSuccess: false, invalidField: "message" });
testSubmission({ nameValue: "\u202E\u0000 \u200B", expectSuccess: false, invalidField: "name" });
testSubmission({ nameValue: "Avery", emailValue: "a@b", expectSuccess: false, invalidField: "email" });
testSubmission({ nameValue: "Avery", emailValue: "a@@b.com", expectSuccess: false, invalidField: "email" });
testSubmission({ nameValue: "Avery", emailValue: "a b@c.com", expectSuccess: false, invalidField: "email" });
testSubmission({
  nameValue: "Avery\u202E\u0000Evil\nEmail: forged@example.com",
  messageValue: "Line one\r\nLine two \u202E hidden \u0000 text",
  expectSuccess: true,
  inspect(brief) {
    assert.doesNotMatch(brief, /[\u0000\u200B\u202A-\u202E\u2066-\u2069]/, "Brief must not contain control or bidirectional-override characters");
    assert.doesNotMatch(brief, /^Email: forged@example\.com/m, "A field must not be able to forge another line of the brief");
    assert.match(brief, /Message:\nLine one\nLine two {1,2}hidden {1,2}text/, "Message line breaks should be normalised and hidden characters removed");
  },
});

const css = await readFile(path.join(root, "src/styles.css"), "utf8");
assert.ok(css.includes("min-width: 320px"), "320px minimum viewport support is missing");
for (const width of ["360px", "430px", "600px", "800px", "900px"]) {
  assert.ok(css.includes(`max-width: ${width}`), `Responsive breakpoint ${width} is missing`);
}
assert.match(css, /@media\s*\(min-width:\s*1600px\)/, "Large-screen layout treatment is missing");
assert.match(css, /--measure:\s*1500px/, "Wide layouts should retain a readable maximum measure");
for (const mobileComposition of [".project-row--standard .project-visual", ".project-row--reverse .project-copy", ".project-row--asymmetric .project-visual"]) {
  assert.ok(css.includes(mobileComposition), `Mobile project composition is missing: ${mobileComposition}`);
}
assert.match(css, /:focus-visible\s*\{\s*outline:\s*2px solid/, "Visible keyboard focus is missing");
assert.match(css, /\.skip-link\s*\{[\s\S]*?position:\s*fixed/, "Skip link is missing");
assert.match(css, /\.menu-toggle\s*\{[\s\S]*?width:\s*44px[\s\S]*?height:\s*44px/, "Mobile menu button needs a usable touch target");
assert.match(css, /prefers-reduced-motion:\s*reduce/, "Reduced-motion support is missing");
assert.match(browserSource, /reduceMotion\.matches/, "Interactive motion should respect the reduced-motion preference");
assert.match(browserSource, /IntersectionObserver/, "Progressive reveal behavior should avoid requiring motion support");
const relativeLuminance = (hex) => {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const colorToken = (name) => css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
const contrast = (first, second) => {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
const paper = colorToken("--paper");
const ink = colorToken("--ink");
const accent = colorToken("--accent");
const muted = colorToken("--muted");
const accentInk = colorToken("--accent-ink");
assert.ok(paper && ink && accent && muted && accentInk, "Core accessible color tokens are missing");
assert.ok(contrast(muted, paper) >= 4.5, "Muted body text should meet WCAG AA contrast on paper");
assert.ok(contrast(ink, accent) >= 4.5, "Primary button text should meet WCAG AA contrast on the cyan hover surface");
for (const background of [paper, "#f0f0eb", "#ecece7", "#f1f1ec"]) {
  assert.ok(contrast(accentInk, background) >= 4.5, `Cyan accent text should meet WCAG AA on ${background}`);
}
assert.doesNotMatch(browserSource, /(?:localhost|127\.0\.0\.1)/i, "Browser code must not call a local service");

// ---------------------------------------------------------------------------------------------
// Security and privacy guardrails
// ---------------------------------------------------------------------------------------------
const siteDataSource = await readFile(path.join(root, "src/site-data.js"), "utf8");
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+/gi;
const allowedPlaceholderEmails = new Set(["you@example.com"]);
for (const [name, rawSource] of [["src/main.js", browserSource], ["src/site-data.js", siteDataSource]]) {
  // The legal copy names the storage APIs it says are unused, so scan the executable code around it.
  const source = rawSource.replace(/const LEGAL_CONTENT = \{[\s\S]*?\n\};\n/, "");
  assert.ok(source.length > 1000, `${name}: code scan should cover the file`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|WebSocket|EventSource|XMLHttpRequest|\bfetch\s*\(|importScripts|serviceWorker|\beval\s*\(|new Function|document\.write|insertAdjacentHTML|outerHTML|dangerouslySetInnerHTML|postMessage|window\.open|mailto:|javascript:/, `${name}: contains a storage, network, dynamic-code or unsafe-HTML API that the privacy policy and CSP rely on being absent`);
  assert.doesNotMatch(source, /https?:\/\//i, `${name}: must not contain external URLs (the CSP is same-origin only)`);
  const emails = (source.match(emailPattern) || []).filter((address) => !allowedPlaceholderEmails.has(address.toLowerCase()));
  assert.deepEqual(emails, [], `${name}: must not publish an email address in client code`);
}
assert.equal((browserSource.match(/\.innerHTML\s*=/g) || []).length, 2, "Only the page renderer and the static form-result state may assign innerHTML");
assert.doesNotMatch(browserSource, /\b(?:target="_blank"|on(?:click|error|load|submit|focus)=)/i, "Templates must not use inline event handlers or target=_blank");

// Untrusted URL parameters must be escaped, and hidden or bidirectional characters removed.
{
  const attack = '<img src=x onerror=alert(1)>"><script>alert(2)</script>';
  const html = renderWithBrowserStubs("/contact", `?project=${encodeURIComponent(attack)}&service=${encodeURIComponent('"><script>alert(3)</script>')}`).app.innerHTML;
  assert.ok(!html.includes("<img src=x"), "Project parameter must not inject an element");
  assert.doesNotMatch(html, /<script/i, "URL parameters must not inject a script element");
  assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"), "Project parameter should be shown only as escaped text");
  assert.ok(!/<option value="[a-z]+" selected>/.test(html), "An unknown service parameter must not select a service");
  const spoof = renderWithBrowserStubs("/contact", `?project=${encodeURIComponent("A\u202EB\u0000C\nD")}`).app.innerHTML;
  assert.doesNotMatch(spoof, /[\u0000\u202A-\u202E\u2066-\u2069]/, "Project parameter must not carry bidirectional-override or control characters");
  const long = renderWithBrowserStubs("/contact", `?project=${"x".repeat(5000)}`).app.innerHTML;
  assert.ok(!long.includes("x".repeat(121)), "Project parameter must be length-limited");
}

// Navigation must tolerate malformed hashes and never push a protocol-relative URL.
{
  const { listeners, history } = renderWithBrowserStubs("/");
  const click = listeners.find(([type]) => type === "click")[1];
  const fire = (href) => click({
    defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    preventDefault() {},
    target: { closest(selector) { return selector === "a[data-link], a[data-scroll]" ? { href, target: "", hasAttribute: () => false } : null; } },
  });
  assert.doesNotThrow(() => fire("http://avenox.local/work#%E0%A4%A"), "A malformed percent-escape in the hash must not throw");
  assert.doesNotThrow(() => fire("http://avenox.local/work#%"), "A bare percent sign in the hash must not throw");
  fire("http://avenox.local//privacy");
  assert.ok(history.pushed.length >= 3 && history.pushed.every((url) => !url.startsWith("//")), "History entries must never start with //");
}

// A rendering failure must show a clean, generic state with no implementation detail.
{
  const failed = renderWithBrowserStubs("/", "", FormData, { SERVICES: null }).app.innerHTML;
  assert.match(failed, /COULD NOT LOAD/, "A render failure should show the clean error state");
  assert.doesNotMatch(failed, /TypeError|Cannot read|undefined|null|\bat \S+:\d+|main\.js|node:|\/home\//i, "The error state must not reveal stack traces, file names or paths");
  assert.match(failed, /href="\/"[^>]*>RETURN HOME/, "The error state should offer a way home");
}

// Privacy copy must describe the real implementation: nothing sent, saved or tracked today.
for (const route of ["/privacy", "/cookies"]) {
  const page = renderWithBrowserStubs(route).app.innerHTML;
  assert.match(page, /What the website does today/, `${route}: must separate current behaviour from later changes`);
  assert.match(page, /What may be added later/, `${route}: must say that future services are not part of the current site`);
}
{
  const privacy = renderWithBrowserStubs("/privacy").app.innerHTML;
  const cookies = renderWithBrowserStubs("/cookies").app.innerHTML;
  assert.match(privacy, /does not send it to Avenox Studio or any third party, does not save it on a server and does not write it to cookies or browser storage/, "Privacy must state what the form does");
  assert.match(cookies, /sets no cookies and does not use localStorage, sessionStorage or IndexedDB/, "Cookies page must state the current storage behaviour");
  assert.doesNotMatch(`${privacy}${cookies}`, /we (?:collect|store|track|share|sell)|your (?:data|information) is (?:stored|collected|shared)/i, "Legal copy must not claim collection that the site does not perform");
  assert.match(renderWithBrowserStubs("/terms").app.innerHTML, /does not send it to Avenox Studio[\s\S]*\[add contact method\]/, "Terms must say the form does not send an inquiry and keep the contact-method placeholder");
}

// Security headers: a strict, same-origin policy that matches what the site actually loads.
const headerRule = vercelConfig.headers?.find((rule) => rule.source === "/(.*)");
assert.ok(headerRule, "vercel.json must apply security headers to every route");
const configuredHeaders = Object.fromEntries(headerRule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
const csp = configuredHeaders["content-security-policy"];
assert.ok(csp, "A Content-Security-Policy must be configured");
const cspDirectives = Object.fromEntries(csp.split(";").map((part) => part.trim()).filter(Boolean).map((part) => { const [name, ...values] = part.split(/\s+/); return [name, values]; }));
assert.deepEqual(cspDirectives["default-src"], ["'self'"], "CSP default-src must be 'self'");
assert.deepEqual(cspDirectives["script-src"], ["'self'"], "CSP script-src must be 'self' only");
assert.deepEqual(cspDirectives["style-src"], ["'self'"], "CSP style-src must be 'self' only (the site uses no inline styles)");
assert.deepEqual(cspDirectives["img-src"], ["'self'", "data:"], "CSP img-src should allow same-origin and the data: SVG select arrow only");
for (const directive of ["object-src", "frame-src", "worker-src", "media-src"]) assert.deepEqual(cspDirectives[directive], ["'none'"], `CSP ${directive} must be 'none'`);
assert.deepEqual(cspDirectives["frame-ancestors"], ["'none'"], "The site must not be frameable");
assert.deepEqual(cspDirectives["base-uri"], ["'self'"], "CSP base-uri must be 'self'");
assert.deepEqual(cspDirectives["form-action"], ["'self'"], "CSP form-action must be 'self'");
assert.ok("upgrade-insecure-requests" in cspDirectives, "CSP should upgrade insecure requests in production");
assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|unsafe-hashes|\*|https?:/, "CSP must not use unsafe keywords, wildcards or external origins");
assert.equal(configuredHeaders["x-content-type-options"], "nosniff");
assert.equal(configuredHeaders["referrer-policy"], "strict-origin-when-cross-origin");
assert.match(configuredHeaders["permissions-policy"], /camera=\(\).*microphone=\(\).*geolocation=\(\)/, "Permissions-Policy should disable unused sensitive features");
assert.equal(configuredHeaders["x-frame-options"], "DENY");
assert.equal(configuredHeaders["cross-origin-opener-policy"], "same-origin");

// Published output: allowlisted file types only, no dotfiles, no inline script/style, no email addresses.
{
  const allowedTypes = new Set([".html", ".js", ".css", ".txt", ".xml", ".svg", ".png", ".webp", ".jpg", ".jpeg", ".ico"]);
  const files = (await readdir(dist, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile());
  assert.ok(files.length > 10, "dist should contain the built site");
  for (const entry of files) {
    const relative = path.relative(dist, path.join(entry.parentPath ?? entry.path, entry.name));
    assert.ok(!relative.split(path.sep).some((part) => part.startsWith(".")), `dist must not contain dotfiles: ${relative}`);
    assert.ok(allowedTypes.has(path.extname(entry.name).toLowerCase()), `dist contains an unexpected file type: ${relative}`);
    if ([".html", ".js", ".css", ".txt", ".xml", ".svg"].includes(path.extname(entry.name).toLowerCase())) {
      const text = await readFile(path.join(dist, relative), "utf8");
      const emails = (text.match(emailPattern) || []).filter((address) => !allowedPlaceholderEmails.has(address.toLowerCase()));
      assert.deepEqual(emails, [], `dist/${relative} must not publish an email address`);
      assert.doesNotMatch(text, /sourceMappingURL|-----BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}/, `dist/${relative} must not reference source maps or contain credential-like strings`);
      if (relative.endsWith(".html")) {
        assert.doesNotMatch(text, /<script(?![^>]*\bsrc=)/i, `dist/${relative}: inline scripts would require an unsafe CSP`);
        assert.doesNotMatch(text, /<style\b|\sstyle=|\son[a-z]+=/i, `dist/${relative}: inline styles or event handlers would require an unsafe CSP`);
        assert.doesNotMatch(text, /<(?:iframe|object|embed|form)\b/i, `dist/${relative}: static HTML must not embed frames or objects`);
      }
    }
  }
}

// The local servers: robust against malformed requests, no repository leakage, same headers as production.
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1", () => { const { port } = probe.address(); probe.close(() => resolve(port)); });
    probe.on("error", reject);
  });
}
function rawRequest(port, method, target) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1");
    const chunks = [];
    socket.setTimeout(5000, () => { socket.destroy(); reject(new Error(`timeout for ${target}`)); });
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.on("error", reject);
    socket.on("close", () => {
      const text = Buffer.concat(chunks).toString("latin1");
      const separator = text.indexOf("\r\n\r\n");
      const head = text.slice(0, separator).split("\r\n");
      const headers = Object.fromEntries(head.slice(1).map((line) => { const at = line.indexOf(":"); return [line.slice(0, at).toLowerCase(), line.slice(at + 1).trim()]; }));
      resolve({ status: Number(head[0].split(" ")[1]), headers, body: text.slice(separator + 4) });
    });
    socket.write(`${method} ${target} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
  });
}
async function withServer(mode, run) {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(root, "scripts/server.mjs"), mode], { env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (chunk) => { if (String(chunk).includes("listening")) resolve(); });
    child.on("exit", (code) => reject(new Error(`server exited early (${code}): ${stderr}`)));
    setTimeout(() => reject(new Error("server did not start")), 8000);
  });
  try {
    await run(port);
    assert.equal(child.exitCode, null, `${mode} server must still be running after the probes (stderr: ${stderr})`);
    assert.equal(stderr, "", `${mode} server must not print errors for malformed requests`);
  } finally {
    child.kill();
  }
}
const expectedLocalCsp = csp.replace(/;?\s*upgrade-insecure-requests/, "");
const hostileTargets = ["//", "//evil.com/x", "/%E0%A4%A", "/%00", "/..%2f..%2fpackage.json", "/%2e%2e/%2e%2e/package.json", "/../package.json", "/assets/../../package.json", "/.env.example", "/.git/HEAD", "/.git/config", "/package.json", "/package-lock.json", "/vercel.json", "/README.md", "/scripts/server.mjs", "/scripts/qa.mjs", "/src/../package.json", "/src/%2e%2e/package.json", "/PORTFOLIO-ASSETS.md", "/%5c..%5cpackage.json"];
for (const mode of ["--preview", "--dev"]) {
  await withServer(mode, async (port) => {
    for (const target of hostileTargets) {
      const response = await rawRequest(port, "GET", target);
      assert.ok([200, 400, 403, 404].includes(response.status), `${mode} ${target}: unexpected status ${response.status}`);
      assert.doesNotMatch(response.body, /"name":\s*"avenox-website"|SITE_ORIGIN=|# AVENOX|import assert|createServer|\[core\]/, `${mode} ${target}: served a repository file`);
      assert.doesNotMatch(response.body, /Error:|TypeError|\bat \S+ \(|\/home\/|node_modules/, `${mode} ${target}: error responses must not leak stack traces or paths`);
      assert.equal(response.headers["x-content-type-options"], "nosniff", `${mode} ${target}: missing nosniff`);
    }
    for (const target of ["/.env.example", "/package.json", "/scripts/server.mjs", "/README.md", "/vercel.json", "/.git/HEAD", "/.git/config"]) {
      assert.equal((await rawRequest(port, "GET", target)).status, 404, `${mode} ${target}: repository files must not be served`);
    }
    const home = await rawRequest(port, "GET", "/");
    assert.equal(home.status, 200, `${mode}: home page should load`);
    assert.equal(home.headers["content-security-policy"], expectedLocalCsp, `${mode}: local servers should send the production CSP`);
    for (const key of ["x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options", "cross-origin-opener-policy"]) {
      assert.equal(home.headers[key], configuredHeaders[key], `${mode}: ${key} should match vercel.json`);
    }
    const image = await rawRequest(port, "GET", "/projects/neo/neo-command-center-desktop.webp");
    assert.equal(image.status, 200, `${mode}: portfolio images must be served`);
    assert.equal(image.headers["content-type"], "image/webp");
    assert.equal((await rawRequest(port, "POST", "/")).status, 405, `${mode}: only GET and HEAD are allowed`);
    assert.equal((await rawRequest(port, "GET", "/does-not-exist/")).status, mode === "--preview" ? 404 : 200, `${mode}: unknown routes use the 404 page or the app shell`);
  });
}

console.log(`QA passed (static route and browser-stub checks): ${ROUTES.length} route builds, client rendering, internal links, imagery, route metadata, legal placeholders, contact flow, responsive CSS, accessibility tokens, reduced-motion support, security headers/CSP policy, published-output hygiene, untrusted-input handling, privacy-copy accuracy and local-server hardening. No real-browser visual pass is performed by this script.`);
