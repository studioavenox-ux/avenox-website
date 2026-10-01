export const ROUTES = [
  {
    path: "/",
    title: "AVENOX — Web, AI & Digital Systems",
    description: "AVENOX is an independent digital studio building thoughtful websites, AI experiences, automation and software.",
  },
  {
    path: "/work",
    title: "Selected work — AVENOX",
    description: "Selected digital product and interface explorations from AVENOX, a studio working across web, AI and digital systems.",
  },
  {
    path: "/services",
    title: "Services — AVENOX",
    description: "Web design and development, AI products, workflow automation and custom software from AVENOX.",
  },
  {
    path: "/about",
    title: "About the studio — AVENOX",
    description: "Meet AVENOX: an independent digital studio bringing design, engineering, AI and automation together.",
  },
  {
    path: "/contact",
    title: "Start a project — AVENOX",
    description: "Tell AVENOX about a website, AI product, automation or software project you are considering.",
  },
  {
    path: "/privacy",
    title: "Privacy policy — AVENOX",
    description: "Read the AVENOX privacy policy and learn how this website handles information.",
  },
  {
    path: "/cookies",
    title: "Cookie policy — AVENOX",
    description: "Read the AVENOX cookie policy and information about cookies used by this website.",
  },
  {
    path: "/terms",
    title: "Terms of use — AVENOX",
    description: "Read the terms that apply to use of the AVENOX website.",
  },
  {
    path: "/404",
    title: "Page not found — AVENOX",
    description: "The page you are looking for could not be found.",
    noindex: true,
  },
];

export const SERVICES = [
  {
    number: "01",
    slug: "web",
    name: "WEB",
    headline: "Digital experiences with clarity.",
    summary: "Considered websites and digital experiences, shaped from the first content decision to the final interaction.",
    detail: "We bring structure, visual direction and front-end craft together. The result is a responsive, accessible website with a clear purpose and an identity of its own.",
    list: ["Digital strategy & structure", "Art direction & web design", "Responsive development", "Accessibility & launch support"],
  },
  {
    number: "02",
    slug: "ai",
    name: "AI",
    headline: "Useful intelligence, thoughtfully made.",
    summary: "AI-powered products and interfaces designed around people, real tasks and responsible product behavior.",
    detail: "From an early product concept to a working interface, we help make AI understandable and useful. Human judgment stays central; the technology should earn its place.",
    list: ["AI product concepts", "Conversational & generative interfaces", "Product prototyping", "Human-centered AI workflows"],
  },
  {
    number: "03",
    slug: "automation",
    name: "AUTOMATION",
    headline: "Better connections between the work.",
    summary: "Connected workflows that make repeatable work easier to follow, maintain and improve.",
    detail: "We look at how work moves between people and tools, then shape pragmatic automations that reduce unnecessary hand-offs without obscuring what happens next.",
    list: ["Workflow mapping", "Tool & system integrations", "Process automation", "Documentation & handover"],
  },
  {
    number: "04",
    slug: "software",
    name: "SOFTWARE",
    headline: "Purpose-built tools for specific needs.",
    summary: "Custom digital tools and products for work that does not fit neatly inside an off-the-shelf solution.",
    detail: "We pair clear product thinking with careful engineering to make software that is focused, understandable and ready to grow at a considered pace.",
    list: ["Product definition", "Interface & application design", "Web application development", "Ongoing product refinement"],
  },
];

export const PROJECTS = [
  {
    number: "01",
    name: "NEO",
    kind: "PRODUCT / AI INTERFACE",
    description: "A quieter interface study for thinking alongside AI — shaped around focus, useful context and human direction.",
    image: "/images/neo-interface.svg",
    alt: "Illustrative NEO interface study: an uncluttered workspace with a prompt, saved notes and an AI response.",
    visualLabel: "Interface study",
    className: "project--neo",
    query: "project=NEO&service=ai",
  },
  {
    number: "02",
    name: "THE SILENT ATLAS",
    kind: "DIGITAL EXPERIENCE / EXPLORATION",
    description: "An editorial exploration of place, maps and the quieter pleasure of finding your way through information.",
    image: "/images/studio-desk.webp",
    alt: "Illustrative studio scene: a laptop displaying a subtle topographic map on a light wood desk.",
    visualLabel: "Illustrative studio imagery",
    className: "project--atlas",
    query: "project=The%20Silent%20Atlas&service=web",
  },
  {
    number: "03",
    name: "ATLAS RESEARCH",
    kind: "RESEARCH / INFORMATION DESIGN",
    description: "An interface study giving layered, location-led information a calm and legible place to unfold.",
    image: "/images/atlas-research.svg",
    alt: "Illustrative Atlas Research interface study with a restrained map, compact data labels and a side panel.",
    visualLabel: "Interface study",
    className: "project--research",
    query: "project=Atlas%20Research&service=software",
  },
];

export const PROCESS = [
  {
    number: "01",
    name: "DISCOVER",
    text: "Get close to the opportunity, the people involved and the problem worth solving.",
  },
  {
    number: "02",
    name: "DESIGN",
    text: "Find a clear direction, then make the structure and experience tangible.",
  },
  {
    number: "03",
    name: "BUILD",
    text: "Develop the chosen idea with care, testing the details as the product takes shape.",
  },
  {
    number: "04",
    name: "LAUNCH",
    text: "Prepare the work for the real world and leave a clear path for what comes next.",
  },
];
