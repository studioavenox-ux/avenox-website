export const ROUTES = [
  {
    path: "/",
    title: "Avenox Studio — Web • AI • Digital Systems",
    description: "Avenox Studio designs and builds thoughtful websites, AI products, automation and software.",
  },
  {
    path: "/work",
    title: "Work — Avenox Studio",
    description: "Personal AI, editorial web and map-led information design studies from Avenox Studio.",
  },
  {
    path: "/services",
    title: "Services — Avenox Studio",
    description: "Web design and development, AI product concepts, workflow automation and custom software.",
  },
  {
    path: "/about",
    title: "About — Avenox Studio",
    description: "Avenox Studio is an independent digital studio working across design, engineering, AI and automation.",
  },
  {
    path: "/contact",
    title: "Contact — Avenox Studio",
    description: "Contact Avenox Studio about a website, AI product concept, workflow or software project.",
  },
  {
    path: "/privacy",
    title: "Privacy — Avenox Studio",
    description: "How the Avenox Studio website handles inquiry briefs and technical information.",
  },
  {
    path: "/cookies",
    title: "Cookies — Avenox Studio",
    description: "Current cookie and analytics information for the Avenox Studio website.",
  },
  {
    path: "/terms",
    title: "Terms — Avenox Studio",
    description: "Terms for using the Avenox Studio website. These do not set terms for client projects.",
  },
  {
    path: "/404",
    title: "404 — Avenox Studio",
    description: "This page does not exist. Return to the Avenox Studio home page.",
    noindex: true,
  },
];

export const SERVICES = [
  {
    number: "01",
    slug: "web",
    name: "WEB",
    headline: "Brand-led websites",
    summary: "Clear structure, considered design and careful development.",
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
    kind: "Personal AI system / product",
    description: "A concept for a personal AI system that supports focused, human-led work.",
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
    kind: "Editorial website concept",
    description: "A map-led exploration of place and slow discovery.",
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
    kind: "Information design study",
    description: "A study in making location-led research easier to explore.",
    image: "/images/atlas-research.svg",
    alt: "A quiet, illustrative contour-map composition created for the Atlas Research study.",
    visualLabel: "Illustrative map study",
    className: "project--research",
    ctaLabel: "Discuss map-led work",
    query: "project=Atlas%20Research",
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
