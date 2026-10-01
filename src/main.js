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
          <span class="brand-tagline">WEB <i aria-hidden="true">•</i> AI <i aria-hidden="true">•</i> DIGITAL SYSTEMS</span>
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
            <span class="brand-tagline">WEB <i aria-hidden="true">•</i> AI <i aria-hidden="true">•</i> DIGITAL SYSTEMS</span>
          </a>
          <p>Thoughtful digital work,<br />made with intent.</p>
        </div>
        <div class="footer-column">
          <p class="footer-label">EXPLORE</p>
          <a href="/work" data-link>Selected work</a>
          <a href="/services" data-link>Services</a>
          <a href="/about" data-link>The studio</a>
        </div>
        <div class="footer-column">
          <p class="footer-label">SAY HELLO</p>
          <a href="/contact" data-link>Start a conversation <span aria-hidden="true">↗</span></a>
        </div>
        <a class="back-top" href="#top" data-scroll>BACK TO TOP <span aria-hidden="true">↑</span></a>
      </div>
      <div class="shell footer-bottom">
        <span>© <span id="year">${new Date().getFullYear()}</span> AVENOX</span>
        <span>WEB <i aria-hidden="true">•</i> AI <i aria-hidden="true">•</i> DIGITAL SYSTEMS</span>
        <nav aria-label="Legal links">
          <a href="/privacy" data-link>Privacy</a>
          <a href="/cookies" data-link>Cookies</a>
          <a href="/terms" data-link>Terms</a>
        </nav>
      </div>
    </footer>`;
}

function arrowLink(href, label, extraClass = "") {
  return `<a class="text-link ${extraClass}" href="${escapeHtml(href)}" data-link>${label}<span aria-hidden="true">↗</span></a>`;
}

function buildList() {
  return `
    <section class="build-section shell section-pad" aria-labelledby="build-title">
      <div class="section-heading section-heading--split reveal">
        <div>
          <p class="eyebrow">A PRACTICE BUILT AROUND THE WORK</p>
          <h2 class="section-title" id="build-title">WHAT WE BUILD</h2>
        </div>
        <p class="section-intro">Four connected disciplines. One considered approach to making digital things useful, clear and lasting.</p>
      </div>
      <div class="build-list">
        ${SERVICES.map((service) => `
          <a class="build-item reveal" href="/services#${service.slug}" data-link>
            <span class="build-number">${service.number}</span>
            <h3>${service.name}</h3>
            <p>${service.summary}</p>
            <span class="build-arrow" aria-hidden="true">↗</span>
          </a>`).join("")}
      </div>
    </section>`;
}

function projectRow(project, index) {
  const visualFirst = index % 2 === 1;
  const figure = `
    <figure class="project-visual ${project.className} reveal">
      <img src="${project.image}" alt="${escapeHtml(project.alt)}" width="1600" height="1000" loading="lazy" decoding="async" />
      <figcaption><span>${project.number} / ${project.visualLabel}</span><span aria-hidden="true">AVENOX</span></figcaption>
    </figure>`;
  const copy = `
    <div class="project-copy reveal">
      <div class="project-meta"><span>${project.number.padStart(2, "0")}</span><span>${project.kind}</span></div>
      <h3>${project.name}</h3>
      <p>${project.description}</p>
      ${arrowLink(`/contact?${project.query}`, "DISCUSS A PROJECT LIKE THIS", "project-cta")}
    </div>`;
  return `<article class="project-row${visualFirst ? " project-row--visual-first" : ""}" aria-label="${project.name}">${copy}${figure}</article>`;
}

function selectedWork({ compact = false } = {}) {
  const projects = compact ? PROJECTS.slice(0, 3) : PROJECTS;
  return `
    <section class="work-section shell section-pad" id="work" aria-labelledby="work-title">
      <div class="section-heading section-heading--split reveal">
        <div>
          <p class="eyebrow">A SELECTION OF PRODUCT THINKING & DIGITAL CRAFT</p>
          <h2 class="section-title" id="work-title">SELECTED WORK</h2>
        </div>
        <p class="section-intro">A few ideas taking shape across interfaces, digital experiences and the systems behind them.</p>
      </div>
      <div class="project-list">${projects.map(projectRow).join("")}</div>
      ${compact ? `<div class="work-more">${arrowLink("/work", "VIEW ALL SELECTED WORK")}</div>` : ""}
      <p class="work-disclaimer">Selected explorations. Interface and studio visuals are illustrative where noted; no client or outcome claims are implied.</p>
    </section>`;
}

function serviceList({ expandable = false, editorial = false } = {}) {
  const homeLabels = [
    ["DIGITAL FLAGSHIPS", "Clear structure, considered content and purposeful front-end craft for the web."],
    ["AMBIENT INTELLIGENCE", "AI experiences that support a person’s judgment instead of competing with it."],
    ["WORKFLOW ARCHITECTURE", "A more legible connection between the people, tools and steps behind everyday work."],
    ["BESPOKE TOOLS & SYSTEMS", "Purpose-built software and interfaces for work that does not fit a standard template."],
  ];
  if (expandable) {
    return `<div class="service-list service-list--expanded">${SERVICES.map((service, index) => `
      <details class="service-row reveal" id="${service.slug}">
        <summary>
          <span class="service-number">${service.number} <i aria-hidden="true">/</i> ${service.name}</span>
          <span class="service-summary">
            <span class="service-headline">${editorial ? homeLabels[index][0] : service.headline}</span>
            <span class="service-teaser">${editorial ? homeLabels[index][1] : service.summary}</span>
          </span>
          <span class="service-toggle" aria-hidden="true"></span>
        </summary>
        <div class="service-detail">
          <p>${service.detail}</p>
          <ul>${service.list.map((item) => `<li>${item}</li>`).join("")}</ul>
          ${arrowLink(`/contact?service=${service.slug}`, `TALK ABOUT ${service.name}`)}
        </div>
      </details>`).join("")}</div>`;
  }
  return `<section class="services-section shell section-pad" aria-labelledby="services-title">
    <div class="section-heading section-heading--split reveal">
      <div>
        <p class="eyebrow">STRATEGY, DESIGN & ENGINEERING</p>
        <h2 class="section-title" id="services-title">SERVICES</h2>
      </div>
      <p class="section-intro">We bring the right mix of thinking and making to each brief. No borrowed playbook, no unnecessary complexity.</p>
    </div>
    ${serviceList({ expandable: true })}
  </section>`;
}

function processSection({ full = false } = {}) {
  return `
    <section class="process-section shell section-pad" aria-labelledby="process-title">
      <div class="section-heading section-heading--split reveal">
        <div>
          <p class="eyebrow">GOOD WORK IS A SHARED PROCESS</p>
          <h2 class="section-title" id="process-title">HOW WE WORK</h2>
        </div>
        <p class="section-intro">An open, considered path from the first useful question to a thoughtful launch.</p>
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
        <p class="eyebrow">GOOD THINGS START WITH A CONVERSATION</p>
        <h2 id="closing-title">HAVE SOMETHING<br />WORTH BUILDING?</h2>
        <p>Have a thoughtful idea, a knotty workflow, or a product taking shape? We would love to hear what you are working on.</p>
        <a class="button button--dark" href="/contact" data-link>START A PROJECT <span aria-hidden="true">↗</span></a>
        <span class="closing-footnote">A clear first conversation. No obligation.</span>
      </div>
    </section>`;
}

function homePage() {
  return `
    <main id="main" class="page-home" tabindex="-1">
      <section class="hero shell" aria-labelledby="page-heading">
        <div class="hero-overline">
          <p class="eyebrow">INDEPENDENT DIGITAL STUDIO <span aria-hidden="true">/</span> DESIGN × TECHNOLOGY</p>
          <span class="hero-edition">A THOUGHTFUL APPROACH TO DIGITAL</span>
        </div>
        <h1 id="page-heading" class="hero-title">WE BUILD<br />DIGITAL<br />PRODUCTS<br /><span>WITH INTENT.</span></h1>
        <div class="hero-lower">
          <div class="hero-copy">
            <p>AVENOX is a small digital studio shaping thoughtful websites, AI experiences and connected systems.</p>
            <p>We bring design and engineering together to make digital work with clarity, character and purpose.</p>
            <div class="hero-actions">
              <a class="button button--dark" href="/contact" data-link>START A PROJECT <span aria-hidden="true">↗</span></a>
              <a class="button button--light" href="#work" data-link>VIEW OUR WORK <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <aside class="hero-note" aria-label="Studio approach">
            <span class="hero-note-mark" aria-hidden="true">✳</span>
            <p>From an early thought to a considered digital product.</p>
            <span class="hero-note-foot">WEB · AI · DIGITAL SYSTEMS</span>
          </aside>
        </div>
        <figure class="hero-visual">
          <img src="/images/studio-desk.webp" alt="A laptop with a subtle topographic map on a light wood studio desk, surrounded by books and architectural models." width="1376" height="768" fetchpriority="high" decoding="async" />
          <figcaption><span>A SPACE TO MAKE THINGS CLEAR</span><span>STUDIO SCENE / ILLUSTRATIVE</span></figcaption>
        </figure>
      </section>
      ${buildList()}
      ${selectedWork({ compact: true })}
      ${serviceList({ expandable: true, editorial: true })}
      <section class="neo-feature" aria-labelledby="neo-feature-title">
        <div class="shell neo-inner">
          <div class="neo-copy reveal">
            <p class="eyebrow">A PRODUCT EXPLORATION BY AVENOX</p>
            <h2 id="neo-feature-title">MEET NEO.</h2>
            <p class="neo-lead">A quieter space for ideas to take shape.</p>
            <p>NEO is an interface study exploring how AI can feel more useful, more human, and less like another thing competing for your attention.</p>
            <div class="neo-notes">
              <div><span>01 / FOCUS</span><p>Make room for the thought, not the noise around it.</p></div>
              <div><span>02 / CONTEXT</span><p>Keep the useful threads close as ideas develop.</p></div>
            </div>
            ${arrowLink("/contact?project=NEO&service=ai", "TALK TO US ABOUT NEO")}
          </div>
          <figure class="neo-visual reveal">
            <img src="/images/neo-interface.svg" alt="Illustrative NEO product interface study, with a calm workspace for questions and saved thoughts." width="1600" height="1000" loading="lazy" decoding="async" />
            <figcaption>NEO / ILLUSTRATIVE INTERFACE STUDY</figcaption>
          </figure>
        </div>
      </section>
      <section class="studio-section shell section-pad" aria-labelledby="studio-title">
        <div class="studio-intro reveal">
          <p class="eyebrow">DESIGN-LED. ENGINEERED WITH CARE.</p>
          <h2 class="section-title" id="studio-title">SMALL STUDIO.<br />BIG IDEAS.</h2>
        </div>
        <div class="studio-copy reveal">
          <p class="studio-lead">A considered digital studio for ideas that deserve more than a template.</p>
          <p>AVENOX brings design, engineering and emerging technology into one thoughtful practice. We stay close to the problem, make decisions in the open and care about how the finished work feels to use.</p>
          <div class="studio-pillars">
            <div><span>01 / PRODUCT THINKING</span><p>Start with what matters, then make the experience make sense.</p></div>
            <div><span>02 / DIGITAL CRAFT</span><p>Attention to the small details that make the whole feel considered.</p></div>
            <div><span>03 / PRACTICAL AI</span><p>Technology in service of a useful, human experience.</p></div>
            <div><span>04 / CONNECTED SYSTEMS</span><p>Clearer workflows, made to be understood and maintained.</p></div>
          </div>
          ${arrowLink("/about", "MORE ABOUT THE STUDIO")}
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
        <p class="eyebrow">SELECTED WORK / PRODUCT THINKING & DIGITAL CRAFT</p>
        <h1 id="page-heading">IDEAS, MADE<br /><span>CONSIDERED.</span></h1>
        <div class="page-hero-lower">
          <p>A small selection of product and interface explorations across web, AI and digital systems.</p>
          <span class="page-index">01 — 03<br />SELECTED EXPLORATIONS</span>
        </div>
      </section>
      ${selectedWork()}
      <div class="shell work-note-block"><p>These concise explorations show a way of thinking, not a set of performance claims. Where a visual is illustrative, it is labelled as such.</p></div>
      ${closingCta()}
    </main>`;
}

function servicesPage() {
  return `
    <main id="main" class="page-inner" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">WEB · AI · AUTOMATION · SOFTWARE</p>
        <h1 id="page-heading">DIGITAL WORK,<br /><span>WITH A POINT OF VIEW.</span></h1>
        <div class="page-hero-lower">
          <p>Thoughtful strategy, design and engineering for the parts of your business that happen digitally.</p>
          <span class="page-index">FOUR PRACTICES<br />ONE CONSIDERED APPROACH</span>
        </div>
      </section>
      <section class="shell services-detail-section" aria-label="AVENOX services">
        ${serviceList({ expandable: true })}
      </section>
      <section class="services-note shell section-pad">
        <p class="eyebrow">A GOOD FIT STARTS WITH A GOOD QUESTION</p>
        <p>Not sure which discipline your project needs? That is a useful place to begin. We can shape the brief together.</p>
        ${arrowLink("/contact", "TELL US WHAT YOU ARE THINKING")}
      </section>
      ${processSection({ full: true })}
      ${closingCta()}
    </main>`;
}

function aboutPage() {
  return `
    <main id="main" class="page-inner" tabindex="-1">
      <section class="page-hero shell" aria-labelledby="page-heading">
        <p class="eyebrow">A SMALL, INDEPENDENT DIGITAL STUDIO</p>
        <h1 id="page-heading">THOUGHTFUL<br />BY <span>DESIGN.</span></h1>
        <div class="page-hero-lower">
          <p>AVENOX is a digital product studio working where thoughtful design, careful engineering and emerging technology meet.</p>
          <span class="page-index">DESIGN<br />ENGINEERING<br />DIGITAL PRODUCTS</span>
        </div>
      </section>
      <section class="about-story shell section-pad">
        <div class="about-story-label reveal"><p class="eyebrow">THE STUDIO</p><h2 class="section-title">MADE TO<br />MAKE SENSE.</h2></div>
        <div class="about-story-copy reveal">
          <p class="about-lead">Good digital work begins with attention: to the people using it, the details around it and the reason it needs to exist.</p>
          <p>AVENOX brings design and engineering into the same conversation. We work across websites, AI experiences, automation and custom software, treating each as an opportunity to make something clearer and more useful.</p>
          <p>We keep the process open and the work grounded. That means asking better questions early, making the right things tangible, and taking care with the details that shape the everyday experience.</p>
          <p>The studio stays intentionally focused: ask useful questions, make thoughtful decisions and build digital things with intent.</p>
        </div>
      </section>
      <section class="principles-section">
        <div class="shell principles-inner">
          <div class="principles-heading reveal">
            <p class="eyebrow">WHAT GUIDES THE WORK</p>
            <h2 class="section-title">A CLEARER<br />WAY FORWARD.</h2>
          </div>
          <div class="principles-list">
            <article class="principle reveal"><span>01 / START WITH PEOPLE</span><p>Technology only matters when it improves an experience for someone.</p></article>
            <article class="principle reveal"><span>02 / MAKE IT LEGIBLE</span><p>Good structure and clear language are part of good design.</p></article>
            <article class="principle reveal"><span>03 / USE TOOLS WITH INTENT</span><p>AI and automation should solve a real problem, not become the story.</p></article>
            <article class="principle reveal"><span>04 / CARE THROUGH THE DETAILS</span><p>The small interactions are where the quality of the whole becomes tangible.</p></article>
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
        <p class="eyebrow">START WITH A CONVERSATION</p>
        <h1 id="page-heading">LET'S MAKE<br /><span>SOMETHING USEFUL.</span></h1>
        <div class="page-hero-lower">
          <p>Tell us a little about what you have in mind. A rough idea is more than enough to start.</p>
          <span class="page-index">NO PERFECT BRIEF<br />REQUIRED</span>
        </div>
      </section>
      <section class="contact-content shell">
        <div class="contact-aside reveal">
          <p class="eyebrow">A GOOD PLACE TO BEGIN</p>
          <h2>What are you<br />thinking about?</h2>
          <p>Share the shape of the idea, the question behind it, or the workflow you would like to untangle.</p>
          <div class="contact-aside-note">
            <span class="contact-note-mark" aria-hidden="true">✳</span>
            <p>This form is not connected to email yet. You can prepare, copy or download your brief; nothing is sent or stored by this page.</p>
          </div>
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
              <label for="message">A little about the project <span aria-hidden="true">*</span></label>
              <textarea id="message" name="message" rows="6" minlength="12" maxlength="4000" required placeholder="What are you hoping to make, improve or figure out?"></textarea>
            </div>
          </div>
          <div class="form-bottom">
            <p id="form-note">Required fields are marked with <span aria-hidden="true">*</span>. Your message stays in this browser until you choose to copy or download it.</p>
            <button class="button button--dark" type="submit">PREPARE MY BRIEF <span aria-hidden="true">↗</span></button>
          </div>
          <div class="form-result" id="form-result" role="status" aria-live="polite" hidden></div>
        </form>
      </section>
    </main>`;
}

const LEGAL_CONTENT = {
  privacy: {
    kicker: "LEGAL / PRIVACY",
    title: "PRIVACY,<br /><span>IN PLAIN WORDS.</span>",
    intro: "This page is a launch-ready draft, not legal advice. The bracketed business details must be completed and this policy reviewed before publication.",
    sections: [
      ["Who is responsible", "The data controller is [legal business name], of [registered business address]. For privacy questions, contact [privacy contact email]. These business details must be supplied before this policy is relied on."],
      ["Information on this website", "The inquiry form currently runs only in your browser. Preparing a brief does not transmit it to AVENOX or save it on this website. Copying or downloading a brief happens only when you choose those browser actions. Do not enter sensitive personal information."],
      ["Hosting and server logs", "The hosting provider may process technical request data, such as an IP address, browser details and requested page, in server logs. The provider, retention period, legal basis and applicable safeguards must be confirmed by the site operator: [add hosting and retention details]."],
      ["Cookies and analytics", "This version of the website does not add analytics, advertising pixels or non-essential cookies. See the Cookie Policy for current details. Update this section if analytics or other services are added."],
      ["Your choices and rights", "Depending on where you live, you may have rights to access, correct, delete or restrict the use of personal information. Add the applicable process, legal bases, retention details and supervisory authority here after jurisdiction-specific review: [complete before launch]."],
      ["Changes to this policy", "If the website's data practices change, this policy should be updated before the new practice is introduced. Last reviewed: [date to be added]."],
    ],
  },
  cookies: {
    kicker: "LEGAL / COOKIES",
    title: "A SMALL NOTE<br /><span>ON COOKIES.</span>",
    intro: "This page describes the current website implementation. Confirm it against the final hosting and third-party services before launch.",
    sections: [
      ["What this site uses", "The current AVENOX website does not set first-party cookies and does not load advertising or analytics scripts. The contact form operates in the browser and does not use cookies or local storage."],
      ["Hosting and external services", "The hosting provider or any services added later may use strictly necessary technologies or process connection data. Confirm those providers and their practices here: [add provider and cookie details if applicable]."],
      ["Your controls", "You can manage or block cookies in your browser settings. If optional cookies or analytics are introduced, explain their purpose and provide any consent controls required in the places where this site is offered."],
      ["Updates", "This policy must be reviewed whenever the site's technology or hosting changes. Last reviewed: [date to be added]. For questions, contact [privacy contact email]."],
    ],
  },
  terms: {
    kicker: "LEGAL / TERMS",
    title: "THE TERMS<br /><span>OF THIS SITE.</span>",
    intro: "A plain-language draft for the website only. Complete the business and jurisdiction details and obtain appropriate review before publication.",
    sections: [
      ["About AVENOX", "This website is operated by [legal business name], of [registered business address]. Replace these placeholders with the correct legal details."],
      ["Using this website", "You may browse this website for lawful purposes. Do not misuse the site, attempt to disrupt it, or use its content in a way that infringes another person's rights."],
      ["Website content", "Copyright, licensing and use permissions for the website's text, design and imagery must be confirmed by the business before publication. Project names and illustrative interface visuals are shown as editorial explorations; they do not represent endorsements or performance claims. Confirm ownership and permissions for all final materials before launch."],
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
        <div class="page-hero-lower"><p>${content.intro}</p><span class="page-index">AVENOX<br />LEGAL INFORMATION</span></div>
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
      <p class="eyebrow">404 / WRONG TURN</p>
      <h1 id="page-heading">THIS PAGE<br /><span>ISN'T HERE.</span></h1>
      <p>The page may have moved, or the address may be mistyped. Let's get you back to something useful.</p>
      <div class="hero-actions">
        <a class="button button--dark" href="/" data-link>BACK TO HOME <span aria-hidden="true">↗</span></a>
        <a class="button button--light" href="/work" data-link>VIEW OUR WORK <span aria-hidden="true">↗</span></a>
      </div>
    </main>`;
}

function updateMetadata(path) {
  const known = ROUTES.find((route) => route.path === path);
  const route = known || ROUTES.find((item) => item.path === "/404");
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
  canonical.href = `${window.location.origin}${route.noindex ? "/404" : path === "/" ? "/" : `${path}/`}`;
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
  ogUrl.content = `${window.location.origin}${path === "/" ? "/" : `${path}/`}`;
  const absoluteImageUrl = `${window.location.origin}/images/studio-desk.webp`;
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
    <div class="form-result-head"><span>01 / BRIEF READY</span><span aria-hidden="true">✳</span></div>
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
