import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
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

function renderWithBrowserStubs(pathname, search = "", FormDataClass = FormData) {
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
  };
  const location = new URL(`http://avenox.local${pathname}${search}`);
  const history = { scrollRestoration: "auto", pushState() {} };
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
  };
  vm.runInNewContext(browserSource, context, { timeout: 1500, filename: "src/main.js" });
  return { app, document, attributes, listeners: document.listeners };
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
    assert.ok(src?.startsWith("/images/"), `${route}: image source should be same-origin`);
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
const atlasResearch = PROJECTS.find((project) => project.name === "ATLAS RESEARCH");
assert.equal(neoProject?.kind, "Personal AI system / product", "NEO should be classified accurately as a personal AI system / product");
assert.match(neoProject?.description || "", /concept/i, "NEO must be described as a concept rather than a launched product");
assert.match(neoProject?.visualLabel || "", /illustrative/i, "NEO's interface concept must be identified as illustrative");
assert.match(neoProject?.alt || "", /not a product screenshot/i, "NEO's alt text must not imply a real screenshot");
assert.match(renderedWork, /Personal AI system \/ product/, "NEO's project type should be visible in the archive");
assert.match(renderedWork, /Editorial website concept/, "Silent Atlas should be identified as a website concept");
assert.equal(atlasResearch?.kind, "Information design study", "Atlas Research should be classified as an information-design study");
assert.ok(!atlasResearch?.query.includes("service="), "Atlas Research should not be prefilled as a service it does not represent");
assert.match(renderedWork, /Information design study/, "Atlas Research's project type should be visible in the archive");
const staticWork = await readFile(path.join(dist, "work/index.html"), "utf8");
for (const project of PROJECTS) {
  assert.ok(staticWork.includes(project.kind), `Static work fallback is missing the honest type for ${project.name}`);
  assert.ok(staticWork.includes(project.name), `Static work fallback is missing ${project.name}`);
}
for (const layout of ["standard", "reverse", "asymmetric"]) {
  assert.ok(renderedWork.includes(`project-row--${layout}`), `Work archive is missing the ${layout} project composition`);
}
for (const label of ["Discuss NEO", "Discuss Silent Atlas", "Discuss map-led work"]) {
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
assert.match(contact, /After preparation, copy or download the brief on this device/, "Contact form must explain what happens after preparation");
assert.match(browserSource, /FORM DELIVERY INTEGRATION POINT/, "The future delivery integration point should be obvious in code");
assert.match(browserSource, /Future delivery recipient: studioavenox@gmail\.com/, "The future server-side recipient should be documented at the integration point");
assert.match(browserSource, /has <strong>not<\/strong> been sent or stored/, "Contact success state must clearly explain that the brief was not sent");
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

function testSubmission({ nameValue, emailValue = "person@example.com", serviceValue = "web", messageValue = "A considered digital project.", expectSuccess, invalidField = "name" }) {
  class TestFormData {
    constructor(target) { this.values = target.values; }
    get(key) { return this.values[key]; }
  }
  const { listeners } = renderWithBrowserStubs("/contact", "", TestFormData);
  const fields = {
    name: { value: nameValue, customValidity: "", setCustomValidity(value) { this.customValidity = value; }, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    email: { value: emailValue, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    business: { value: "A project" },
    service: { value: serviceValue, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
    budget: { value: "Not sure yet" },
    message: { value: messageValue, setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; } },
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
        ["email", !emailValid],
        ["service", !fields.service.value],
        ["message", fields.message.value.trim().length < 12],
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
    assert.match(result.innerHTML, /has <strong>not<\/strong> been sent or stored/);
    assert.match(form.dataset.brief, /person@example\.com/);
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

console.log(`QA passed (static route and browser-stub checks): ${ROUTES.length} route builds, client rendering, internal links, imagery, route metadata, legal placeholders, contact flow, responsive CSS, accessibility tokens and reduced-motion support. No real-browser visual pass is performed by this script.`);
