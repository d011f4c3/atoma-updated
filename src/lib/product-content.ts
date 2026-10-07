import { getProductKey, type ProductKey } from "./product-codes.ts";
import { productName } from "./product-name.ts";
import { translate, type Locale } from "./i18n/index.ts";

export type ProductContent = {
  name: string;
  application: string;
  purpose: string;
  summary: string;
  lookFor: string[];
  preparation: string;
  selectionNote: string;
  originNote: string | null;
  sections: { id: string; title: string; body: string }[];
  labelUse: string;
  materialProfile: {
    label: string;
    value: string;
    explanation: string;
  }[];
  materialSummary: string;
  profileKind: "sample";
  materialImage: string;
  materialImageAlt: string;
};

type ProductIdentity = {
  title: string;
  handle: string;
  description: string;
};

type ApplicationContent = Omit<ProductContent, "name">;
type ApplicationKey = "cafés & baking" | "lattes" | "tea service";

const productApplications: Record<ProductKey, ApplicationKey> = {
  culinary: "cafés & baking",
  barista: "lattes",
  ceremonial: "tea service",
};

/**
 * Editable sample editorial content, authorized by the owner on 2026-09-29.
 * The owner also authorized authored SAMPLE sensory profiles for this concept.
 * The owner removed customer-facing development captions on 2026-10-01.
 * They describe an illustrative formulation, not a measured or approved lot.
 * Keep price, availability, formats and quantities in the commerce projection.
 * Origin, people, certificates and processing claims need their own evidence;
 * none is created by the visual prototype or inferred from a grade name.
 */
const applicationContent: Record<ApplicationKey, ApplicationContent> = {
  "cafés & baking": {
    application: "Cafés & Baking",
    purpose: "Part of the recipe.",
    summary:
      "A robust green character with defined bitterness and a lingering finish. This recipe-focused profile gives matcha a clear place alongside sweetness, cream and other ingredients, from café desserts to baked preparations.",
    materialSummary:
      "Direct, vegetal and distinctly green. A restrained savoury note leaves room for the recipe, while the defined bitter edge provides contrast to sweetness.",
    profileKind: "sample",
    materialImage: "/images/matcha/culinary.jpg",
    materialImageAlt:
      "A vertical swatch of olive-green matcha powder with a smooth centre and loose powder around its edges.",
    materialProfile: [
      {
        label: "Aroma",
        value: "Green leaf · dry grass",
        explanation:
          "A direct leafy aroma gives this profile a recognisable tea character within a complete recipe.",
      },
      {
        label: "Flavour",
        value: "Robust vegetal",
        explanation:
          "An assertive green flavour is the centre of the profile, intended to remain part of the finished serving.",
      },
      {
        label: "Umami",
        value: "Restrained",
        explanation:
          "Savoury depth plays a supporting role, leaving the other ingredients space in the recipe.",
      },
      {
        label: "Bitterness",
        value: "Defined",
        explanation:
          "A distinct bitter edge creates a useful contrast with sweet batters, fillings and creams.",
      },
      {
        label: "Texture",
        value: "Fine · powdery",
        explanation:
          "The material is presented as a fine powder for incorporation into a recipe; assess the texture in the finished item.",
      },
      {
        label: "Colour",
        value: "Olive green",
        explanation:
          "A muted green material direction. Compare the finished colour after cooking and cooling as well as before preparation.",
      },
      {
        label: "Finish",
        value: "Lingering green",
        explanation:
          "The tea character remains after the initial sweetness, giving the finished serving a recognisable matcha note.",
      },
    ],
    lookFor: [
      "Flavour alongside the other ingredients",
      "Colour in the finished serving",
      "The result after cooking and cooling",
    ],
    preparation:
      "Keep the matcha dose, ingredients, method and serving size the same between trials. For baked recipes, compare the finished items after cooking and cooling, rather than judging the uncooked mixture alone.",
    selectionNote:
      "Start with one recipe you know well. Change the matcha while keeping the recipe consistent, then record the result. This gives your next selection a useful point of comparison.",
    originNote: null,
    sections: [
      {
        id: "recipe",
        title: "Meet it in the finished recipe.",
        body: "A powder sample and a finished dessert answer different questions. Taste a complete serving with its fillings, toppings or accompaniments. Notice whether the matcha has the presence you want in the whole recipe.",
      },
      {
        id: "repeat",
        title: "Make the result repeatable.",
        body: "Record the recipe, matcha quantity, method and serving size alongside your tasting notes. Once a trial works for your menu, those details make it easier to compare a later sample on the same terms.",
      },
    ],
    labelUse: "CAFÉS & BAKING",
  },
  lattes: {
    application: "Lattes",
    purpose: "For the drinks you serve.",
    summary:
      "A round green profile with balanced umami, moderate bitterness and a soft finish. Developed around the complete café drink, it puts the relationship between matcha, milk and sweetness at the centre of the selection.",
    materialSummary:
      "Fresh green flavour with a rounded savoury centre. Enough definition to give a latte its matcha character, with a soft finish that belongs alongside milk.",
    profileKind: "sample",
    materialImage: "/images/matcha/latte.jpg",
    materialImageAlt:
      "A vertical swatch of deep-green matcha powder, smoothed through the centre with loose granules at the edges.",
    materialProfile: [
      {
        label: "Aroma",
        value: "Fresh green",
        explanation:
          "A fresh leafy opening sets the direction for the drink without relying on an added flavouring note.",
      },
      {
        label: "Flavour",
        value: "Round · vegetal",
        explanation:
          "A rounded green-tea character is intended to sit alongside the milk and sweetness in a complete latte.",
      },
      {
        label: "Umami",
        value: "Balanced",
        explanation:
          "Savoury depth gives the profile a centre without making it the only quality in the drink.",
      },
      {
        label: "Bitterness",
        value: "Moderate",
        explanation:
          "A moderate bitter edge provides definition when combined with your chosen milk and sweetener.",
      },
      {
        label: "Texture",
        value: "Soft-bodied",
        explanation:
          "A soft texture is the intended direction in the finished drink; compare it using the milk and preparation you serve.",
      },
      {
        label: "Colour",
        value: "Deep green",
        explanation:
          "A rich green material direction, to be assessed again in the complete hot or iced latte.",
      },
      {
        label: "Finish",
        value: "Rounded · lightly savoury",
        explanation:
          "A gentle savoury finish completes the profile rather than a sharply bitter ending.",
      },
    ],
    lookFor: [
      "Flavour with your chosen milk",
      "Colour and texture in the complete drink",
      "Hot and iced recipes, tasted separately",
    ],
    preparation:
      "Use your usual milk and sweetener. Keep the matcha dose, milk quantity and finished drink size consistent between samples. Compare hot drinks with hot drinks, and iced drinks with iced drinks.",
    selectionNote:
      "Build the trial around your menu. If you serve more than one milk or both hot and iced drinks, compare each recipe separately so the result reflects the way your customers will drink it.",
    originNote: null,
    sections: [
      {
        id: "menu",
        title: "Start with your own latte.",
        body: "Use a familiar recipe as your reference. Taste the complete drink, including the sweetness and serving size you offer. Ask how clearly the matcha comes through and whether the balance suits your menu.",
      },
      {
        id: "compare",
        title: "One comparison at a time.",
        body: "Changing the milk, sweetness and matcha together makes it harder to know which change you prefer. Keep the rest of the recipe steady while comparing samples, then refine the recipe around your selection.",
      },
    ],
    labelUse: "LATTES",
  },
  "tea service": {
    application: "Tea Service",
    purpose: "Meet the matcha itself.",
    summary:
      "Delicate green aromas, a savoury umami centre and a soft, lingering finish. This water-focused profile keeps the material itself in view: its aroma during preparation, its texture in the bowl and the character that remains after a sip.",
    materialSummary:
      "Delicate at the opening, savoury through the middle and soft at the finish. A profile for whisking with water, where the matcha can be considered on its own.",
    profileKind: "sample",
    materialImage: "/images/matcha/tea-service.jpg",
    materialImageAlt:
      "A bright-green matcha powder swatch with a smooth vertical centre, fine ridges and scattered powder along its edges.",
    materialProfile: [
      {
        label: "Aroma",
        value: "Delicate · fresh leaf",
        explanation:
          "A light green aroma gives the preparation a quiet opening before the first sip.",
      },
      {
        label: "Flavour",
        value: "Clean green · savoury",
        explanation:
          "A clear green character and savoury depth form the centre of a preparation made with water.",
      },
      {
        label: "Umami",
        value: "Full · rounded",
        explanation:
          "The savoury element is more prominent in this profile, providing depth without additional ingredients.",
      },
      {
        label: "Bitterness",
        value: "Gentle",
        explanation:
          "A restrained bitter edge leaves space to notice the aroma, texture and savoury character.",
      },
      {
        label: "Texture",
        value: "Fine · soft",
        explanation:
          "A soft texture is the intended character in the bowl, considered alongside flavour rather than as a separate score.",
      },
      {
        label: "Colour",
        value: "Bright green",
        explanation:
          "A vivid green material direction, with the prepared colour forming part of the tasting experience.",
      },
      {
        label: "Finish",
        value: "Soft · lingering umami",
        explanation:
          "Savoury character continues after the sip with a soft ending, inviting attention to the finish itself.",
      },
    ],
    lookFor: [
      "Aroma as the matcha is prepared",
      "Flavour and texture when whisked with water",
      "The finish after each sip",
    ],
    preparation:
      "Keep the matcha dose, water quantity, water temperature and whisking method consistent. Compare samples at the same serving temperature and record those preparation details with your tasting notes.",
    selectionNote:
      "Describe what you notice in your own words. A consistent preparation helps you return to those observations when choosing a matcha for a particular service, or comparing a new sample with an earlier one.",
    originNote: null,
    sections: [
      {
        id: "observe",
        title: "Give the tasting your attention.",
        body: "Notice the aroma during preparation, the flavour and texture as you drink, and the finish that follows. These are prompts for your own observations, rather than a score the matcha needs to achieve.",
      },
      {
        id: "prepare",
        title: "Keep the preparation consistent.",
        body: "Dose, water and method are part of the tasting. Write them down alongside your notes so that a second cup is a useful comparison. When you adjust a preparation, change one part at a time.",
      },
    ],
    labelUse: "TEA SERVICE",
  },
};

const generalContent: ApplicationContent = {
  application: "Matcha selection",
  purpose: "Choose around what you make.",
  summary:
    "Start with the way you want to serve matcha. Compare it in your own drink or recipe, choose the format you need, and keep the preparation consistent while you explore the selection.",
  materialSummary:
    "Explore aroma, flavour, savoury depth and finish together, then consider how that character belongs in your intended preparation.",
  profileKind: "sample",
  materialImage: "/images/hero/matcha-macro-v2.webp",
  materialImageAlt: "A close material study of fine green matcha powder.",
  materialProfile: [
    {
      label: "Aroma",
      value: "Green leaf",
      explanation: "Consider the leafy character in your intended preparation.",
    },
    {
      label: "Flavour",
      value: "Soft vegetal",
      explanation:
        "A green-tea character to consider in your intended preparation.",
    },
    {
      label: "Umami",
      value: "Balanced",
      explanation:
        "Savoury depth sits alongside the other qualities in the profile.",
    },
    {
      label: "Bitterness",
      value: "Gentle",
      explanation: "A mild bitter edge provides a point of contrast.",
    },
    {
      label: "Texture",
      value: "Fine powder",
      explanation:
        "Consider the material and the texture of the finished serving separately.",
    },
    {
      label: "Colour",
      value: "Matcha green",
      explanation: "Compare the colour in the powder and the finished serving.",
    },
    {
      label: "Finish",
      value: "Soft green",
      explanation:
        "Notice the tea character that remains after the initial taste.",
    },
  ],
  lookFor: [
    "Flavour in your intended preparation",
    "Colour and texture in the finished serving",
    "A result you can prepare consistently",
  ],
  preparation:
    "Use the same matcha dose, ingredients, method and serving size when comparing samples. Record those details with your tasting notes so the next trial has a useful point of reference.",
  selectionNote:
    "A useful comparison starts with a clear purpose. Decide what you want to make, then compare samples within that preparation before changing the recipe.",
  originNote: null,
  sections: [
    {
      id: "purpose",
      title: "Begin with the finished serving.",
      body: "Matcha may be served with water, combined with milk or incorporated into a recipe. Compare a selection in its intended use so your observations relate to what you actually plan to serve.",
    },
    {
      id: "record",
      title: "Keep a useful reference.",
      body: "Record the preparation and what you notice. Those notes help you compare another sample later without relying on a grade name, a photograph or memory alone.",
    },
  ],
  labelUse: "MATCHA",
};

function publishedApplication(title: string): string | null {
  const match = title.match(/\bfor\s+(.+?)(?=\s+[—–]\s+|$)/i);
  return match?.[1]?.trim() || null;
}

/** Known products keep their content when upstream catalog titles change. */
function getEnglishProductContent(
  product: ProductIdentity | undefined,
): ProductContent {
  const productKey = product ? getProductKey(product.handle) : undefined;
  if (product && productKey) {
    return {
      ...applicationContent[productApplications[productKey]],
      name: productName(product.title, product.handle),
    };
  }

  // Historical study and bag-label fixtures still supply a literal application.
  const application = product ? publishedApplication(product.title) : null;
  const key = application?.normalize("NFKC").toLocaleLowerCase("en");
  const content =
    key && Object.hasOwn(applicationContent, key)
      ? applicationContent[key as ApplicationKey]
      : undefined;

  return {
    ...(content ?? generalContent),
    name: product ? productName(product.title, product.handle) : "Your matcha",
    // Unknown literal applications stay intact and receive neutral guidance.
    // A grade alone never creates an intended use or product-performance claim.
    ...(application && !content
      ? { application, labelUse: application.toUpperCase() }
      : {}),
  };
}

/** Translate editorial copy only; assets, section IDs and product identity stay stable. */
export function getProductContent(
  product: ProductIdentity | undefined,
  locale: Locale = "en",
): ProductContent {
  const content = getEnglishProductContent(product);
  if (locale === "en") return content;
  const t = (source: string) => translate(locale, source);
  return {
    ...content,
    name: t(content.name),
    application: t(content.application),
    purpose: t(content.purpose),
    summary: t(content.summary),
    lookFor: content.lookFor.map(t),
    preparation: t(content.preparation),
    selectionNote: t(content.selectionNote),
    originNote: content.originNote ? t(content.originNote) : null,
    sections: content.sections.map((section) => ({
      ...section,
      title: t(section.title),
      body: t(section.body),
    })),
    labelUse: t(content.labelUse),
    materialProfile: content.materialProfile.map((property) => ({
      label: t(property.label),
      value: t(property.value),
      explanation: t(property.explanation),
    })),
    materialSummary: t(content.materialSummary),
    materialImageAlt: t(content.materialImageAlt),
  };
}
