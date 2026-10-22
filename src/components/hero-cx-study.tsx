"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import type { ProductKey } from "@/lib/product-codes";
import { useCart } from "./cart-drawer";
import { LanguageSwitcher } from "./language-switcher";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { HeroCxDirectory } from "./hero-cx-directory";
import { HeroCxGuided } from "./hero-cx-guided";
import { HeroCxApplications } from "./hero-cx-applications";
import { HeroCxMaterial } from "./hero-cx-material";
import { HeroCxField } from "./hero-cx-field";
import type {
  HeroCxLayout,
  HeroCxLayoutProps,
  HeroCxStep,
} from "./hero-cx-layout-types";
import styles from "./hero-cx-study.module.css";

type View = {
  layout: HeroCxLayout;
  tone: "light" | "dark";
  tea: ProductKey | undefined;
  step: HeroCxStep;
};
const layouts = [
  {
    value: "field",
    name: "06 — Application field",
    description:
      "New pass — application typography is the entrance; powder responds to focus and each use opens its product directly.",
  },
  {
    value: "material",
    name: "05 — Material & application",
    description:
      "Earlier pass — ATOMA's material language, with three direct application paths and one sample entry.",
  },
  {
    value: "applications",
    name: "04 — Made with matcha",
    description:
      "Earlier pass — finished applications lead the hero, with a direct path to samples and each tea.",
  },
  {
    value: "invitation",
    name: "01 — Sample invitation",
    description: "A single invitation, followed by one photographic scene.",
  },
  {
    value: "directory",
    name: "02 — Application directory",
    description:
      "The products are the page. Open one application to see its next step.",
  },
  {
    value: "guided",
    name: "03 — Guided decision",
    description:
      "Earlier pass — one application question followed by a product summary.",
  },
] as const;
const startingStep = (layout: HeroCxLayout): HeroCxStep =>
  layout === "invitation" ||
  layout === "applications" ||
  layout === "material" ||
  layout === "field"
    ? "intro"
    : "application";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function HeroCxStudy() {
  const { tone: storefrontTone } = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const {
    navigationBusy: busy,
    itemCount,
    openCart,
    isOpen,
    dialogId,
  } = useCart();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Native links work from server HTML; in-place controls need hydration first.
  const controlsBusy = busy || !ready;
  const search = useSearchParams();
  const requestedLayout = search.get("layout") ?? search.get("flow");
  const layout: HeroCxLayout =
    requestedLayout === "directory" || requestedLayout === "application"
      ? "directory"
      : requestedLayout === "invitation" || requestedLayout === "samples"
        ? "invitation"
        : requestedLayout === "guided"
          ? "guided"
          : requestedLayout === "applications"
            ? "applications"
            : requestedLayout === "material"
              ? "material"
              : "field";
  const controlsFollowHero =
    layout === "applications" || layout === "material" || layout === "field";
  const teaParam = search.get("tea");
  const tea =
    teaParam === "ceremonial" ||
    teaParam === "barista" ||
    teaParam === "culinary"
      ? teaParam
      : undefined;
  const toneParam = search.get("tone");
  const stepParam = search.get("step");
  const view: View = {
    layout,
    tone:
      toneParam === "light" || toneParam === "dark"
        ? toneParam
        : storefrontTone,
    tea,
    step:
      layout === "invitation"
        ? "intro"
        : stepParam === "product" && tea
          ? "product"
          : stepParam === "application"
            ? "application"
            : startingStep(layout),
  };
  const selected =
    view.step === "product"
      ? SAMPLE_SET_CONTENTS.find((item) => item.key === view.tea)
      : undefined;
  const oneKgHref = selected
    ? oneKilogramProductUrl(selected.productHandle)
    : null;

  function guardNavigation(event: { preventDefault: () => void }) {
    if (busy) event.preventDefault();
  }

  function update(patch: Partial<View>, focus = true) {
    if (controlsBusy) return;
    const next = { ...view, ...patch };
    const url = new URL(window.location.href);
    url.searchParams.delete("flow");
    url.searchParams.delete("visual");
    url.searchParams.delete("intent");
    url.searchParams.set("layout", next.layout);
    url.searchParams.set("tone", next.tone);
    url.searchParams.set("step", next.step);
    if (next.tea) url.searchParams.set("tea", next.tea);
    else url.searchParams.delete("tea");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    if (focus)
      requestAnimationFrame(() =>
        headingRef.current?.focus({ preventScroll: true }),
      );
  }

  const sampleAction = (
    <div className={styles.sampleAction} data-cx-sample-action>
      <Link
        href="/samples"
        className={styles.primary}
        data-cx-samples
        data-cx-primary="samples"
        aria-describedby="cx-sample-contents"
        aria-disabled={busy || undefined}
        onClick={guardNavigation}
        onNavigate={guardNavigation}
      >
        <span>{t("Start with the Sample Set")}</span>
        <span aria-hidden="true">↗</span>
      </Link>
      <p id="cx-sample-contents" className={styles.detail}>
        {t("Three matcha · 20 g each")}
      </p>
    </div>
  );
  const orderAction =
    selected && oneKgHref ? (
      <Link
        href={oneKgHref}
        className={styles.secondary}
        data-cx-one-kilogram
        aria-disabled={busy || undefined}
        onClick={guardNavigation}
        onNavigate={guardNavigation}
      >
        <span>{t("View 1 kg of {name}", { name: t(selected.name) })}</span>
        <span aria-hidden="true">↗</span>
      </Link>
    ) : null;
  const actions = (
    <div className={styles.actions} data-cx-actions>
      {sampleAction}
      {orderAction}
    </div>
  );
  const layoutProps: HeroCxLayoutProps = {
    selected,
    selectedKey: view.tea,
    step: view.step,
    busy: controlsBusy,
    headingRef,
    actions,
    sampleAction,
    onChoose: (key) =>
      update({ tea: key, step: "product" }, layout !== "directory"),
    onBack: () =>
      update(
        {
          step: view.step === "product" ? "application" : startingStep(layout),
        },
        layout !== "directory",
      ),
  };

  const studyControls = (
    <aside className={styles.toolbar} lang="en" aria-label="Study controls">
      <span className={styles.studyTitle}>Hero / Layout study</span>
      <label>
        <span>Layout</span>
        <select
          data-cx-layout
          value={layout}
          disabled={controlsBusy}
          onChange={(event) => {
            const next = event.target.value as HeroCxLayout;
            update({ layout: next, step: startingStep(next) });
          }}
        >
          {layouts.map((item) => (
            <option key={item.value} value={item.value}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Appearance</span>
        <select
          data-cx-tone
          value={view.tone}
          disabled={controlsBusy}
          onChange={(event) =>
            update({ tone: event.target.value as "light" | "dark" }, false)
          }
        >
          <option value="light">Mist</option>
          <option value="dark">Blue hour</option>
        </select>
      </label>
      <button
        type="button"
        data-cx-restart
        disabled={controlsBusy}
        onClick={() => update({ step: startingStep(layout) })}
      >
        Restart
      </button>
      <Link
        href="/"
        aria-disabled={busy || undefined}
        onClick={guardNavigation}
        onNavigate={guardNavigation}
      >
        Current homepage ↗
      </Link>
      <p>{layouts.find((item) => item.value === layout)!.description}</p>
    </aside>
  );

  return (
    <div
      className={styles.study}
      data-hero-cx-study
      data-layout={layout}
      data-step={view.step}
      data-selected={view.tea}
      data-tone={view.tone}
      data-storefront-theme={view.tone}
    >
      {!controlsFollowHero && studyControls}
      <header className={styles.header}>
        <Link
          className={styles.wordmark}
          href="/"
          aria-disabled={busy || undefined}
          onClick={guardNavigation}
          onNavigate={guardNavigation}
        >
          ATOMA
        </Link>
        <nav aria-label={t("Shop")}>
          <Link
            href="/shop"
            aria-disabled={busy || undefined}
            onClick={guardNavigation}
            onNavigate={guardNavigation}
          >
            {t("Shop")}
          </Link>
          <button
            type="button"
            onClick={openCart}
            disabled={controlsBusy}
            aria-controls={dialogId}
            aria-expanded={isOpen}
            data-cx-cart
          >
            {t("Cart")} <span>{String(itemCount).padStart(2, "0")}</span>
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        {layout === "field" ? (
          <HeroCxField
            tone={view.tone}
            selectedKey={view.tea}
            busy={busy}
            onVisit={(key) => update({ tea: key, step: "product" }, false)}
            headingRef={headingRef}
            sampleAction={sampleAction}
          />
        ) : layout === "material" ? (
          <HeroCxMaterial
            tone={view.tone}
            selectedKey={view.tea}
            busy={busy}
            onVisit={(key) => update({ tea: key, step: "product" }, false)}
            headingRef={headingRef}
            sampleAction={sampleAction}
          />
        ) : layout === "applications" ? (
          <HeroCxApplications
            tone={view.tone}
            selectedKey={view.tea}
            busy={busy}
            onVisit={(key) => update({ tea: key, step: "product" }, false)}
            headingRef={headingRef}
            sampleAction={sampleAction}
          />
        ) : layout === "invitation" ? (
          <section
            className={styles.invitation}
            data-cx-layout-invitation
            aria-labelledby="cx-heading"
          >
            <div className={styles.invitationCopy}>
              <p className={styles.eyebrow}>{t("Japanese matcha")}</p>
              <h1 id="cx-heading" ref={headingRef} tabIndex={-1}>
                {t("Matcha for the way you make it.")}
              </h1>
              <p className={styles.description}>
                {t("Japanese matcha for tea service, lattes and recipes.")}
              </p>
              {actions}
              <Link
                className={styles.explore}
                href="/shop#product-comparison"
                aria-disabled={busy || undefined}
                onClick={guardNavigation}
                onNavigate={guardNavigation}
              >
                {t("Explore the three matcha")}{" "}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <RangeReference />
          </section>
        ) : layout === "directory" ? (
          <HeroCxDirectory {...layoutProps} />
        ) : (
          <HeroCxGuided {...layoutProps} />
        )}
      </main>
      {controlsFollowHero && studyControls}
      <footer className={styles.footer}>
        <span>ATOMA / {t("Matcha")}</span>
        <nav aria-label={t("About")}>
          <Link
            href="/origins"
            aria-disabled={busy || undefined}
            onClick={guardNavigation}
            onNavigate={guardNavigation}
          >
            {t("Origins")}
          </Link>
          <Link
            href="/about"
            aria-disabled={busy || undefined}
            onClick={guardNavigation}
            onNavigate={guardNavigation}
          >
            {t("About")}
          </Link>
        </nav>
        <LanguageSwitcher />
      </footer>
    </div>
  );
}

function RangeReference() {
  const { t } = useStorefrontLocale();
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  return (
    <figure
      className={styles.range}
      data-cx-range-image
      data-image-state={state}
    >
      <div className={styles.rangeFrame}>
        {state === "failed" ? (
          <p role="status" data-product-application-fallback>
            {t("Application image unavailable.")}
          </p>
        ) : (
          <Image
            src="/images/applications/matcha-range-composition-reference-v1.webp"
            alt={t(
              "A bowl of matcha, an iced latte and a slice of matcha cake on one neutral surface. AI composition reference.",
            )}
            fill
            sizes="(max-width: 760px) 100vw, 90vw"
            loading="eager"
            onLoad={() => setState("ready")}
            onError={() => setState("failed")}
          />
        )}
      </div>
      <figcaption>
        {t("AI composition reference · Product photography pending")}
      </figcaption>
    </figure>
  );
}
