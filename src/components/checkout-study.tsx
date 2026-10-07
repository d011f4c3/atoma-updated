"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { CartData, CartResponse } from "@/lib/cart-types";
import { getProductCode } from "@/lib/product-codes";
import { productName } from "@/lib/product-name";
import { CartButton, useCart } from "./cart-drawer";
import {
  CheckoutKitPreview,
  type CheckoutKitPreviewIssue,
} from "./checkout-kit-preview";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./checkout-study.module.css";

type Selection = {
  state: "loading" | "ready" | "empty" | "error";
  cart: CartData | null;
  checkoutEnabled: boolean;
};

const emptySelection: Selection = {
  state: "loading",
  cart: null,
  checkoutEnabled: false,
};

async function readSelection(signal?: AbortSignal): Promise<Selection> {
  const response = await fetch("/api/cart", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const result: CartResponse = await response.json();
  if (!response.ok || !["ready", "empty", "missing"].includes(result.kind)) {
    throw new Error("Selection unavailable");
  }
  return {
    state: result.kind === "ready" && result.cart ? "ready" : "empty",
    cart: result.kind === "ready" ? (result.cart ?? null) : null,
    checkoutEnabled: result.checkoutEnabled === true,
  };
}

function canPurchase(cart: CartData | null): boolean {
  return Boolean(
    cart &&
    cart.lines.length > 0 &&
    cart.lines.every((line) => {
      const { minimum, maximum, increment } = line.quantityRule;
      return (
        line.purchaseState === "purchasable" &&
        Number.isInteger(line.quantity) &&
        line.quantity >= minimum &&
        (maximum === null || line.quantity <= maximum) &&
        (line.quantity - minimum) % increment === 0
      );
    }),
  );
}

function ConceptField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={styles.conceptField} data-wide={wide}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function CheckoutStudy() {
  const { tone: storefrontTone } = useStorefrontTheme();
  const [tone, setTone] = useState(storefrontTone);
  const [conceptCountry, setConceptCountry] = useState<"US" | "SG">("SG");
  const {
    busy,
    isOpen,
    refreshCart,
    reviewRequired,
    error: cartError,
  } = useCart();
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [openingHosted, setOpeningHosted] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const prepareButton = useRef<HTMLButtonElement>(null);
  const activePopup = useRef(false);
  const requestCount = useRef(0);
  const prepareController = useRef<AbortController | null>(null);

  const refreshSelection = useCallback(async () => {
    if (activePopup.current) return;
    const request = ++requestCount.current;
    setSelection((current) => ({ ...current, state: "loading" }));
    try {
      const result = await readSelection();
      if (request === requestCount.current) setSelection(result);
    } catch {
      if (request === requestCount.current) {
        setSelection({ state: "error", cart: null, checkoutEnabled: false });
      }
    }
  }, []);

  useEffect(() => {
    if (busy || isOpen) return;
    const controller = new AbortController();
    const request = ++requestCount.current;
    void readSelection(controller.signal).then(
      (result) => {
        if (controller.signal.aborted || request !== requestCount.current)
          return;
        setSelection(result);
      },
      () => {
        if (controller.signal.aborted || request !== requestCount.current)
          return;
        setSelection({ state: "error", cart: null, checkoutEnabled: false });
      },
    );
    return () => controller.abort();
  }, [busy, isOpen]);

  useEffect(() => {
    if (!preparedUrl || popupOpen) return;
    const expiry = window.setTimeout(() => {
      if (activePopup.current) return;
      setPreparedUrl(null);
      setNotice(
        "The prepared checkout expired. Prepare it again when you are ready.",
      );
      void refreshSelection();
    }, 60_000);
    return () => window.clearTimeout(expiry);
  }, [preparedUrl, popupOpen, refreshSelection]);

  useEffect(() => {
    function clearOnLeave() {
      prepareController.current?.abort();
      activePopup.current = false;
      setPopupOpen(false);
      setPreparedUrl(null);
    }
    function refreshOnReturn() {
      if (activePopup.current) return;
      setOpeningHosted(false);
      setPreparing(false);
      setPreparedUrl(null);
      void refreshSelection();
    }
    window.addEventListener("pagehide", clearOnLeave);
    window.addEventListener("pageshow", refreshOnReturn);
    return () => {
      prepareController.current?.abort();
      window.removeEventListener("pagehide", clearOnLeave);
      window.removeEventListener("pageshow", refreshOnReturn);
    };
  }, [refreshSelection]);

  const ready =
    selection.state === "ready" &&
    selection.checkoutEnabled &&
    canPurchase(selection.cart) &&
    !busy &&
    !isOpen &&
    !reviewRequired &&
    !cartError;
  const locked = preparing || openingHosted || preparedUrl !== null;

  function openHosted(event: FormEvent<HTMLFormElement>) {
    if (!ready || locked) {
      event.preventDefault();
      return;
    }
    setOpeningHosted(true);
  }

  async function preparePopup() {
    if (!ready || locked) return;
    setPreparing(true);
    setNotice(null);
    const controller = new AbortController();
    prepareController.current?.abort();
    prepareController.current = controller;
    try {
      const response = await fetch("/api/checkout/study", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "",
        signal: controller.signal,
      });
      const result: { kind?: string; checkoutUrl?: string } =
        await response.json();
      if (
        !response.ok ||
        result.kind !== "ready" ||
        typeof result.checkoutUrl !== "string"
      ) {
        throw new Error("Checkout unavailable");
      }
      if (controller.signal.aborted) return;
      // The freshly validated URL remains only in this mounted attempt's memory.
      setPreparedUrl(result.checkoutUrl);
    } catch {
      if (!controller.signal.aborted) {
        setNotice(
          "Checkout could not be prepared. Refresh the selection and try again, or use hosted checkout.",
        );
        void refreshSelection();
      }
    } finally {
      if (!controller.signal.aborted) setPreparing(false);
    }
  }

  function finishPopup(message: string) {
    activePopup.current = false;
    setPopupOpen(false);
    setPreparedUrl(null);
    setNotice(message);
    void Promise.all([refreshSelection(), refreshCart()]).then(() => {
      window.requestAnimationFrame(() => prepareButton.current?.focus());
    });
  }

  function handlePopupError(issue: CheckoutKitPreviewIssue) {
    if (issue === "checkout_warning") {
      setNotice(
        "Checkout reported an issue that may be recoverable. Continue in the checkout window, or close the preview before trying the hosted option.",
      );
      return;
    }
    if (issue === "unconfirmed_start") {
      setNotice(
        "The popup has not confirmed its connection. If checkout opened, you can continue there. Close the preview before trying the hosted option.",
      );
      return;
    }
    finishPopup(
      "The popup could not continue. Your selection will be refreshed; hosted checkout is available as a fallback.",
    );
  }

  return (
    <div
      className={styles.study}
      data-storefront-theme={tone}
      data-tone={tone}
      lang="en"
    >
      <header className={styles.studyBar}>
        <div>
          <span>Checkout design study</span>
          <span className={styles.studyStatus}>
            Design concept · integration undecided
          </span>
        </div>
        <div className={styles.studyControls}>
          <Link href="/">
            Return to storefront <span aria-hidden="true">↗</span>
          </Link>
          <button
            type="button"
            className={styles.themeButton}
            onClick={() => setTone(tone === "light" ? "dark" : "light")}
            aria-label={`Switch study to ${tone === "light" ? "dark" : "light"} appearance`}
          >
            <span aria-hidden="true">◐</span>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section
          className={styles.checkoutConcept}
          aria-labelledby="study-title"
        >
          <header className={styles.checkoutHeader}>
            <Link
              href="/"
              className={styles.wordmark}
              aria-label="ATOMA storefront"
            >
              ATOMA
            </Link>
            <span>
              Selection <span aria-hidden="true">/</span> Checkout
            </span>
          </header>
          <div className={styles.checkoutGrid}>
            <div className={styles.detailsColumn}>
              <div className={styles.intro}>
                <p className={styles.eyebrow}>ATOMA / CHECKOUT</p>
                <h1 id="study-title">
                  Complete
                  <br />
                  your selection.
                </h1>
                <p className={styles.conceptNote}>
                  A design direction using the storefront’s existing cart
                  language.
                </p>
              </div>

              <section className={styles.step} aria-labelledby="contact-title">
                <div className={styles.stepHeading}>
                  <span>01</span>
                  <h2 id="contact-title">Contact</h2>
                </div>
                <div
                  className={styles.fields}
                  aria-label="Contact layout preview; fields are not connected"
                >
                  <ConceptField label="Email" value="Email address" wide />
                </div>
              </section>

              <section className={styles.step} aria-labelledby="delivery-title">
                <div className={styles.stepHeading}>
                  <span>02</span>
                  <h2 id="delivery-title">Delivery</h2>
                </div>
                <div className={styles.countryRow}>
                  <span>Shipping country</span>
                  <div role="group" aria-label="Concept shipping country">
                    <button
                      type="button"
                      aria-pressed={conceptCountry === "SG"}
                      onClick={() => setConceptCountry("SG")}
                    >
                      Singapore
                    </button>
                    <button
                      type="button"
                      aria-pressed={conceptCountry === "US"}
                      onClick={() => setConceptCountry("US")}
                    >
                      United States
                    </button>
                  </div>
                </div>
                <div
                  className={styles.fields}
                  aria-label="Delivery layout preview; fields are not connected"
                >
                  <ConceptField label="Recipient" value="Full name" wide />
                  <ConceptField label="Address" value="Street address" wide />
                  <ConceptField
                    label="Apartment / unit"
                    value="Optional"
                    wide
                  />
                  {conceptCountry === "US" && (
                    <>
                      <ConceptField label="City" value="City" />
                      <ConceptField label="State" value="State" />
                    </>
                  )}
                  <ConceptField
                    label={conceptCountry === "US" ? "ZIP code" : "Postal code"}
                    value={conceptCountry === "US" ? "ZIP code" : "Postal code"}
                    wide
                  />
                </div>
                <div className={styles.shippingNote}>
                  <span aria-hidden="true">↳</span>
                  <p>
                    Delivery options and timing would appear here once rates are
                    confirmed.
                  </p>
                </div>
              </section>

              <section className={styles.step} aria-labelledby="payment-title">
                <div className={styles.stepHeading}>
                  <span>03</span>
                  <h2 id="payment-title">Payment</h2>
                  <span className={styles.stepStatus}>Not connected</span>
                </div>
                <div className={styles.paymentPlaceholder}>
                  <svg
                    width="23"
                    height="19"
                    viewBox="0 0 23 19"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="22"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                    />
                    <path d="M1 6.5h21M4 14h5" stroke="currentColor" />
                  </svg>
                  <div>
                    <span>Secure payment element</span>
                    <p>Provider and integration to be confirmed.</p>
                  </div>
                </div>
                <p className={styles.finePrint}>
                  Design placeholder only. No payment details are collected.
                </p>
              </section>
            </div>

            <section
              className={styles.selection}
              aria-labelledby="selection-title"
              aria-busy={selection.state === "loading"}
            >
              <div className={styles.selectionTopline}>
                <span>ATOMA / ORDER</span>
                {!locked && (
                  <CartButton tone={tone} className={styles.cartButton} />
                )}
              </div>
              <div className={styles.selectionIntro}>
                <p className={styles.eyebrow}>
                  {String(selection.cart?.totalQuantity ?? 0).padStart(2, "0")}{" "}
                  /{" "}
                  {(selection.cart?.totalQuantity ?? 0) === 1
                    ? "ITEM"
                    : "ITEMS"}
                  <span aria-hidden="true">◇</span>
                </p>
                <h2 id="selection-title">
                  Your
                  <br />
                  selection.
                </h2>
              </div>
              <div className={styles.selectionContent}>
                {selection.state === "loading" && (
                  <p className={styles.selectionMessage} role="status">
                    Reading your selection…
                  </p>
                )}
                {selection.state === "error" && (
                  <p className={styles.selectionMessage} role="alert">
                    Your selection could not be loaded. Refresh it before
                    continuing.
                  </p>
                )}
                {selection.state === "empty" && (
                  <div className={styles.emptySelection}>
                    <p>Add a product to see your selection here.</p>
                    <Link
                      href="/?matcha=jmm-storefront-test-matcha"
                      className={styles.textLink}
                    >
                      Choose Culinary Matcha <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                )}
                {selection.state === "ready" && selection.cart && (
                  <>
                    <ol className={styles.selectionLines}>
                      {selection.cart.lines.map((line, index) => (
                        <li key={line.lineKey}>
                          <span className={styles.lineIndex}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <div className={styles.lineHeader}>
                              <h3>
                                {productName(
                                  line.productTitle,
                                  line.productHandle,
                                )}
                              </h3>
                              <span className={styles.price}>
                                {line.lineTotalLabel}
                              </span>
                            </div>
                            <p className={styles.variant}>
                              {getProductCode(line.productHandle)}
                              {line.variantTitle !== "Default Title"
                                ? ` / ${line.variantTitle}`
                                : ""}
                            </p>
                            <div className={styles.lineFooter}>
                              <span>{line.unitPriceLabel} / unit</span>
                              <span>
                                Qty {String(line.quantity).padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {!canPurchase(selection.cart) && (
                      <p className={styles.selectionMessage} role="alert">
                        Review the cart’s availability and quantities before
                        checking out.
                      </p>
                    )}
                    {!selection.checkoutEnabled && (
                      <p className={styles.selectionMessage}>
                        Checkout is unavailable in this environment.
                      </p>
                    )}
                  </>
                )}
                {(reviewRequired || cartError) && (
                  <p className={styles.selectionMessage} role="alert">
                    Open the cart and reload your selection before trying either
                    checkout.
                  </p>
                )}
              </div>
              <div className={styles.orderFooter}>
                <dl className={styles.totals}>
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{selection.cart?.subtotalLabel ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>
                      Shipping to{" "}
                      {conceptCountry === "SG" ? "Singapore" : "United States"}
                    </dt>
                    <dd className={styles.pending}>Pending</dd>
                  </div>
                  <div className={styles.grandTotal}>
                    <dt>
                      Total <span>JPY</span>
                    </dt>
                    <dd>—</dd>
                  </div>
                </dl>
                <p className={styles.finePrint}>
                  The final total depends on approved shipping and checkout
                  terms.
                </p>
                <button type="button" disabled className={styles.conceptPay}>
                  <span>Payment not connected</span>
                  <span aria-hidden="true">↗</span>
                </button>
                <div className={styles.selectionFooter}>
                  <span>Design concept only</span>
                  <button
                    type="button"
                    onClick={() => void refreshSelection()}
                    disabled={locked || busy || selection.state === "loading"}
                  >
                    Refresh selection <span aria-hidden="true">↻</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section
          className={styles.integration}
          aria-labelledby="integration-title"
        >
          <div className={styles.integrationIntro}>
            <p className={styles.eyebrow}>Working test flow</p>
            <h2 id="integration-title">What Shopify currently provides.</h2>
            <p>
              The concept above is a custom ATOMA design. The working tests
              below open Shopify’s own checkout form.{" "}
              <strong>
                Redirect and popup use the same form; only the window behavior
                changes.
              </strong>
            </p>
          </div>
          <div className={styles.runtimeOptions} aria-label="Checkout options">
            <article className={styles.runtimeOption}>
              <div className={styles.runtimeHeading}>
                <span>01</span>
                <h3>Shopify in this tab</h3>
              </div>
              <p>
                Leaves ATOMA for the active test-shop checkout. Its layout is
                controlled by Shopify.
              </p>
              <form action="/api/checkout" method="post" onSubmit={openHosted}>
                <button
                  className={styles.secondaryButton}
                  disabled={!ready || locked}
                  type="submit"
                >
                  {openingHosted ? "Opening checkout…" : "Try hosted checkout"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>
            </article>
            <article className={styles.runtimeOption}>
              <div className={styles.runtimeHeading}>
                <span>02</span>
                <h3>Shopify in another window</h3>
                <span className={styles.alpha}>Alpha</span>
              </div>
              <p>
                Checkout Kit opens the same form in a popup or another tab. It
                does not embed the ATOMA concept.
              </p>
              {!preparedUrl && (
                <button
                  ref={prepareButton}
                  className={styles.secondaryButton}
                  disabled={!ready || locked}
                  type="button"
                  onClick={() => void preparePopup()}
                >
                  {preparing ? "Preparing checkout…" : "Prepare Checkout Kit"}
                  <span aria-hidden="true">↗</span>
                </button>
              )}
              {preparedUrl && (
                <div className={styles.sdkPreview}>
                  <CheckoutKitPreview
                    checkoutUrl={preparedUrl}
                    onOpen={() => {
                      activePopup.current = true;
                      setPopupOpen(true);
                    }}
                    onComplete={() =>
                      finishPopup(
                        "Checkout reported completion. The cart is being refreshed; confirm the order in Shopify.",
                      )
                    }
                    onClose={() =>
                      finishPopup(
                        "Checkout closed. Your selection has been refreshed.",
                      )
                    }
                    onError={handlePopupError}
                  />
                  {!popupOpen && (
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() =>
                        finishPopup("Preview preparation canceled.")
                      }
                    >
                      Cancel preparation
                    </button>
                  )}
                </div>
              )}
            </article>
          </div>
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
          <p className={styles.integrationNote}>
            Grow supports logo, color and font changes. Plus adds finer field
            and type styling within Shopify’s checkout structure.
          </p>
          <p className={styles.integrationNote}>
            Local test shop · simulated payments · Checkout Kit is not
            production-ready. A custom payment integration has not been approved
            or connected.
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>ATOMA / Checkout study</span>
        <span>October 2026</span>
      </footer>
    </div>
  );
}
