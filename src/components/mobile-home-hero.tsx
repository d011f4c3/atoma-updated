"use client";

import Image from "next/image";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import {
  HeroSevenLink,
  useHeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./mobile-home-hero.module.css";

// Windows in the approved transparent 2172 × 724 composition. Unequal crops
// keep the bowl, glass and wagashi plate whole without borrowing a neighbour.
const previews = {
  ceremonial: { label: "Tea service", x: 60, y: 140, width: 740, height: 584 },
  barista: { label: "Lattes", x: 800, y: 0, width: 550, height: 724 },
  culinary: { label: "Recipes", x: 1370, y: 240, width: 802, height: 484 },
} as const;

export function MobileHomeHero({
  motionPaused = false,
  onReady,
}: {
  motionPaused?: boolean;
  onReady?: () => void;
}) {
  const { t, locale } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const navigation = useHeroSevenNavigation();
  const { navigationBusy } = useCart();
  const [selected, setSelected] = useState<ProductKey>(
    navigation?.state.application ?? "barista",
  );
  const [failed, setFailed] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const restoredApplication =
    navigation?.state.view === "home"
      ? navigation.state.application
      : undefined;
  if (restoredApplication && restoredApplication !== selected) {
    // History can reopen a different product after a local preview choice.
    setSelected(restoredApplication);
  }
  const item = SAMPLE_SET_CONTENTS.find((product) => product.key === selected)!;
  const index = SAMPLE_SET_CONTENTS.indexOf(item);
  const preview = previews[selected];
  const title = t("Matcha for the way you make it.");
  // Keep the Japanese phrase intact instead of balancing a line through 使い方.
  const titleBreak = locale === "ja" ? title.indexOf("、") + 1 : 0;
  const crop = {
    "--crop-ratio": `${preview.width} / ${preview.height}`,
    "--crop-aspect": preview.width / preview.height,
    "--image-width": `${(2172 / preview.width) * 100}%`,
    "--image-left": `${(-preview.x / preview.width) * 100}%`,
    "--image-top": `${(-preview.y / preview.height) * 100}%`,
  } as CSSProperties;
  const guard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: { preventDefault(): void }) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;

  function changeWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (navigationBusy) return;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % SAMPLE_SET_CONTENTS.length
        : event.key === "ArrowLeft"
          ? (index + SAMPLE_SET_CONTENTS.length - 1) %
            SAMPLE_SET_CONTENTS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? SAMPLE_SET_CONTENTS.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(SAMPLE_SET_CONTENTS[next]!.key);
    tabs.current[next]?.focus({ preventScroll: true });
  }

  return (
    <section
      className={styles.hero}
      data-mobile-home-hero
      data-tone={tone}
      aria-labelledby={`${id}-heading`}
    >
      <div className={styles.introduction} data-page-enter="hero">
        <h1 id={`${id}-heading`}>
          {titleBreak ? (
            <>
              {title.slice(0, titleBreak)}
              <br />
              {title.slice(titleBreak)}
            </>
          ) : (
            title
          )}
        </h1>
        <p className={styles.description}>
          {t(
            "Authentic Japanese matcha selected for tea service, lattes and recipes.",
          )}
        </p>
      </div>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label={t("Explore by Application")}
      >
        {SAMPLE_SET_CONTENTS.map((product, position) => (
          <button
            key={product.key}
            ref={(node) => {
              tabs.current[position] = node;
            }}
            type="button"
            role="tab"
            id={`${id}-${product.key}`}
            aria-selected={selected === product.key}
            aria-controls={`${id}-preview`}
            tabIndex={selected === product.key ? 0 : -1}
            disabled={navigationBusy}
            data-mobile-hero-choice={product.key}
            onClick={() => setSelected(product.key)}
            onKeyDown={changeWithKeyboard}
          >
            <ScrambleText
              text={t(previews[product.key].label)}
              interactive
              animateOnMount={false}
              wrap
              paused={motionPaused}
            />
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-preview`}
        aria-labelledby={`${id}-${selected}`}
        className={styles.preview}
        data-mobile-hero-preview={selected}
      >
        <figure className={styles.figure}>
          <div className={styles.visual} data-page-enter="visual">
            <span className={styles.index} aria-hidden="true">
              0{index + 1}
            </span>
            {failed ? (
              <p className={styles.fallback} role="status">
                {t("Application image unavailable.")}
              </p>
            ) : (
              <div key={selected} className={styles.crop} style={crop}>
                <Image
                  src="/images/hero/matcha-applications-cutout-v3.webp"
                  alt={t(preview.label)}
                  width={2172}
                  height={724}
                  sizes="760px"
                  loading="eager"
                  fetchPriority="high"
                  unoptimized
                  draggable={false}
                  onLoad={onReady}
                  onError={() => {
                    setFailed(true);
                    onReady?.();
                  }}
                />
              </div>
            )}
          </div>
          <figcaption>
            <HeroSevenLink
              className={styles.learn}
              href={`/?application=${selected}`}
              data-mobile-hero-learn={selected}
              aria-haspopup="dialog"
              {...guard}
            >
              <span className={styles.identity}>
                <span>{t(item.name)}</span>
                <span className={styles.code}>◇ {item.productCode}</span>
              </span>
              <span className={styles.learnLabel}>
                <ScrambleText
                  text={t("Learn more")}
                  interactive
                  animateOnMount={false}
                  wrap
                  paused={motionPaused}
                />
                <span aria-hidden="true">+</span>
              </span>
            </HeroSevenLink>
          </figcaption>
        </figure>
      </div>

      <div className={styles.actions}>
        <HeroSevenLink
          href="/?view=samples"
          className={styles.primary}
          data-mobile-hero-samples
          {...guard}
        >
          <ScrambleText
            text={t("Start with the Sample Set")}
            interactive
            animateOnMount={false}
            wrap
            paused={motionPaused}
          />
          <span aria-hidden="true">↗</span>
        </HeroSevenLink>
        <HeroSevenLink
          href="/?view=matcha"
          className={styles.secondary}
          data-mobile-hero-explore
          {...guard}
        >
          <ScrambleText
            text={t("Explore by Application")}
            interactive
            animateOnMount={false}
            wrap
            paused={motionPaused}
          />
          <span aria-hidden="true">↗</span>
        </HeroSevenLink>
      </div>
    </section>
  );
}
