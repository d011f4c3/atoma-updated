"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { getProductContent } from "@/lib/product-content";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { heroSevenHref } from "@/lib/new-hero-seven-view";
import { useCart } from "./cart-drawer";
import {
  HeroSevenLink,
  useHeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { useDialogDismiss } from "./use-dialog-dismiss";
import { ShopMaterialImage } from "./shop-material-image";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./new-hero-seven-sample-explorer.module.css";

/** Reading a sample never changes the contents or purchase state of the set. */
export function NewHeroSevenSampleExplorer({
  selected,
  onSelect,
  onOrder,
  disabled,
}: {
  selected: ProductKey | null;
  onSelect: (key: ProductKey | null) => void;
  onOrder: () => void;
  disabled: boolean;
}) {
  const { locale, t } = useStorefrontLocale();
  const cart = useCart();
  const navigation = useHeroSevenNavigation();
  const active = !navigation || navigation.state.view === "samples";
  const open = active && selected !== null;
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const buttons = useRef<Partial<Record<ProductKey, HTMLButtonElement | null>>>(
    {},
  );
  const previousProduct = useRef<ProductKey | null>(null);
  const returnTo = useRef<ProductKey | null>(null);
  const returnFocus = useRef(false);
  const orderRequested = useRef(false);
  const item = SAMPLE_SET_CONTENTS.find((entry) => entry.key === selected);
  const content = item
    ? getProductContent(
        { title: item.name, handle: item.productHandle, description: "" },
        locale,
      )
    : null;

  // Cart owns body locking; the reader only owns the root, so nested dismissal
  // cannot restore stale body overflow while another modal is still open.
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
      returnTo.current = selected;
      returnFocus.current = false;
      if (!node.open && !cart.isOpen) {
        node.showModal();
        node.scrollTop = 0;
        closeButton.current?.focus({ preventScroll: true });
      } else if (
        node.open &&
        previousProduct.current !== selected &&
        !cart.isOpen
      ) {
        closeButton.current?.focus({ preventScroll: true });
      }
      previousProduct.current = selected;
    } else if (node.open) {
      node.close();
      returnFocus.current = active && !orderRequested.current;
    }
    if (!active) returnFocus.current = false;
    if (active && !open && !cart.isOpen && returnFocus.current) {
      if (returnTo.current)
        buttons.current[returnTo.current]?.focus({ preventScroll: true });
      returnFocus.current = false;
    }
    if (active && (window.scrollY !== top || window.scrollX !== left))
      window.scrollTo({ top, left, behavior: "instant" });
    if (active && !open && !cart.isOpen && orderRequested.current) {
      orderRequested.current = false;
      onOrder();
    }
  }, [active, open, selected, cart.isOpen, onOrder]);

  function close() {
    if (disabled || cart.isOpen || !dialog.current?.open) return;
    onSelect(null);
  }
  const dismiss = useDialogDismiss(close);

  return (
    <section
      className={styles.root}
      aria-labelledby={`${id}-intro`}
      data-new-hero7-sample-explorer
    >
      <div className={styles.summary}>
        <h2 id={`${id}-intro`}>{t("All three included.")}</h2>
        <span>{t("60 g total")}</span>
      </div>
      <ul className={styles.choices}>
        {SAMPLE_SET_CONTENTS.map((sample) => (
          <li key={sample.key}>
            <button
              type="button"
              ref={(node) => {
                buttons.current[sample.key] = node;
              }}
              className={styles.choice}
              aria-haspopup="dialog"
              aria-expanded={open && selected === sample.key}
              aria-controls={`${id}-profile`}
              disabled={disabled}
              data-new-hero7-sample-tab={sample.key}
              onClick={() => onSelect(sample.key)}
            >
              <span className={styles.swatch}>
                <ShopMaterialImage src={sample.image} alt="" />
              </span>
              <span className={styles.identity}>
                <span className={styles.name}>{t(sample.name)}</span>
                <span className={styles.application}>
                  {t(sample.application)} <span aria-hidden="true">·</span>{" "}
                  <span className={styles.code}>◇ {sample.productCode}</span>
                </span>
              </span>
              <span className={styles.weight}>{sample.grams} g</span>
              <span className={styles.read}>
                <ScrambleText
                  text={t("Read profile")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
                <span aria-hidden="true">↗</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        id={`${id}-profile`}
        className={styles.dialog}
        aria-labelledby={item ? `${id}-title` : undefined}
        data-new-hero7-sample-dialog
        data-new-hero7-sample-profile={item?.key}
        data-lenis-prevent
        {...dismiss}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        {item && content && (
          <>
            <header className={styles.profileHeader}>
              <button
                type="button"
                onClick={close}
                disabled={disabled || cart.isOpen}
                className={styles.back}
                data-new-hero7-sample-back
              >
                <span aria-hidden="true">←</span>
                <span>
                  <ScrambleText
                    text={t("Back to the Sample Set")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </span>
              </button>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                disabled={disabled || cart.isOpen}
                className={styles.close}
                data-new-hero7-sample-close
                aria-label={t("Close details")}
              >
                ×
              </button>
            </header>
            <div className={styles.dialogContent}>
              <div className={styles.reader} key={item.key}>
                <header className={styles.profileIdentity}>
                  <p className={styles.code}>
                    ◇ {item.productCode} · {item.grams} g
                  </p>
                  <h2 id={`${id}-title`}>{content.name}</h2>
                </header>
                <div className={styles.profileImage}>
                  <ShopMaterialImage src={item.image} alt={t(item.imageAlt)} />
                </div>
                <div className={styles.profileContent}>
                  <p className={styles.description}>{content.summary}</p>
                  <dl className={styles.properties}>
                    {content.materialProfile.map((property) => (
                      <div key={property.label}>
                        <dt>{property.label}</dt>
                        <dd>{property.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <details
                    className={styles.preparation}
                    data-new-hero7-sample-preparation
                  >
                    <summary>
                      <ScrambleText
                        text={t("Preparation")}
                        interactive
                        animateOnMount={false}
                        wrap
                      />
                      <span aria-hidden="true" />
                    </summary>
                    <p>{content.preparation}</p>
                    <h3>{t("What to look for")}</h3>
                    <ul>
                      {content.lookFor.map((observation) => (
                        <li key={observation}>{observation}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => {
                    if (disabled || cart.isOpen) return;
                    orderRequested.current = true;
                    onSelect(null);
                  }}
                  disabled={disabled || cart.isOpen}
                  className={styles.order}
                  data-new-hero7-sample-order
                >
                  <ScrambleText
                    text={t("Order the Sample Set")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">→</span>
                </button>
                <HeroSevenLink
                  href={
                    navigation
                      ? heroSevenHref(
                          { view: "matcha", application: item.key },
                          navigation.basePath,
                        )
                      : `/new-hero7/matcha#new-hero7-${item.key}`
                  }
                  className={styles.productLink}
                  aria-disabled={disabled || cart.isOpen || undefined}
                  data-new-hero7-sample-product={item.key}
                  onClick={(event) => {
                    if (disabled || cart.isOpen) event.preventDefault();
                  }}
                >
                  <span>
                    <ScrambleText
                      text={t("Choose a larger format")}
                      interactive
                      animateOnMount={false}
                      wrap
                    />
                    <small>{content.name}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </HeroSevenLink>
              </div>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
