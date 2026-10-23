import type {
  AboutPhotoStory,
  StoryPhotograph,
} from "../components/about-field-notes";

// Owner-supplied photographs. This is a community field record, not a
// product-origin assertion. Source mappings are documented in Tasks 0154/0183.
export const aboutFarmPhotographs = {
  contours: {
    src: "/images/about/wazuka/field-contours.webp",
    alt: "Rows of tea following the contours of a hillside in Wazuka.",
    caption: "Tea fields in Wazuka",
    width: 2400,
    height: 1600,
  },
  landscape: {
    src: "/images/about/wazuka/harvest-landscape.webp",
    alt: "Two people operating a tea harvester on a hillside in Wazuka, with curved tea rows beyond.",
    caption: "Wazuka, Uji tea region, Kyoto / In the harvest",
    width: 2400,
    height: 1600,
  },
  hillside: {
    src: "/images/about/wazuka/tea-hillside.webp",
    alt: "Rows of tea following the contours of a hillside in Wazuka.",
    caption: "Tea fields in Wazuka",
    width: 1067,
    height: 1600,
  },
  harvest: {
    src: "/images/about/wazuka/harvest-together.webp",
    alt: "Two people guiding a tea harvester and its collection bag along a row in Wazuka.",
    caption: "Working along the rows",
    width: 2000,
    height: 1333,
  },
  bags: {
    src: "/images/about/wazuka/harvest-bags.webp",
    alt: "Filled collection bags resting along the tea rows during the harvest.",
    caption: "Harvest collection bags",
    width: 1600,
    height: 1067,
  },
  rows: {
    src: "/images/about/wazuka/working-the-rows.webp",
    alt: "Two people working between tea rows, with a filled collection bag over one person's shoulder.",
    caption: "Between the rows",
    width: 1067,
    height: 1600,
  },
  path: {
    src: "/images/about/wazuka/field-path.webp",
    alt: "A path beside Wazuka tea fields, framed by the trees at the edge of the farm.",
    caption: "At the edge of the field",
    width: 1600,
    height: 1067,
  },
  tools: {
    src: "/images/about/wazuka/harvesting-tools.webp",
    alt: "A close view of two people handling a tea harvester; one wears a powersuit around the waist and legs.",
    caption: "Tea harvester and powersuit",
    width: 2000,
    height: 1333,
  },
  powersuit: {
    src: "/images/about/wazuka/powersuit-at-work.webp",
    alt: "A person wearing a powersuit holds the tea harvester beside a row of tea.",
    caption: "A powersuit in the field",
    width: 1067,
    height: 1600,
  },
  drone: {
    src: "/images/about/wazuka/drone-above-the-field.webp",
    alt: "A small drone in flight against a clear blue sky above the field.",
    caption: "Drone in flight",
    width: 1600,
    height: 1067,
  },
  team: {
    src: "/images/about/wazuka/harvest-team.webp",
    alt: "People with a tea harvester among the rows in Wazuka.",
    caption: "Together in the field",
    width: 2000,
    height: 1333,
  },
  harvestCover: {
    src: "/images/about/wazuka/harvest-community.webp",
    alt: "Three people working with a tea harvester and collection bag on a hillside of tea rows in Wazuka.",
    caption: "Working together in Wazuka",
    width: 2400,
    height: 1600,
  },
  leaves: {
    src: "/images/about/wazuka/tea-leaf-detail.webp",
    alt: "A close view of tea leaves in the field.",
    caption: "Tea leaves, up close",
    width: 2000,
    height: 1333,
  },
  slope: {
    src: "/images/about/wazuka/harvest-on-the-slope.webp",
    alt: "Two people guiding a tea harvester and collection bag on a slope, with tea fields and wooded hills beyond.",
    caption: "Harvest on the slope",
    width: 1333,
    height: 2000,
  },
  pilot: {
    src: "/images/about/wazuka/fpv-pilot.webp",
    alt: "A person wearing FPV goggles and holding a controller beside the tea fields.",
    caption: "An FPV pilot in the field",
    width: 1333,
    height: 2000,
  },
  powersuitHarvester: {
    src: "/images/about/wazuka/powersuit-harvester.webp",
    alt: "A person wearing a powersuit holds the tea harvester beside a row of tea.",
    caption: "A powersuit in the field",
    width: 1333,
    height: 2000,
  },
  droneRows: {
    src: "/images/about/wazuka/drone-over-tea-rows.webp",
    alt: "A small drone flying above tea rows beside a wooded hillside.",
    caption: "Above the tea rows",
    width: 1333,
    height: 2000,
  },
  droneComposite: {
    src: "/images/about/wazuka/drone-pilot-composite.webp",
    alt: "Composite image of an FPV pilot and a drone above tea fields.",
    caption: "FPV pilot and drone / Composite image",
    width: 1536,
    height: 1024,
  },
  droneCloseUp: {
    src: "/images/about/wazuka/drone-flight-close-up.webp",
    alt: "A drone in flight above wooded hills beneath a blue sky with white clouds.",
    caption: "Above the fields",
    width: 1536,
    height: 1024,
  },
  fpvLandscape: {
    src: "/images/about/wazuka/fpv-in-the-fields.webp",
    alt: "A person wearing FPV goggles beside collection bags, with rows of tea across the hillside.",
    caption: "FPV pilot beside the tea fields",
    width: 2000,
    height: 1333,
  },
} as const satisfies Record<string, StoryPhotograph>;

const photographs = aboutFarmPhotographs;

// Owner-supplied harvest and technology subjects, with general cultivation and
// field-management context sourced in Task 0287. No invented interviews,
// equipment specifications, measured outcomes or product-origin assertions.
export const aboutFieldNotes = {
  place: {
    category: "01 / The hillside",
    title: "Farming the hillside",
    paragraphs: [
      "Tea rows follow the hillsides of Wazuka. For the farmers working them, the slopes set the conditions of the harvest. Equipment has to be carried into position, footing checked and each pass made along the shape of the row.",
      "Two farmers work on opposite sides of a tea row, holding the harvester between them. They move together, keeping the machine level as the cut leaves collect in a bag. There is little room between the rows, and both people have to keep pace.",
    ],
  },
  harvest: {
    category: "02 / The harvest",
    title: "Gathering the leaves",
    paragraphs: [
      "As the bag fills, its weight becomes another part of the work. Full bags are lifted clear and moved out of the way before harvesting continues. The machine cuts the leaves, while the farmers guide it, handle the crop and prepare for the next pass.",
      "For tea destined to become matcha, preparation begins before harvest. The plants are shaded while the new leaves develop. Harvesting gathers those leaves for the next stage, when they are steamed and dried without rolling to make tencha, the tea that is milled into matcha.",
    ],
    record: "Harvest photo record",
  },
  technology: {
    category: "01 / Supporting the body",
    title: "A powersuit at harvest",
    paragraphs: [
      "For an older farmer, years of familiarity with the tea fields do not make the physical work lighter. Holding a harvester, bending and moving between rows place repeated demands on the body. In Wazuka, a grower wears a powersuit around the waist and legs to support that work.",
      "The suit is worn while the grower handles the harvester alongside another farmer. Its purpose is practical: to support an aging body during the harvest. Decisions about where to cut and how to move through the row remain with the people holding the handles.",
    ],
    record: "People & tools photo record",
  },
  drones: {
    category: "02 / Managing the fields",
    title: "Checking the fields from above",
    paragraphs: [
      "Field management brings a different problem: getting a useful view of tea planted across a hillside. From the paths, the view is broken up by the rows and the slope. A drone can bring several rows into view, helping farmers check the condition of the field.",
      "Aerial images can also help farmers follow work in progress and look for damage after bad weather. The next step is a closer inspection on foot, using what they have seen from above to decide where to go.",
    ],
  },
} as const;

export const aboutPhotoStories = [
  {
    id: "harvest",
    slug: "wazuka-harvest",
    category: "01 / The harvest",
    title: "The tea harvest in Wazuka",
    introduction:
      "In Wazuka, in Kyoto Prefecture’s Uji tea-growing region, the tea harvest is shared work: guiding the harvester, gathering the leaves and carrying the crop out of the rows.",
    paragraphs: [
      ...aboutFieldNotes.place.paragraphs,
      ...aboutFieldNotes.harvest.paragraphs,
    ],
    photographs: [
      photographs.harvestCover,
      photographs.hillside,
      photographs.team,
      photographs.slope,
      photographs.leaves,
      photographs.path,
    ],
    previewPhotographs: [photographs.leaves],
  },
  {
    id: "technology",
    slug: "people-and-tools",
    category: "02 / People & technology",
    title: "Powersuits and drones on the farm",
    introduction:
      "On tea farms, powersuits offer physical support for older growers, while drones give farmers another way to inspect and manage their fields.",
    paragraphs: [
      ...aboutFieldNotes.technology.paragraphs,
      ...aboutFieldNotes.drones.paragraphs,
    ],
    photographs: [
      photographs.droneCloseUp,
      photographs.powersuitHarvester,
      photographs.tools,
      photographs.pilot,
      photographs.droneRows,
      photographs.droneComposite,
    ],
    previewPhotographs: [photographs.powersuitHarvester],
  },
] as const satisfies readonly (AboutPhotoStory & { slug: string })[];
