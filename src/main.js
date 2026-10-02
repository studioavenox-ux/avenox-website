import { PROCESS, PROJECTS, ROUTES, SERVICES } from "./site-data.js";

document.documentElement.classList.add("has-js");

const app = document.querySelector("#app");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

function normalizePath(pathname) {
  if (pathname === "/404.html") return "/404";
  const clean = pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  return clean || "/";
}

function header(path) {
  const navItems = [
    ["Work", "/work"],
    ["Services", "/services"],
    ["Studio", "/about"],
    ["Contact", "/contact"],
  ];
  const links = navItems.map(([label, href]) => {
    const current = path === href ? ' aria-current="page"' : "";
    return `<a href="${href}" data-link${current}>${label}</a>`;
  }).join("");

  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header" id="top">
      <div class="shell header-inner">
        <a class="brand" href="/" data-link aria-label="AVENOX home">
          <span class="brand-name">AVENOX<span class="brand-mark" aria-hidden="true">/</span></span>
          <span class="brand-tagline">Web • AI • Digital Systems</span>
        </a>
        <nav class="primary-nav" id="primary-nav" aria-label="Primary navigation">
          ${links}
          <a class="mobile-nav-contact" href="/contact" data-link${path === "/contact" ? ' aria-current="page"' : ""}>Start a project <span aria-hidden="true">↗</span></a>
        </nav>
        <a class="header-cta" href="/contact" data-link${path === "/contact" ? ' aria-current="page"' : ""}>START A PROJECT <span aria-hidden="true">↗</span></a>
        <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Open navigation" aria-controls="primary-nav" aria-expanded="false">
          <span></span><span></span>
        </button>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="shell footer-main">
        <div class="footer-brand-block">
          <a class="brand brand--footer" href="/" data-link aria-label="AVENOX home">
            <span class="brand-name">AVENOX<span class="brand-mark" aria-hidden="true">/</span></span>
          </a>
          <p>Web • AI • Digital Systems</p>
        </div>
        <nav class="footer-navigation" aria-label="Footer navigation">
          <a href="/work" data-link>Work</a>
          <a href="/services" data-link>Services</a>
          <a href="/about" data-link>Studio</a>
          <a href="/contact" data-link>Contact</a>
        </nav>
        <a class="button button--dark footer-cta" href="/contact" data-link>START A PROJECT <span aria-hidden="true">↗</span></a>
      </div>
      <div class="shell footer-bottom">
        <span>© ${new Date().getFullYear()} AVENOX</span>
        <nav aria-label="Legal links">
          <a href="/privacy" data-link>Privacy</a>
          <a href="/cookies" data-link>Cookies</a>
          <a href="/terms" data-link>Terms</a>
        </nav>
      </div>
    </footer>`;
}

function arrowLink(href, label, extraClass = "", ariaLabel = "") {
  return `<a class="text-link ${extraClass}" href="${escapeHtml(href)}" data-link${ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : ""}>${label}<span aria-hidden="true">↗</span></a>`;
}


function projectRow(project) {
  const media = project.image
    ? `<img src="${project.image}" alt="${escapeHtml(project.alt)}" width="1600" height="1000" loading="lazy" decoding="async" />`
    : `<div class="project-pending" role="img" aria-label="${escapeHtml(`${project.name}: project screenshot pending`)}"><span>SCREENSHOT PENDING</span><strong>${escapeHtml(project.name)}</strong></div>`;
  const figure = `
    <figure class="project-visual ${project.className} reveal">
      ${media}
      <figcaption>${escapeHtml(project.visualLabel)}</figcaption>
    </figure>`;
  const copy = `
    <div class="project-copy reveal">
      <p class="project-meta"><span>${project.number}</span><span>${escapeHtml(project.kind)}</span></p>
      <h3 id="project-${project.number}">${escapeHtml(project.name)}</h3>
      <p>${escapeHtml(project.description)}</p>
      ${arrowLink(`/contact?${project.query}`, project.ctaLabel || "Discuss this work", "project-cta", `Start a conversation about ${project.name}`)}
    </div>`;
  return `<article class="project-row project-row--${project.layout || "standard"}" aria-labelledby="project-${project.number}">${copy}${figure}</article>`;
}

function selectedWork({ compact = false } = {}) {
  const projects = compact ? PROJECTS.slice(0, 3) : PROJECTS;
  return `
    <section class="work-section shell section-pad" id="work" aria-labelledby="work-title">
      <div class="section-heading${compact ? " section-heading--split" : ""} reveal">
        <h2 class="section-title" id="work-title">Selected work</h2>
        ${compact ? `<p class="section-intro">Personal AI, editorial web and academic productivity.</p>` : ""}
      </div>
      <div class="project-list">${projects.map(projectRow).join("")}</div>
      ${compact ? `<div class="work-more">${arrowLink("/work", "View all work")}</div>` : ""}
    </section>`;
}

function serviceRows() {
  return `<div class="service-list">${SERVICES.map((service) => `
    <details class="service-row reveal" id="${service.slug}">
      <summary>
        <span class="service-number"><span>${service.number}</span><span>${service.name}</span></span>
        <span class="service-summary">
          <span class="service-headline">${service.headline}</span>
          <span class="service-teaser">${service.summary}</span>
        </span>
        <span class="service-toggle" aria-hidden="true"></span>
      </summary>
      <div class="service-detail">
        <p>${service.detail}</p>
        <ul>${service.list.map((item) => `<li>${item}</li>`).join("")}</ul>
        ${arrowLink(`/contact?service=${service.slug}`, `Discuss ${service.name.toLowerCase()}`)}
      </div>
    </details>`).join("")}</div>`;
}

function serviceSection({ title = "What we build", description = "Web, AI, automation and software—chosen to fit the work.", className = "" } = {}) {
  return `
    <section class="services-section shell section-pad ${className}" aria-labelledby="services-title">
      <div class="section-heading section-heading--split reveal">
        <h2 class="section-title" id="services-title">${title}</h2>
        <p class="section-intro">${description}</p>
      </div>
      ${serviceRows()}
    </section>`;
}

function processSection({ full = false } = {}) {
  return `
    <section class="process-section shell section-pad" aria-labelledby="process-title">
      <div class="section-heading section-heading--split reveal">
        <h2 class="section-title" id="process-title">How we work</h2>
        <p class="section-intro">A clear path from first question to thoughtful launch.</p>
      </div>
      <div class="process-grid${full ? " process-grid--large" : ""}">
        ${PROCESS.map((step) => `
          <article class="process-step reveal">
            <span class="process-number">${step.number}</span>
            <h3>${step.name}</h3>
            <p>${step.text}</p>
          </article>`).join("")}
      </div>
    </section>`;
}

function closingCta() {
  return `
    <section class="closing-cta" aria-labelledby="closing-title">
      <div class="shell closing-inner reveal">
        <h2 id="closing-title">HAVE SOMETHING<br />WORTH BUILDING?</h2>
        <p>Tell us what you are working on. We can start with a conversation.</p>
        <a class="button button--dark" href="/contact" data-link>START A PROJECT <span aria-hidden="true">→</span></a>
      </div>
    </section>`;
}

function homePage() {
  return `
    <main id="main" class="page-home" tabindex="-1">
      <section class="hero shell" aria-labelledby="page-heading">
        <div class="hero-overline"><p class="eyebrow">Avenox Studio</p></div>
        <h1 id="page-heading" class="hero-title">LET'S MAKE<br />SOMETHING<br /><span>USEFUL.</span></h1>
        <div class="hero-lower">
          <div class="hero-copy">
            <p>Thoughtful websites, AI products and digital systems—designed and built with care.</p>
            <div class="hero-actions">
              <a class="button button--dark" href="/contact" data-link>START A PROJECT <span aria-hidden="true">↗</span></a>
              <a class="button button--light" href="#work" data-link>VIEW OUR WORK <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <p class="hero-aside">Design and engineering, brought into the same conversation.</p>
        </div>
        <figure class="hero-visual">
          <img src="/projects/neo/neo-command-center-desktop.webp" alt="Screenshot of the NEO command center: an anime-styled agent figure surrounded by task, workflow and system panels." width="1600" height="1000" fetchpriority="high" decoding="async" />
          <figcaption>Real project screenshot — NEO command center</figcaption>
        </figure>
      </section>
      ${serviceSection()}
      ${selectedWork({ compact: true })}
      <section class="neo-feature" aria-labelledby="neo-feature-title">
        <div class="shell neo-inner">
          <div class="neo-identity reveal">
            <p class="eyebrow">PERSONAL AI AGENT / INTERACTIVE PROTOTYPE</p>
            <h2 id="neo-feature-title">NEO</h2>
          </div>
          <div class="neo-copy reveal">
            <p class="neo-lead">A quieter way to think alongside AI.</p>
            ${arrowLink("/work#project-01", "View the project")}
          </div>
        </div>
      </section>
      <section class="studio-section shell section-pad" aria-labelledby="studio-title">
        <div class="studio-intro reveal">
          <h2 class="section-title" id="studio-title">START WITH<br />THE WORK.</h2>
        </div>
        <div class="studio-copy reveal">
          <p class="studio-lead">Understand what needs to change; then shape the design, tools and build around it.</p>
          ${arrowLink("/about", "About the studio")}
        </div>
      </section>
      ${processSection()}
      ${closingCta()}
    </main>`;
}

function workPage() {
  return `
    <main id="main" class="page-inner" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">Selected work</p>
        <h1 id="page-heading">IDEAS, MADE<br /><span>CONSIDERED.</span></h1>
        <div class="page-hero-lower">
          <p>A personal AI agent prototype, an editorial website concept, an academic productivity platform and a company website.</p>
        </div>
      </section>
      ${selectedWork()}
      ${closingCta()}
    </main>`;
}

function servicesPage() {
  return `
    <main id="main" class="page-inner" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">Services</p>
        <h1 id="page-heading">DIGITAL WORK,<br /><span>WITH INTENT.</span></h1>
        <div class="page-hero-lower">
          <p>Design and engineering across websites, AI, automation and software.</p>
        </div>
      </section>
      ${serviceSection({ title: "Areas of practice", description: "Open a discipline for a closer look.", className: "services-detail-section" })}
      ${processSection({ full: true })}
      ${closingCta()}
    </main>`;
}

function aboutPage() {
  return `
    <main id="main" class="page-inner" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">Studio</p>
        <h1 id="page-heading">THOUGHTFUL<br />BY <span>DESIGN.</span></h1>
      </section>
      <section class="about-story shell section-pad">
        <div class="about-story-label reveal"><h2 class="section-title">MADE TO<br />MAKE SENSE.</h2></div>
        <div class="about-story-copy reveal">
          <p class="about-lead">Good digital work starts with the right question and careful attention to the people who use it.</p>
          <p>Across websites, AI products, automation and software, we bring design and engineering into the same conversation.</p>
          <p>Clear decisions keep the work focused, with care for the details that shape everyday use.</p>
        </div>
      </section>
      <section class="principles-section">
        <div class="shell principles-inner">
          <div class="principles-heading reveal">
            <h2 class="section-title">A CLEARER<br />WAY FORWARD.</h2>
          </div>
          <div class="principles-list">
            <article class="principle reveal"><h3>Start with people</h3><p>Technology should improve an experience for someone.</p></article>
            <article class="principle reveal"><h3>Make it legible</h3><p>Clear structure and language are part of good design.</p></article>
            <article class="principle reveal"><h3>Use tools with intent</h3><p>AI and automation should solve a real problem, not become the story.</p></article>
            <article class="principle reveal"><h3>Care through the details</h3><p>Small interactions shape how the whole feels to use.</p></article>
          </div>
        </div>
      </section>
      ${processSection({ full: true })}
      ${closingCta()}
    </main>`;
}

function contactPage() {
  const params = new URLSearchParams(window.location.search);
  const chosenService = SERVICES.find((service) => service.slug === params.get("service"));
  const project = (params.get("project") || "").slice(0, 120);
  const serviceOptions = SERVICES.map((service) => `
    <option value="${service.slug}"${chosenService?.slug === service.slug ? " selected" : ""}>${service.name}</option>`).join("");

  return `
    <main id="main" class="page-inner contact-page" tabindex="-1">
      <section class="page-hero shell contact-hero" aria-labelledby="page-heading">
        <p class="eyebrow">Contact</p>
        <h1 id="page-heading">TELL US WHAT<br /><span>YOU'RE MAKING.</span></h1>
        <div class="page-hero-lower">
          <p>A rough outline of the idea, the work or the question is enough to begin.</p>
        </div>
      </section>
      <section class="contact-content shell">
        <div class="contact-aside reveal">
          <h2>A few useful<br />details.</h2>
          <p>What needs to change? Who is it for? What would a good next step look like?</p>
        </div>
        <form class="inquiry-form reveal" id="inquiry-form" novalidate>
          <div class="form-context"${project ? "" : " hidden"}><span>PROJECT CONTEXT</span><strong>${escapeHtml(project)}</strong></div>
          <div class="form-grid">
            <div class="form-field">
              <label for="name">Name <span aria-hidden="true">*</span></label>
              <input id="name" name="name" type="text" autocomplete="name" maxlength="120" required placeholder="Your name" />
            </div>
            <div class="form-field">
              <label for="email">Email <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com" />
            </div>
            <div class="form-field">
              <label for="business">Business / Project</label>
              <input id="business" name="business" type="text" autocomplete="organization" maxlength="160" value="${escapeHtml(project)}" placeholder="A name, an idea, or both" />
            </div>
            <div class="form-field">
              <label for="service">Service <span aria-hidden="true">*</span></label>
              <select id="service" name="service" required>
                <option value=""${chosenService ? "" : " selected"} disabled>Select a service</option>
                ${serviceOptions}
              </select>
            </div>
            <div class="form-field form-field--full">
              <label for="budget">Budget</label>
              <input id="budget" name="budget" type="text" maxlength="120" placeholder="A range, currency, or ‘not sure yet’" />
            </div>
            <div class="form-field form-field--full">
              <label for="message">Message <span aria-hidden="true">*</span></label>
              <textarea id="message" name="message" rows="6" minlength="12" maxlength="4000" required placeholder="What are you hoping to make, improve or figure out?"></textarea>
            </div>
          </div>
          <div class="form-bottom">
            <p id="form-note">Required fields are marked with <span aria-hidden="true">*</span>. This form has no email or backend connection; your details are not sent or stored. After preparation, copy or download the brief on this device.</p>
            <button class="button button--dark" type="submit">PREPARE MY BRIEF <span aria-hidden="true">↗</span></button>
          </div>
          <div class="form-result" id="form-result" role="status" aria-live="polite" hidden></div>
        </form>
      </section>
    </main>`;
}

const LEGAL_CONTENT = {
  privacy: {
    kicker: "Privacy",
    title: "PRIVACY,<br /><span>IN PLAIN WORDS.</span>",
    intro: "This summary covers information handled when someone visits the site or prepares an inquiry brief.",
    sections: [
      ["Who is responsible", "The data controller is [legal business name], of [registered business address]. For privacy questions, contact [privacy contact email]. These business details must be supplied before this policy is relied on."],
      ["Information on this website", "The inquiry form currently runs only in your browser. Preparing a brief does not transmit it to Avenox Studio or save it on this website. Copying or downloading a brief happens only when you choose those browser actions. Do not enter sensitive personal information."],
      ["Hosting and server logs", "The hosting provider may process technical request data, such as an IP address, browser details and requested page, in server logs. The provider, retention period, legal basis and applicable safeguards must be confirmed by the site operator: [add hosting and retention details]."],
      ["Cookies and analytics", "This version of the website does not add analytics, advertising pixels or non-essential cookies. See the Cookie Policy for current details. Update this section if analytics or other services are added."],
      ["Your choices and rights", "Depending on where you live, you may have rights to access, correct, delete or restrict the use of personal information. Add the applicable process, legal bases, retention details and supervisory authority here after jurisdiction-specific review: [complete before launch]."],
      ["Changes to this policy", "If the website's data practices change, this policy should be updated before the new practice is introduced. Last reviewed: [date to be added]."],
    ],
  },
  cookies: {
    kicker: "Cookies",
    title: "A SMALL NOTE<br /><span>ON COOKIES.</span>",
    intro: "A snapshot of the current site setup. Confirm it against the live hosting, analytics and consent configuration.",
    sections: [
      ["What this site uses", "The current Avenox Studio website does not set first-party cookies and does not load advertising or analytics scripts. The contact form operates in the browser and does not use cookies or local storage."],
      ["Hosting and external services", "The hosting provider or any services added later may use strictly necessary technologies or process connection data. Confirm those providers and their practices here: [add provider and cookie details if applicable]."],
      ["Your controls", "You can manage or block cookies in your browser settings. If optional cookies or analytics are introduced, explain their purpose and provide any consent controls required in the places where this site is offered."],
      ["Updates", "This policy must be reviewed whenever the site's technology or hosting changes. Last reviewed: [date to be added]. For questions, contact [privacy contact email]."],
    ],
  },
  terms: {
    kicker: "Terms",
    title: "THE TERMS<br /><span>OF THIS SITE.</span>",
    intro: "These draft terms cover use of the Avenox Studio website only; they do not set terms for client projects.",
    sections: [
      ["About Avenox Studio", "This website is operated by [legal business name], of [registered business address]. Replace these placeholders with the correct legal details."],
      ["Using this website", "You may browse this website for lawful purposes. Do not misuse the site, attempt to disrupt it, or use its content in a way that infringes another person's rights."],
      ["Website content", "Copyright, licensing and use permissions for the website's text, design and imagery must be confirmed by the business before publication. Project screenshots are captured from the named projects' own source code and may show demo or prototype data; a project without a screenshot is marked as pending. Project names and visuals are shown as portfolio work and do not represent endorsements or performance claims. Confirm ownership and permissions for all final materials before launch."],
      ["No professional or project advice", "Website content is general information, not legal, financial or technical advice for a particular situation. A project relationship, scope, fees and responsibilities exist only when agreed separately in writing."],
      ["Availability and liability", "The site is provided as available. Any limitations of liability, warranties or consumer rights must be written to comply with the law that applies to the business and visitor. Obtain local legal review before using this draft: [jurisdiction and legal wording to be supplied]."],
      ["Governing law and contact", "Governing law, venue and dispute process: [insert applicable jurisdiction after legal review]. Questions about these terms: [business contact email]. Last reviewed: [date to be added]."],
    ],
  },
};

function legalPage(kind) {
  const content = LEGAL_CONTENT[kind];
  return `
    <main id="main" class="page-inner legal-page" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">${content.kicker}</p>
        <h1 id="page-heading">${content.title}</h1>
        <div class="page-hero-lower"><p>${content.intro}</p></div>
      </section>
      <section class="legal-body shell">
        <p class="legal-review-note"><strong>Before publication:</strong> Replace every bracketed placeholder with verified business information and have this draft reviewed for the relevant jurisdiction.</p>
        ${content.sections.map(([heading, text], index) => `
          <article class="legal-section">
            <span class="legal-number">${String(index + 1).padStart(2, "0")}</span>
            <div><h2>${heading}</h2><p>${text}</p></div>
          </article>`).join("")}
      </section>
    </main>`;
}

function notFoundPage() {
  return `
    <main id="main" class="not-found shell" tabindex="-1">
      <p class="eyebrow">404</p>
      <h1 id="page-heading">THIS PAGE<br /><span>DOESN'T EXIST.</span></h1>
      <a class="button button--dark" href="/" data-link>RETURN HOME <span aria-hidden="true">→</span></a>
    </main>`;
}

function updateMetadata(path) {
  const known = ROUTES.find((route) => route.path === path);
  const route = known || ROUTES.find((item) => item.path === "/404");
  const canonicalPath = route.path === "/" ? "/" : `${route.path}/`;
  document.title = route.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", route.description);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", route.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", route.description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", route.title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", route.description);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = `${window.location.origin}${canonicalPath}`;
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.append(robots);
  }
  robots.content = route.noindex || !known ? "noindex,follow" : "index,follow";
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    document.head.append(ogUrl);
  }
  ogUrl.content = `${window.location.origin}${canonicalPath}`;
  const absoluteImageUrl = `${window.location.origin}/images/avenox-social.png`;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.content = absoluteImageUrl;
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) twitterImage.content = absoluteImageUrl;
}

function observeReveals() {
  const elements = document.querySelectorAll(".reveal:not(.is-visible)");
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" });
  elements.forEach((element) => observer.observe(element));
}

function render(pathname, { focus = false } = {}) {
  const path = normalizePath(pathname);
  const known = ROUTES.some((route) => route.path === path && path !== "/404");
  const pagePath = known ? path : "/404";
  let content;
  switch (pagePath) {
    case "/": content = homePage(); break;
    case "/work": content = workPage(); break;
    case "/services": content = servicesPage(); break;
    case "/about": content = aboutPage(); break;
    case "/contact": content = contactPage(); break;
    case "/privacy": content = legalPage("privacy"); break;
    case "/cookies": content = legalPage("cookies"); break;
    case "/terms": content = legalPage("terms"); break;
    default: content = notFoundPage();
  }
  updateMetadata(known ? pagePath : "/404");
  app.innerHTML = `${header(known ? pagePath : "")}${content}${footer()}`;
  observeReveals();
  if (focus) {
    const main = document.querySelector("#main");
    main?.focus({ preventScroll: true });
  }
}

function closeMobileNav() {
  const toggle = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#primary-nav");
  if (!toggle || !nav) return;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

function navigate(url, { focus = true } = {}) {
  const target = new URL(url, window.location.href);
  if (target.origin !== window.location.origin) return;
  const currentPath = normalizePath(window.location.pathname);
  const targetPath = normalizePath(target.pathname);
  const samePage = currentPath === targetPath && window.location.search === target.search;
  history.pushState({}, "", `${target.pathname}${target.search}${target.hash}`);
  closeMobileNav();

  if (samePage) {
    if (target.hash) {
      requestAnimationFrame(() => {
        const anchor = document.getElementById(decodeURIComponent(target.hash.slice(1)));
        anchor?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      });
    }
    return;
  }

  render(target.pathname, { focus });
  if (target.hash) {
    requestAnimationFrame(() => {
      const anchor = document.getElementById(decodeURIComponent(target.hash.slice(1)));
      anchor?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    });
  } else {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }
}

function submitInquiry(form) {
  const name = form.elements.namedItem("name");
  const trimmedName = name.value.trim();
  name.setCustomValidity(trimmedName ? "" : "Please enter your name.");
  if (!form.reportValidity()) {
    const invalid = form.querySelector(":invalid");
    invalid?.setAttribute("aria-invalid", "true");
    invalid?.focus();
    return;
  }

  // FORM DELIVERY INTEGRATION POINT: replace this local brief-preparation flow
  // with a verified server-side endpoint only after a provider is explicitly configured.
  // Future delivery recipient: studioavenox@gmail.com. Keep credentials server-side;
  // until then, the contact form intentionally stays on this device.
  const formData = new FormData(form);
  const labels = [
    ["Name", formData.get("name")],
    ["Email", formData.get("email")],
    ["Business / Project", formData.get("business") || "Not provided"],
    ["Service", SERVICES.find((service) => service.slug === formData.get("service"))?.name || "Not provided"],
    ["Budget", formData.get("budget") || "Not provided"],
  ];
  const brief = [
    "AVENOX — PROJECT INQUIRY",
    "",
    ...labels.map(([label, value]) => `${label}: ${String(value).trim()}`),
    "",
    "Message:",
    String(formData.get("message")).trim(),
  ].join("\n");
  form.dataset.brief = brief;
  const result = form.querySelector("#form-result");
  result.hidden = false;
  result.innerHTML = `
    <h3 class="form-result-title">Brief prepared</h3>
    <p>Your project brief is ready on this device. It has <strong>not</strong> been sent or stored.</p>
    <div class="form-result-actions">
      <button class="button button--dark" type="button" data-form-action="copy">COPY BRIEF</button>
      <button class="button button--light" type="button" data-form-action="download">DOWNLOAD BRIEF</button>
      <button class="form-edit" type="button" data-form-action="edit">EDIT DETAILS</button>
    </div>
    <span class="form-feedback" id="form-feedback" aria-live="polite"></span>`;
  result.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "nearest" });
}

// All internal navigation remains real href-based navigation, with history and
// focus handling enhanced for the static multi-page experience.
document.addEventListener("click", (event) => {
  const toggle = event.target.closest("#menu-toggle");
  if (toggle) {
    const nav = document.querySelector("#primary-nav");
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
    nav?.classList.toggle("is-open", !expanded);
    document.body.classList.toggle("menu-open", !expanded);
    return;
  }

  const action = event.target.closest("[data-form-action]");
  if (action) {
    const form = action.closest("form");
    const feedback = form?.querySelector("#form-feedback");
    if (!form) return;
    if (action.dataset.formAction === "edit") {
      form.querySelector("#form-result").hidden = true;
      form.elements.namedItem("name")?.focus();
    } else if (action.dataset.formAction === "download") {
      const blob = new Blob([form.dataset.brief || ""], { type: "text/plain;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = "avenox-project-brief.txt";
      download.hidden = true;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      if (feedback) feedback.textContent = "Your brief was downloaded to this device.";
    } else if (action.dataset.formAction === "copy") {
      const brief = form.dataset.brief || "";
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(brief)
          .then(() => { if (feedback) feedback.textContent = "Your brief was copied to the clipboard."; })
          .catch(() => { if (feedback) feedback.textContent = "Clipboard access was blocked. Use Download brief instead."; });
      } else if (feedback) {
        feedback.textContent = "Clipboard access is unavailable. Use Download brief instead.";
      }
    }
    return;
  }

  const link = event.target.closest("a[data-link], a[data-scroll]");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;
  const target = new URL(link.href, window.location.href);
  if (target.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(target.href);
});

document.addEventListener("submit", (event) => {
  if (event.target.matches("#inquiry-form")) {
    event.preventDefault();
    submitInquiry(event.target);
  }
});

document.addEventListener("invalid", (event) => {
  if (event.target.form?.id === "inquiry-form") event.target.setAttribute("aria-invalid", "true");
}, true);

document.addEventListener("input", (event) => {
  if (event.target.form?.id === "inquiry-form") {
    event.target.removeAttribute("aria-invalid");
    if (event.target.name === "name" && event.target.value.trim()) event.target.setCustomValidity("");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector("#menu-toggle[aria-expanded='true']")) {
    closeMobileNav();
    document.querySelector("#menu-toggle")?.focus();
  }
});

window.addEventListener("popstate", () => {
  render(window.location.pathname, { focus: true });
  if (window.location.hash) {
    requestAnimationFrame(() => document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView());
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
});

history.scrollRestoration = "manual";
render(window.location.pathname);
