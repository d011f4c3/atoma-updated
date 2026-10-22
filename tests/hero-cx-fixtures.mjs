/* Shared isolated browser fixtures. Commerce writes never reach the server. */
import {
  SAMPLE_SET_CONTENTS,
  SAMPLE_SET_OFFER,
} from "../src/lib/sample-set.ts";

const products = SAMPLE_SET_CONTENTS.map((item, index) => ({
  id: item.key,
  handle: item.productHandle,
  title: item.name,
  productCode: item.productCode,
  description: "Isolated application-entry browser fixture.",
  imageUrl: null,
  imageAlt: "",
  productUrl: null,
  isFixture: true,
  variants: [
    {
      id: `v1_${String.fromCharCode(97 + index).repeat(43)}`,
      title: "1 kg",
      available: true,
      priceMinor: 6000 + index * 1000,
      currency: "JPY",
      options: [{ name: "Size", value: "1 kg" }],
      minimum: 1,
      maximum: 4,
      increment: 1,
    },
  ],
}));
const sampleProduct = {
  ...products[0],
  id: "sample-set",
  handle: SAMPLE_SET_OFFER.productHandle,
  title: "Sample Set",
  productCode: null,
  variants: [
    {
      ...products[0].variants[0],
      id: `v1_${"s".repeat(43)}`,
      title: "3 × 20 g",
      options: SAMPLE_SET_OFFER.variants[0].options,
    },
  ],
};
export const cartProduct = products.find((item) => item.id === "barista");
const cart = {
  totalQuantity: 2,
  subtotalLabel: "¥14,000",
  totalLabel: "¥14,000",
  lines: [
    {
      lineKey: "retained-barista",
      productHandle: cartProduct.handle,
      productTitle: cartProduct.title,
      variantTitle: "1 kg",
      options: cartProduct.variants[0].options,
      quantity: 2,
      unitPriceLabel: "¥7,000",
      lineTotalLabel: "¥14,000",
      purchaseState: "purchasable",
      quantityRule: { minimum: 1, maximum: 4, increment: 1 },
      canUpdateQuantity: true,
      canRemove: true,
      image: null,
    },
  ],
};

export async function createHeroStudyFixture(
  browser,
  baseURL,
  width,
  tone,
  locale,
  options = {},
) {
  const origin = new URL(baseURL).origin;
  const context = await browser.newContext({
    viewport: { width, height: width <= 360 ? 740 : width < 500 ? 844 : 900 },
    deviceScaleFactor: options.deviceScaleFactor ?? 1,
    javaScriptEnabled: options.javaScriptEnabled ?? true,
    reducedMotion:
      options.reducedMotion ??
      (options.holdImages || options.holdDestination
        ? "no-preference"
        : "reduce"),
    isMobile: width < 500,
    hasTouch: width < 500,
  });
  await context.addCookies([
    { name: "atoma-theme", value: tone, url: baseURL },
    { name: "atoma-locale", value: locale, url: baseURL },
  ]);
  const errors = [];
  const writes = [];
  const simulatedWrites = [];
  let catalogReads = 0;
  let imageRequests = 0;
  let scriptRequests = 0;
  let releaseScripts;
  const scriptGate = new Promise((done) => {
    releaseScripts = done;
  });
  if (!options.holdScripts) releaseScripts();
  let releaseImages;
  const imageGate = new Promise((done) => {
    releaseImages = done;
  });
  if (!options.holdImages) releaseImages();
  let releaseDestination;
  const destinationGate = new Promise((done) => {
    releaseDestination = done;
  });
  if (!options.holdDestination) releaseDestination();
  let releaseMutation;
  const mutationGate = new Promise((done) => {
    releaseMutation = done;
  });
  if (!options.holdMutation) releaseMutation();
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) {
      errors.push(`Unexpected external request: ${url.origin}`);
      return route.abort();
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      if (
        options.holdMutation &&
        url.pathname === "/api/cart" &&
        request.method() === "POST"
      ) {
        simulatedWrites.push(request.postDataJSON());
        await mutationGate;
        return route.fulfill({
          status: 409,
          json: { kind: "rejected", cart, checkoutEnabled: false },
        });
      }
      writes.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/catalog") {
      catalogReads++;
      return route.fulfill({
        json: {
          status: "ready",
          products: [sampleProduct, ...products],
          shopUrl: "https://example.invalid",
        },
      });
    }
    if (url.pathname === "/api/cart")
      return route.fulfill({
        json: { kind: "ready", cart, checkoutEnabled: false },
      });
    if (url.pathname === "/api/destination") {
      await destinationGate;
      return route.fulfill({
        json: {
          kind: "ready",
          preference: { countryCode: "US", source: "default" },
          destination: { countryCode: "US", currency: "JPY" },
          countries: ["US", "SG"],
          reviewRequired: false,
        },
      });
    }
    if (url.pathname.startsWith("/api/")) {
      errors.push(`Unexpected API read: ${url.pathname}`);
      return route.abort();
    }
    if (options.holdScripts && request.resourceType() === "script") {
      scriptRequests++;
      await scriptGate;
    }
    if (
      request.resourceType() === "image" &&
      (url.pathname === "/_next/image" || url.pathname.startsWith("/images/"))
    ) {
      imageRequests++;
      if (options.failImages) return route.abort("failed");
      await imageGate;
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(40000);
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    errors,
    writes,
    simulatedWrites,
    catalogReads: () => catalogReads,
    imageRequests: () => imageRequests,
    scriptRequests: () => scriptRequests,
    releaseImages,
    releaseDestination,
    releaseMutation,
    releaseScripts,
    release: () => {
      releaseImages();
      releaseDestination();
      releaseMutation();
      releaseScripts();
    },
  };
}
