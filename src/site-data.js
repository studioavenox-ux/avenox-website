export const ROUTES = [
  {
    path: "/",
    title: "AVENOX — Web, AI & Digital Systems",
    description: "AVENOX is an independent digital studio building thoughtful websites, AI products, automation and software.",
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
    headline: "Digital flagships",
    summary: "Brand-led websites, shaped from clear structure through to careful development.",
    detail: "A site should read clearly, express the brand without noise and hold together on the smallest screen.",
    list: ["Digital strategy & structure", "Art direction & web design", "Responsive development", "Accessibility & launch support"],
  },
  {
    number: "02",
    slug: "ai",
    name: "AI",
    headline: "Thoughtful AI products",
    summary: "Interfaces that make useful AI understandable and keep human judgment in the loop.",
    detail: "Start with a task worth improving; use AI only where it adds genuine clarity or capacity.",
    list: ["AI product concepts", "Conversational & generative interfaces", "Product prototyping", "Human-centered AI workflows"],
  },
  {
    number: "03",
    slug: "automation",
    name: "AUTOMATION",
    headline: "Connected workflows",
    summary: "A clearer route through repeatable work and the tools that support it.",
    detail: "Make hand-offs visible before automating them, so a faster workflow is still understandable.",
    list: ["Workflow mapping", "Tool & system integrations", "Process automation", "Documentation & handover"],
  },
  {
    number: "04",
    slug: "software",
    name: "SOFTWARE",
    headline: "Purpose-built software",
    summary: "Custom tools for work that does not fit an off-the-shelf product.",
    detail: "Build the smallest useful tool around the constraints that make an off-the-shelf product the wrong fit.",
    list: ["Product definition", "Interface & application design", "Web application development", "Ongoing product refinement"],
  },
];

export const PROJECTS = [
  {
    number: "01",
    layout: "standard",
    name: "NEO",
    kind: "Product exploration",
    description: "A product study exploring how AI might support focused, human-led work.",
    image: "/images/neo-interface.svg",
    alt: "Illustrative NEO interface concept—not a product screenshot—with a quiet workspace, prompt area and saved thoughts.",
    visualLabel: "Illustrative interface study",
    className: "project--neo",
    ctaLabel: "Discuss NEO",
    query: "project=NEO&service=ai",
  },
  {
    number: "02",
    layout: "reverse",
    name: "THE SILENT ATLAS",
    kind: "Digital experience",
    description: "An editorial exploration of maps, place and slow discovery.",
    image: "/images/studio-desk.webp",
    alt: "Illustrative studio photograph of a laptop showing a contour map on a light oak desk.",
    visualLabel: "Illustrative studio image",
    className: "project--atlas",
    ctaLabel: "Discuss Silent Atlas",
    query: "project=The%20Silent%20Atlas&service=web",
  },
  {
    number: "03",
    layout: "asymmetric",
    name: "ATLAS RESEARCH",
    kind: "Research / map study",
    description: "A study in making layered, location-led information easier to explore.",
    image: "/images/atlas-research.svg",
    alt: "A quiet, illustrative contour-map composition created for the Atlas Research study.",
    visualLabel: "Illustrative map study",
    className: "project--research",
    ctaLabel: "Discuss map-led work",
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
