"use client";

import { useId, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { heroSevenDestination, heroSevenHref } from "@/lib/new-hero-seven-view";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { useCart } from "./cart-drawer";
import { NewHeroProducts } from "./new-hero-products";
import { ProductApplicationImage } from "./product-application-image";
import {
  HeroSevenLink,
  useHeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { useDialogDismiss } from "./use-dialog-dismiss";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./new-hero-seven-matcha.module.css";

const applications = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes",
} as const;

function applicationFromHash(): ProductKey | null {
  const key = window.location.hash.replace("#new-hero7-", "");
  return key === "ceremonial" || key === "barista" || key === "culinary"
    ? key
    : null;
}
function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}
const initialApplication = () => null;

export function NewHeroSevenMatcha({
  homeSection = false,
  mobileDialogOnly = false,
}: {
  homeSection?: boolean;
  mobileDialogOnly?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const cart = useCart();
  const navigation = useHeroSevenNavigation();
  const basePath = navigation?.basePath ?? "/new-hero7";
  const canonicalPopup = basePath === "/";
  const legacyApplication = useSyncExternalStore(
    subscribeToHash,
    applicationFromHash,
    initialApplication,
  );
  const view = homeSection ? "home" : "matcha";
  const productPrefix = homeSection ? "new-hero7-home" : "new-hero7";
  const selectionMemoryKey =
    basePath === "/"
      ? homeSection
        ? "homepage-applications"
        : "homepage"
      : productPrefix;
  const applicationAttribute = homeSection
    ? "data-new-hero7-home-application"
    : "data-new-hero7-application";
  const active = !navigation || navigation.state.view === view;
  const selected = navigation
    ? (navigation.state.application ?? null)
    : homeSection
      ? null
      : legacyApplication;
  const open = active && selected !== null;
  const id = useId();
  const container = useRef<HTMLElement>(null);
  usePageReveals(container, active);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogBody = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const externalEntry = useRef<{
    trigger: HTMLAnchorElement;
    product: ProductKey;
  } | null>(null);
  const localEntry = useRef(false);
  const previousProduct = useRef<ProductKey | null>(null);
  const returnFocusPending = useRef(false);
  const dismissPending = useRef(false);
  const ApplicationLink = navigation ? HeroSevenLink : "a";
  const Container = homeSection ? "section" : "div";
  const ApplicationHeading = homeSection ? "h3" : "p";
  const guard = {
    "aria-disabled": cart.navigationBusy || undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (cart.navigationBusy) event.preventDefault();
    },
  } as const;

  // The mobile hero opens this same product reader. Capture its actual link
  // before React updates the URL; tapping a link does not always focus it.
  useLayoutEffect(() => {
    if (!homeSection || !mobileDialogOnly || !active) return;
    const rememberEntry = (event: globalThis.MouseEvent) => {
      if (
        cart.navigationBusy ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[data-mobile-hero-learn]")
          : null;
      if (!link || (link.target && link.target !== "_self")) return;
      const destination = heroSevenDestination(
        link.getAttribute("href") ?? "",
        basePath,
      );
      if (destination?.view !== view || !destination.application) return;
      externalEntry.current = {
        trigger: link,
        product: destination.application,
      };
    };
    document.addEventListener("click", rememberEntry, true);
    return () => document.removeEventListener("click", rememberEntry, true);
  }, [
    active,
    basePath,
    cart.navigationBusy,
    homeSection,
    mobileDialogOnly,
    view,
  ]);

  // The cart locks body independently. Owning only the root avoids stale nested
  // overflow restoration when Back closes this popup underneath the cart.
  useLayoutEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const gutter = root.style.scrollbarGutter;
    if (window.innerWidth > root.clientWidth)
      root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      root.style.scrollbarGutter = gutter;
    };
  }, [open]);

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const top = window.scrollY;
    const left = window.scrollX;
    if (open && selected) {
      returnFocusPending.current = false;
      const entry = externalEntry.current;
      if (entry?.product === selected) {
        trigger.current = entry.trigger;
        localEntry.current = true;
        externalEntry.current = null;
      } else if (
        !trigger.current?.checkVisibility() ||
        heroSevenDestination(
          trigger.current.getAttribute("href") ?? "",
          basePath,
        )?.application !== selected
      ) {
        trigger.current =
          container.current?.querySelector<HTMLAnchorElement>(
            `[${applicationAttribute}="${selected}"]`,
          ) ?? null;
      }
      if (!node.open) {
        // Forward may request this popup while the cart is still above it.
        // Wait for the cart to close instead of covering its active controls.
        if (cart.isOpen) return;
        dismissPending.current = false;
        node.showModal();
        node.scrollTop = 0;
        if (dialogBody.current) dialogBody.current.scrollTop = 0;
        const reader = node.querySelector<HTMLElement>(
          `[data-new-hero-product="${selected}"] [data-product-popup-reading]`,
        );
        if (reader) reader.scrollTop = 0;
        const details = node.querySelector<HTMLElement>(
          `[data-new-hero-product="${selected}"] [data-product-popup-detail-scroll]`,
        );
        if (details) details.scrollTop = 0;
        close.current?.focus({ preventScroll: true });
      } else if (previousProduct.current !== selected && !cart.isOpen) {
        node.scrollTop = 0;
        if (dialogBody.current) dialogBody.current.scrollTop = 0;
        const reader = node.querySelector<HTMLElement>(
          `[data-new-hero-product="${selected}"] [data-product-popup-reading]`,
        );
        if (reader) reader.scrollTop = 0;
        const details = node.querySelector<HTMLElement>(
          `[data-new-hero-product="${selected}"] [data-product-popup-detail-scroll]`,
        );
        if (details) details.scrollTop = 0;
        close.current?.focus({ preventScroll: true });
      }
      previousProduct.current = selected;
    } else if (node.open) {
      node.close();
      returnFocusPending.current = active;
    }
    if (!open) dismissPending.current = false;
    if (!open && active && !cart.isOpen && returnFocusPending.current) {
      // A responsive resize can hide the original hero or gallery trigger.
      // Restore to whichever entry is now visible without moving the page.
      const product = previousProduct.current;
      const focusTarget = [
        trigger.current,
        homeSection
          ? document.querySelector<HTMLAnchorElement>(
              `[data-mobile-hero-learn="${product}"]`,
            )
          : null,
        container.current?.querySelector<HTMLAnchorElement>(
          `[${applicationAttribute}="${product}"]`,
        ),
      ].find((element) => element?.checkVisibility());
      focusTarget?.focus({ preventScroll: true });
      returnFocusPending.current = false;
    }
    if (!active) {
      localEntry.current = false;
      externalEntry.current = null;
      returnFocusPending.current = false;
    }
    // Native dialog autofocus/return must not move the gallery underneath it.
    if (window.scrollY !== top || window.scrollX !== left)
      window.scrollTo({ top, left, behavior: "instant" });
  }, [
    active,
    open,
    selected,
    cart.isOpen,
    applicationAttribute,
    homeSection,
    basePath,
  ]);

  function requestClose() {
    if (
      cart.navigationBusy ||
      cart.isOpen ||
      !dialog.current?.open ||
      dismissPending.current
    )
      return;
    dismissPending.current = true;
    if (localEntry.current) {
      window.history.back();
    } else {
      window.history.replaceState(
        null,
        "",
        navigation || homeSection
          ? heroSevenHref({ view }, basePath)
          : "/new-hero7/matcha",
      );
      if (!navigation) window.dispatchEvent(new Event("hashchange"));
    }
  }
  const dismiss = useDialogDismiss(requestClose);

  return (
    <Container
      ref={(node) => {
        container.current = node;
      }}
      className={`${styles.matcha} ${homeSection ? styles.homeSection : styles.directory} ${revealStyles.scope}`}
      data-mobile-dialog-only={mobileDialogOnly || undefined}
      data-new-hero7-view={homeSection ? undefined : "matcha"}
      data-new-hero-section={homeSection ? "applications" : undefined}
      data-new-hero7-home-applications={homeSection || undefined}
      aria-labelledby={homeSection ? `${id}-heading` : undefined}
    >
      <header className={styles.introduction}>
        <div
          data-page-enter={homeSection ? undefined : "text"}
          data-page-reveal={homeSection ? "rise" : undefined}
        >
          <p className={styles.eyebrow}>
            {homeSection
              ? `02 / ${t("The matcha")}`
              : t("Explore by Application")}
          </p>
          {homeSection ? (
            <h2 id={`${id}-heading`}>
              <ScrambleText
                text={t("Explore by Application")}
                wrap
                periodic
                visibleOnly
              />
            </h2>
          ) : (
            <>
              <h1>
                <ScrambleText
                  text={t("Choose your matcha.")}
                  wrap
                  periodic
                  visibleOnly
                />
              </h1>
              <p className={styles.description}>
                {t("Three matcha. Choose by what you make.")}
              </p>
            </>
          )}
        </div>
        {homeSection ? (
          <p className={styles.description}>
            {t("Three matcha. Choose by what you make.")}
          </p>
        ) : (
          <div className={styles.sampleInvitation}>
            <p>{t("Not sure yet? Try all three.")}</p>
            <HeroSevenLink
              href={
                navigation
                  ? heroSevenHref({ view: "samples" }, basePath)
                  : "/new-hero7/samples"
              }
              data-new-hero7-next="samples"
              {...guard}
            >
              <ScrambleText
                text={t("Start with the Sample Set")}
                interactive
                animateOnMount={false}
                wrap
              />
              <span aria-hidden="true">↗</span>
            </HeroSevenLink>
          </div>
        )}
      </header>
      <nav
        className={styles.applications}
        aria-label={t("Explore by Application")}
        data-new-hero7-application-navigation={!homeSection || undefined}
        data-new-hero7-home-application-navigation={homeSection || undefined}
      >
        {SAMPLE_SET_CONTENTS.map((item, index) => (
          <ApplicationLink
            key={item.key}
            href={
              navigation || homeSection
                ? heroSevenHref({ view, application: item.key }, basePath)
                : `/new-hero7/matcha#new-hero7-${item.key}`
            }
            {...{ [applicationAttribute]: item.key }}
            aria-label={`${t(applications[item.key])} — ${t("Learn more")}`}
            aria-haspopup="dialog"
            aria-expanded={open && selected === item.key}
            aria-controls={`${id}-dialog`}
            aria-disabled={cart.navigationBusy || undefined}
            onClick={(event) => {
              if (cart.navigationBusy) {
                event.preventDefault();
                return;
              }
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              trigger.current = event.currentTarget;
              localEntry.current = true;
              if (!navigation && !homeSection) {
                event.preventDefault();
                window.history.pushState(
                  null,
                  "",
                  `/new-hero7/matcha#new-hero7-${item.key}`,
                );
                window.dispatchEvent(new Event("hashchange"));
              }
            }}
          >
            {!homeSection && (
              <div className={styles.directoryHeading}>
                <span className={styles.index}>0{index + 1}</span>
                <h2>{t(applications[item.key])}</h2>
              </div>
            )}
            <div className={styles.cardImage}>
              <ProductApplicationImage
                handle={item.productHandle}
                collection={canonicalPopup ? "canonical" : "reference"}
              />
            </div>
            <div className={styles.cardBody}>
              {homeSection ? (
                <>
                  <ApplicationHeading className={styles.applicationHeading}>
                    <span>{t(applications[item.key])}</span>
                    <span className={styles.index}>0{index + 1}</span>
                  </ApplicationHeading>
                  <p className={styles.productName}>
                    {t(item.name)} <span>◇ {item.productCode}</span>
                  </p>
                </>
              ) : (
                <div className={styles.directoryIdentity}>
                  <h3>{t(item.name)}</h3>
                  <span>◇ {item.productCode}</span>
                </div>
              )}
              <p className={styles.usage}>
                {t(getProductApplicationImage(item.productHandle)!.usage)}
              </p>
              <span className={styles.learnMore}>
                <ScrambleText
                  text={t("Learn more")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
                <span aria-hidden="true">+</span>
              </span>
            </div>
          </ApplicationLink>
        ))}
      </nav>
      <dialog
        {...dismiss}
        ref={dialog}
        id={`${id}-dialog`}
        className={styles.dialog}
        data-canonical-popup={canonicalPopup || undefined}
        aria-label={t(
          SAMPLE_SET_CONTENTS.find((item) => item.key === selected)?.name ??
            "The matcha",
        )}
        data-new-hero7-product-dialog={!homeSection || undefined}
        data-new-hero7-home-product-dialog={homeSection || undefined}
        data-lenis-prevent
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }}
      >
        <header className={styles.dialogHeader}>
          {canonicalPopup ? (
            <span className={styles.dialogContext}>
              {selected ? t(applications[selected]) : t("The matcha")}
            </span>
          ) : (
            <button
              type="button"
              className={styles.dialogBack}
              disabled={cart.navigationBusy}
              aria-label={t(
                homeSection ? "Back to home" : "Back to applications",
              )}
              data-new-hero7-product-back={!homeSection || undefined}
              data-new-hero7-home-product-back={homeSection || undefined}
              onClick={requestClose}
            >
              <span className={styles.dialogIcon} aria-hidden="true">
                ←
              </span>
              <span className={styles.backFull}>
                <ScrambleText
                  text={t(
                    homeSection ? "Back to home" : "Back to applications",
                  )}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </span>
              <span className={styles.backCompact}>
                <ScrambleText
                  text={t("Back")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </span>
            </button>
          )}
          <button
            ref={close}
            type="button"
            disabled={cart.navigationBusy}
            data-new-hero7-product-close={!homeSection || undefined}
            data-new-hero7-home-product-close={homeSection || undefined}
            onClick={requestClose}
          >
            <ScrambleText
              text={t("Close")}
              interactive
              animateOnMount={false}
              wrap
            />{" "}
            <span className={styles.dialogIcon} aria-hidden="true">
              ×
            </span>
          </button>
        </header>
        <div
          ref={dialogBody}
          className={styles.dialogBody}
          data-new-hero7-product-scroll
        >
          <NewHeroProducts
            presentation="spotlight"
            canonicalPopup={canonicalPopup}
            selectedProduct={selected ?? "ceremonial"}
            idPrefix={productPrefix}
            selectionMemoryKey={selectionMemoryKey}
          />
        </div>
      </dialog>
    </Container>
  );
}
