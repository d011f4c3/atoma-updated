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
    caption: "The shape of the fields",
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
    caption: "The shape of the fields",
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
    caption: "Gathered from the field",
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
    caption: "People & tools / At work",
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
    caption: "A different viewpoint",
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
    caption: "A different viewpoint / Composite image",
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
    caption: "A viewpoint from the field",
    width: 2000,
    height: 1333,
  },
} as const satisfies Record<string, StoryPhotograph>;

const photographs = aboutFarmPhotographs;

// Observations supported by the photographs. These are not interview quotes,
// an invented visit timeline, or claims about how the equipment performs.
export const aboutFieldNotes = {
  place: {
    category: "01 / The hillside",
    text: "From a distance, the tea fields read as continuous lines. Closer in, those lines become rows, paths and the spaces where people work.",
  },
  harvest: {
    category: "02 / The harvest",
    title: "The work, shared.",
    text: "At either end of the harvester, a person guides its movement along the row. The collection bag follows behind. Filled bags rest on the tea plants, ready to be carried away.",
    record: "Harvest photo record",
  },
  technology: {
    category: "People & tools / At work",
    title: "Closer to the task.",
    text: "The view tightens: gloved hands on the handles, a powersuit around the waist and legs. The tools make more sense beside the person using them. At the edge of the field, an FPV pilot looks through a headset.",
    record: "People & tools photo record",
  },
} as const;

export const aboutPhotoStories = [
  {
    id: "harvest",
    slug: "wazuka-harvest",
    category: "01 / The harvest",
    title: "Harvest in Wazuka, Uji tea region, Kyoto.",
    introduction:
      "In Wazuka, within the Uji tea-growing region of Kyoto Prefecture, we follow the harvest and the people doing the work.",
    paragraphs: [
      "Wazuka is the first chapter in our field record. A closer look at the landscape, the harvest and the work between the rows.",
      "This is a record of our time in the community. The origin of each matcha is recorded separately with the product.",
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
    title: "New tools. Experienced hands.",
    introduction:
      "The harvester, the powersuit and the people using them in Wazuka, part of Kyoto Prefecture’s Uji tea-growing region.",
    paragraphs: [
      "A closer view of the harvest: hands on the machine, a powersuit worn between the rows, and an FPV pilot beside the field. The people and the task remain at the centre of the photographs.",
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
