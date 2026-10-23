"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CartButton, useCart } from "./cart-drawer";
import { AboutContent } from "./about-content";
import { ScrambleText } from "./scramble-text";
import { ThemeSwitcher } from "./theme-switcher";
import { DestinationSelector } from "./destination-selector";
import { useOrigins } from "./origins-provider";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import styles from "./home-header.module.css";
import experimentStyles from "./navigation-experiments.module.css";

export type NavigationVariant =
  | "default"
  | "quiet"
  | "index"
  | "focused"
  | "folio"
  | "ribbon"
  | "dial"
  | "edge"
  | "stack"
  | "shutter"
  | "frame"
  | "track";

export type HomeHeaderProps = {
  homeHref?: string;
  onNavigate?: (href: string) => void;
  links?: readonly {
    key: string;
    label: string;
    href: string;
    active?: boolean;
  }[];
  tone?: "dark" | "light";
  onExplore?: () => void;
  exploring?: boolean;
  activePage?: "shop" | "origins" | "about" | "samples";
  originsReturnLabel?: string;
  navigationVariant?: NavigationVariant;
  onOverview?: () => void;
  persistentTheme?: boolean;
  storefrontNavigation?: boolean;
  samplesEntry?: boolean;
  initialMenuOpen?: boolean;
};

export function HomeHeader({
  homeHref = "/",
  onNavigate,
  links,
  tone = "dark",
  onExplore,
  exploring = false,
  activePage,
  originsReturnLabel,
  navigationVariant = "default",
  onOverview,
  persistentTheme = false,
  storefrontNavigation = false,
  samplesEntry = false,
  initialMenuOpen = true,
}: HomeHeaderProps) {
  const { t } = useStorefrontLocale();
  const { busy: cartBusy, navigationBusy } = useCart();
  const siteNavigation = persistentTheme || storefrontNavigation;
  const busy = siteNavigation || links ? navigationBusy : cartBusy;
  const id = useId();
  const { openOrigins } = useOrigins();
  const dialogId = `${id}-about`;
  const headingId = `${id}-about-heading`;
  const indexPanelId = `${id}-index`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef<HTMLDetailsElement>(null);
  const indexTriggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const dismissAbout = useDialogDismiss();
  useDialogScrollLock(open);
  const focusedSelection = navigationVariant === "focused" && exploring;
  const experimental =
    navigationVariant === "edge" ||
    navigationVariant === "stack" ||
    navigationVariant === "shutter" ||
    navigationVariant === "frame" ||
    navigationVariant === "track";
  const hasIndex =
    navigationVariant === "index" ||
    navigationVariant === "folio" ||
    navigationVariant === "ribbon" ||
    navigationVariant === "dial" ||
    (experimental && navigationVariant !== "frame");
  const hasDescriptions =
    navigationVariant === "folio" ||
    navigationVariant === "stack" ||
    navigationVariant === "shutter";
  const hasResponsiveMenu = navigationVariant === "default";
  const showSamples =
    siteNavigation || (samplesEntry && (!onExplore || exploring));
  const customNavigation =
    links !== undefined || homeHref !== "/" || onNavigate !== undefined;

  function closeIndex() {
    if (indexRef.current && indexTriggerRef.current?.getClientRects().length)
      indexRef.current.open = false;
  }

  function focusIndexTrigger() {
    const trigger = indexTriggerRef.current;
    if (trigger?.getClientRects().length)
      trigger.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!hasIndex && !hasResponsiveMenu) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    function syncResponsiveMenu() {
      const index = indexRef.current;
      const trigger = indexTriggerRef.current;
      if (!hasResponsiveMenu || !index || !trigger) return;
      const activeElement = document.activeElement;
      const focusInside = index.contains(activeElement);
      index.open = !mobile.matches;
      if (mobile.matches && focusInside && activeElement !== trigger)
        trigger.focus({ preventScroll: true });
      else if (!mobile.matches && activeElement === trigger)
        index
          .querySelector<HTMLElement>("button, a")
          ?.focus({ preventScroll: true });
    }
    if (hasResponsiveMenu) syncResponsiveMenu();
    else if (indexRef.current) indexRef.current.open = false;
    function outsidePointer(event: PointerEvent) {
      const index = indexRef.current;
      if (index?.open && !index.contains(event.target as Node)) {
        const focusInside =
          hasResponsiveMenu && index.contains(document.activeElement);
        closeIndex();
        if (focusInside) focusIndexTrigger();
      }
    }
    function escape(event: KeyboardEvent) {
      const index = indexRef.current;
      if (
        event.key !== "Escape" ||
        !index?.open ||
        !indexTriggerRef.current?.getClientRects().length
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      closeIndex();
      focusIndexTrigger();
    }
    mobile.addEventListener("change", syncResponsiveMenu);
    document.addEventListener("pointerdown", outsidePointer);
    document.addEventListener("keydown", escape);
    return () => {
      mobile.removeEventListener("change", syncResponsiveMenu);
      document.removeEventListener("pointerdown", outsidePointer);
      document.removeEventListener("keydown", escape);
    };
  }, [hasIndex, hasResponsiveMenu, navigationVariant]);
  const homeLabel = (
    <>
      <span className={styles.index} data-nav-index aria-hidden="true">
        01
      </span>
      <ScrambleText
        text={t(onExplore ? "MATCHA" : "HOME")}
        delay={150}
        interactive
      />
      <span className={styles.sectionMark} aria-hidden="true" />
      {hasDescriptions && (
        <span
          className={styles.linkDescriptor}
          data-nav-description
          aria-hidden="true"
        >
          {t("Explore the material")}
        </span>
      )}
    </>
  );

  function openAbout() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    closeIndex();
    dialog.showModal();
    setOpen(true);
    closeRef.current?.focus({ preventScroll: true });
  }

  const aboutLabel = (
    <>
      <span className={styles.index} data-nav-index aria-hidden="true">
        {navigationVariant === "default" || navigationVariant === "quiet"
          ? showSamples
            ? "04"
            : "03"
          : "03"}
      </span>
      <ScrambleText text={t("ABOUT")} delay={260} interactive />
      <span
        className={siteNavigation ? styles.shopMark : styles.plus}
        aria-hidden="true"
      >
        {siteNavigation ? "↗" : "+"}
      </span>
      {hasDescriptions && (
        <span
          className={styles.linkDescriptor}
          data-nav-description
          aria-hidden="true"
        >
          {t("A closer look at ATOMA")}
        </span>
      )}
    </>
  );

  const mainLinks = links ? (
    <>
      {links.map((link, index) => (
        <Link
          key={link.key}
          className={styles.control}
          data-nav-action={link.key}
          href={link.href}
          prefetch={onNavigate ? false : undefined}
          aria-current={link.active ? "page" : undefined}
          aria-disabled={navigationBusy || undefined}
          onClick={(event) => {
            if (navigationBusy) event.preventDefault();
            else closeIndex();
          }}
          onNavigate={(event) => {
            if (navigationBusy || onNavigate) event.preventDefault();
            if (!navigationBusy) onNavigate?.(link.href);
          }}
        >
          <span className={styles.index} data-nav-index aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <ScrambleText
            text={t(link.label)}
            delay={150 + index * 35}
            interactive
          />
          <span className={styles.shopMark} aria-hidden="true">
            ↗
          </span>
        </Link>
      ))}
    </>
  ) : (
    <>
      {onExplore ? (
        <button
          className={styles.control}
          data-nav-action="matcha"
          type="button"
          aria-label={t("Explore matcha")}
          aria-expanded={exploring}
          onClick={() => {
            closeIndex();
            focusIndexTrigger();
            onExplore();
          }}
        >
          {homeLabel}
        </button>
      ) : (
        <Link
          className={styles.control}
          data-nav-action="matcha"
          href={homeHref}
          aria-label={t("Home")}
          onClick={closeIndex}
        >
          {homeLabel}
        </Link>
      )}
      <Link
        className={styles.control}
        data-nav-action="shop"
        href={siteNavigation ? "/wholesale" : "/shop"}
        aria-current={activePage === "shop" ? "page" : undefined}
        onClick={closeIndex}
      >
        <span className={styles.index} data-nav-index aria-hidden="true">
          02
        </span>
        <ScrambleText
          text={t(siteNavigation ? "Wholesale" : "SHOP")}
          delay={220}
          interactive
        />
        <span className={styles.shopMark} aria-hidden="true">
          ↗
        </span>
        {hasDescriptions && (
          <span
            className={styles.linkDescriptor}
            data-nav-description
            aria-hidden="true"
          >
            {t("Choose your matcha")}
          </span>
        )}
      </Link>
      {showSamples && (
        <Link
          className={styles.control}
          data-nav-action="samples"
          href="/samples"
          aria-current={activePage === "samples" ? "page" : undefined}
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
            else closeIndex();
          }}
        >
          <span className={styles.index} data-nav-index aria-hidden="true">
            03
          </span>
          <ScrambleText text={t("SAMPLES")} delay={240} interactive />
          <span className={styles.shopMark} aria-hidden="true">
            ↗
          </span>
        </Link>
      )}
      {siteNavigation ? (
        <Link
          className={styles.control}
          data-nav-action="about"
          href="/about"
          aria-label={t("About ATOMA")}
          aria-current={activePage === "about" ? "page" : undefined}
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
            else closeIndex();
          }}
        >
          {aboutLabel}
        </Link>
      ) : (
        <button
          ref={triggerRef}
          className={styles.control}
          data-nav-action="about"
          type="button"
          aria-label={t("About ATOMA")}
          aria-haspopup="dialog"
          aria-controls={dialogId}
          aria-expanded={open}
          onClick={openAbout}
        >
          {aboutLabel}
        </button>
      )}
      {(navigationVariant === "default" || navigationVariant === "quiet") && (
        <Link
          className={styles.control}
          data-nav-action="origins"
          href="/origins"
          aria-current={activePage === "origins" ? "page" : undefined}
          onNavigate={(event) => {
            if (activePage === "origins") return;
            event.preventDefault();
            closeIndex();
            focusIndexTrigger();
            openOrigins({
              tone,
              returnLabel:
                originsReturnLabel ??
                (activePage === "about"
                  ? "Back to About"
                  : activePage === "samples"
                    ? "Back to samples"
                    : undefined),
            });
          }}
        >
          <span className={styles.index} data-nav-index aria-hidden="true">
            {showSamples ? "05" : "04"}
          </span>
          <ScrambleText text={t("ORIGINS")} delay={290} interactive />
          <span className={styles.shopMark} aria-hidden="true">
            ↗
          </span>
        </Link>
      )}
    </>
  );

  return (
    <header
      className={`${styles.header}${experimental ? ` ${experimentStyles.experiment}` : ""}`}
      data-brand-part="header"
      data-storefront-navigation={siteNavigation || undefined}
      data-tone={tone}
      data-navigation-variant={navigationVariant}
      data-exploring={exploring}
    >
      <Link
        className={styles.brand}
        data-nav-brand
        data-brand-part="wordmark"
        href={homeHref}
        prefetch={onNavigate ? false : undefined}
        aria-label={t("ATOMA home")}
        aria-disabled={
          customNavigation ? navigationBusy || undefined : undefined
        }
        onClick={
          customNavigation
            ? (event) => {
                if (navigationBusy) event.preventDefault();
                else closeIndex();
              }
            : undefined
        }
        onNavigate={
          customNavigation
            ? (event) => {
                if (navigationBusy || onNavigate) event.preventDefault();
                if (!navigationBusy) onNavigate?.(homeHref);
              }
            : undefined
        }
      >
        <ScrambleText text="ATOMA" interactive />
      </Link>
      <span className={styles.bridge} data-nav-bridge aria-hidden="true" />
      <nav
        className={styles.navigation}
        data-nav-controls
        data-brand-part="primary-navigation"
        aria-label={t("Main navigation")}
        onClick={(event) => {
          if (!indexRef.current?.contains(event.target as Node)) closeIndex();
        }}
      >
        {focusedSelection ? (
          onOverview ? (
            <button
              className={styles.control}
              type="button"
              aria-label={t("Back to overview")}
              onClick={onOverview}
            >
              <ScrambleText text={t("OVERVIEW")} interactive />
            </button>
          ) : (
            <Link
              className={styles.control}
              href={homeHref}
              aria-label={t("Back to overview")}
            >
              <ScrambleText text={t("OVERVIEW")} interactive />
            </Link>
          )
        ) : hasIndex || hasResponsiveMenu ? (
          <details
            ref={indexRef}
            className={
              hasResponsiveMenu ? styles.responsiveMenu : styles.indexMenu
            }
            open={(hasResponsiveMenu && initialMenuOpen) || undefined}
            data-navigation-index
            onBlur={(event) => {
              // Safari can blur the summary to no focused element during a
              // tap. Keep the destination visible until its click arrives.
              if (
                event.relatedTarget instanceof Node &&
                !event.currentTarget.contains(event.relatedTarget)
              )
                closeIndex();
            }}
          >
            <summary
              ref={indexTriggerRef}
              data-nav-summary
              className={
                hasResponsiveMenu
                  ? styles.responsiveSummary
                  : styles.indexSummary
              }
              aria-label={t(hasResponsiveMenu ? "Menu" : "Index")}
              aria-controls={indexPanelId}
            >
              <ScrambleText
                text={t(hasResponsiveMenu ? "MENU" : "INDEX")}
                interactive
              />
              <span
                className={styles.indexToggle}
                data-nav-toggle
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <div
              className={
                hasResponsiveMenu ? styles.responsivePanel : styles.indexPanel
              }
              id={indexPanelId}
              data-navigation-index-panel
            >
              {navigationVariant === "folio" && (
                <div className={styles.directoryHeading} aria-hidden="true">
                  <span>ATOMA</span>
                  <span>{t("DIRECTORY")}</span>
                </div>
              )}
              {mainLinks}
              {siteNavigation && (
                <div className={styles.destination} data-nav-preferences>
                  <DestinationSelector compact />
                  {persistentTheme && (
                    <ThemeSwitcher label="Dark mode in menu" />
                  )}
                </div>
              )}
            </div>
          </details>
        ) : (
          mainLinks
        )}
        <CartButton tone={tone} className={styles.cart} />
      </nav>

      <dialog
        {...dismissAbout}
        ref={dialogRef}
        className={styles.dialog}
        data-tone={tone}
        id={dialogId}
        aria-labelledby={headingId}
        onClose={() => {
          setOpen(false);
          const trigger = indexTriggerRef.current?.getClientRects().length
            ? indexTriggerRef.current
            : triggerRef.current;
          trigger?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          // Close is this dialog's only interactive element.
          if (event.key === "Tab") {
            event.preventDefault();
            closeRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        <div className={styles.dialogHeader}>
          <span>
            <ScrambleText text={t("ABOUT ATOMA")} periodic />
          </span>
          <button
            ref={closeRef}
            className={styles.close}
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            <ScrambleText text={t("CLOSE")} interactive />
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <AboutContent headingId={headingId} />
      </dialog>
    </header>
  );
}
