import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
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

// The actual build output must contain a page entry for every requested route.
for (const route of ROUTES) {
  const file = route.path === "/"
    ? path.join(dist, "index.html")
    : path.join(dist, route.path.slice(1), "index.html");
  await access(file);
  const html = await readFile(file, "utf8");
  const staticHeading = expectedHeadings.get(route.path);
  if (staticHeading) assert.ok(html.includes(staticHeading), `${route.path}: static fallback heading missing`);
  assert.match(html, /<title>[^<]+<\/title>/, `${route.path}: title missing`);
  assert.match(html, /<meta name="description" content="[^"]+"\s*\/>/, `${route.path}: description missing`);
  assert.match(html, /<meta property="og:title"/, `${route.path}: Open Graph title missing`);
  assert.match(html, /<meta property="og:description"/, `${route.path}: Open Graph description missing`);
  assert.match(html, /<link rel="canonical"/, `${route.path}: canonical missing`);
  if (route.noindex) assert.match(html, /noindex,follow/, "404 route should not be indexed");
}
await access(path.join(dist, "404.html"));

// Exercise the client renderer on each route using a minimal browser surface.
for (const [route, expectedHeading] of expectedHeadings) {
  const { app, document, attributes } = renderWithBrowserStubs(route);
  assert.ok(app.innerHTML.includes(expectedHeading), `${route}: expected page heading was not rendered`);
  assertBalancedMarkup(app.innerHTML, route);
  assert.ok(document.title.includes("AVENOX"), `${route}: document title was not set`);
  assert.ok(attributes.get("canonical")?.href, `${route}: client canonical was not set`);
  assert.ok(attributes.get("robots")?.content, `${route}: robots metadata was not set`);

  const ids = [...app.innerHTML.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${route}: duplicate element IDs`);
  for (const match of app.innerHTML.matchAll(/<img\b([^>]*)>/g)) {
    assert.match(match[1], /\balt="[^"]*"/, `${route}: image is missing alt text`);
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

const contact = renderWithBrowserStubs("/contact", "?project=NEO&service=ai").app.innerHTML;
for (const [field, label] of Object.entries({ name: "Name ", email: "Email ", business: "Business / Project", service: "Service ", budget: "Budget", message: "Message " })) {
  assert.ok(contact.includes(`<label for="${field}">${label}`), `Contact form label is missing or unclear for ${field}`);
  assert.match(contact, new RegExp(`name="${field}"`), `Contact form is missing ${field}`);
}
for (const field of ["name", "email", "service", "message"]) {
  assert.match(contact, new RegExp(`<(?:input|select|textarea) id="${field}"[^>]*required`), `${field} should be required`);
}
assert.match(contact, /aria-live="polite"/, "Contact success state should be announced accessibly");
assert.match(contact, /form is not connected to email/, "Contact form must explain that delivery is not connected");
assert.match(browserSource, /has \<strong\>not<\/strong\> been sent or stored/, "Contact success state must clearly explain that the brief was not sent");
assert.match(contact, /value="NEO"/, "Project context should prefill the project field");

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
for (const width of ["360px", "430px", "600px", "760px", "900px"]) {
  assert.ok(css.includes(`max-width: ${width}`), `Responsive breakpoint ${width} is missing`);
}
assert.match(css, /prefers-reduced-motion:\s*reduce/, "Reduced-motion support is missing");
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
const muted = colorToken("--muted");
const accentInk = colorToken("--accent-ink");
assert.ok(paper && muted && accentInk, "Core accessible color tokens are missing");
assert.ok(contrast(muted, paper) >= 4.5, "Muted body text should meet WCAG AA contrast on paper");
for (const background of [paper, "#f0f0eb", "#ecece7", "#f1f1ec"]) {
  assert.ok(contrast(accentInk, background) >= 4.5, `Cyan accent text should meet WCAG AA on ${background}`);
}
assert.doesNotMatch(browserSource, /(?:localhost|127\.0\.0\.1)/i, "Browser code must not call a local service");

console.log(`QA passed: ${ROUTES.length} route builds, client rendering, internal links, imagery, metadata, form fields, responsive breakpoints and reduced-motion support.`);
