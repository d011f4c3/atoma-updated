"use client";

import {
  HeroSevenLink as Link,
  useHeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { heroSevenHref } from "@/lib/new-hero-seven-view";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { NewHeroApplicationHero } from "./new-hero-application-hero";
import { MobileHomeHero } from "./mobile-home-hero";
import { MobileHomeSections } from "./mobile-home-sections";
import { NewHeroSections } from "./new-hero-sections";
import { NewHeroSevenMatcha as HomeApplicationSection } from "./new-hero-seven-matcha";
import { NewHeroSevenOrderProcess } from "./new-hero-seven-order-process";
import { NewHeroSevenSampleExplorer } from "./new-hero-seven-sample-explorer";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ThemeSwitcher } from "./theme-switcher";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import heroStyles from "./new-hero-five.module.css";
import sectionStyles from "./new-hero.module.css";
import styles from "./new-hero-seven.module.css";
import motionStyles from "./homepage-motion.module.css";

const root = "/new-hero7";
export const newHeroSevenSiteNavigation = [
  { key: "matcha", label: "MATCHA", href: root },
  { key: "shop", label: "Wholesale", href: "/shop" },
  { key: "samples", label: "SAMPLES", href: "/samples" },
  { key: "origins", label: "ORIGINS", href: "/origins" },
  { key: "about", label: "ABOUT", href: "/about" },
] as const;

function useNavigationGuard() {
  const { navigationBusy } = useCart();
  return {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;
}

export function NewHeroSevenHeader() {
  const navigationState = useHeroSevenNavigation();
  const { navigationBusy } = useCart();
  const { tone } = useStorefrontTheme();
  return (
    <div
      data-new-hero7-header
      aria-busy={navigationBusy || undefined}
      onClickCapture={(event) => {
        if (
          navigationBusy &&
          event.target instanceof Element &&
          event.target.closest("a[href]")
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <HomeHeader
        tone={tone}
        persistentTheme
        initialMenuOpen={false}
        homeHref={navigationState?.basePath ?? root}
        onNavigate={navigationState?.navigate}
      />
    </div>
  );
}

export function NewHeroSevenFrame({
  children,
  year,
}: {
  children: ReactNode;
  year: number;
}) {
  const pathname = usePathname();
  const { tone } = useStorefrontTheme();
  const { t } = useStorefrontLocale();
  const guard = useNavigationGuard();
  const home = pathname === root || pathname === `${root}/`;
  const selection =
    pathname === `${root}/matcha` || pathname === `${root}/samples`;
  if (home) return children;
  return (
    <div
      className={`${heroStyles.page} ${styles.frame}`}
      data-new-hero7
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <div className={styles.experienceStage} data-home="false">
        <div className={styles.childHeader}>
          <NewHeroSevenHeader />
        </div>
        <main
          className={styles.main}
          data-selection-view={selection || undefined}
        >
          {children}
        </main>
      </div>
      <footer className={styles.footer} data-new-hero7-footer>
        <Link href={root} className={styles.footerBrand} {...guard}>
          ATOMA <span>© {year}</span>
        </Link>
        <nav aria-label={t("Main navigation")}>
          {newHeroSevenSiteNavigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              {...guard}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <ThemeSwitcher label="Dark mode in footer" />
      </footer>
    </div>
  );
}

export function NewHeroSevenHome({
  contained = false,
  motionPaused = false,
  onHeroReady,
}: {
  contained?: boolean;
  motionPaused?: boolean;
  onHeroReady?: () => void;
}) {
  const navigationState = useHeroSevenNavigation();
  const basePath = navigationState?.basePath ?? root;
  const router = useRouter();
  const { navigationBusy } = useCart();
  const [readingSample, setReadingSample] = useState<ProductKey | null>(null);
  const home = useRef<HTMLDivElement>(null);
  const motion = basePath === "/";
  const applicationImageSrc = motion
    ? "/images/hero/matcha-applications-cutout-v3.webp"
    : undefined;
  usePageReveals(home, motion && !motionPaused);
  const destination = (view: "matcha" | "samples") =>
    basePath === "/" && view === "samples"
      ? "/samples"
      : navigationState
        ? heroSevenHref({ view }, basePath)
        : `${root}/${view}`;
  const application = (key: "ceremonial" | "barista" | "culinary") =>
    navigationState
      ? heroSevenHref({ view: "matcha", application: key }, basePath)
      : `${root}/matcha#new-hero7-${key}`;
  return (
    <div
      ref={home}
      className={
        motion ? `${revealStyles.scope} ${motionStyles.scope}` : undefined
      }
      data-new-hero7-view="home"
    >
      <div className={motion ? styles.desktopHomeHero : undefined}>
        <NewHeroApplicationHero
          idPrefix="new-hero7"
          header={contained ? false : <NewHeroSevenHeader />}
          motion={motion}
          onReady={onHeroReady}
          applicationImageSrc={applicationImageSrc}
          destinations={{
            samples: destination("samples"),
            applications: destination("matcha"),
            products: {
              ceremonial: application("ceremonial"),
              barista: application("barista"),
              culinary: application("culinary"),
            },
          }}
        />
      </div>
      {motion && <MobileHomeHero onReady={onHeroReady} />}
      <div className={styles.homeSections} data-new-hero7-home-sections>
        <div className={sectionStyles.main}>
          <NewHeroSections
            idPrefix="new-hero7-home"
            motion={motion}
            samplesFirst
            sampleContents={
              motion ? (
                <NewHeroSevenSampleExplorer
                  homeSection
                  selected={readingSample}
                  onSelect={setReadingSample}
                  onOrder={() => {
                    if (!navigationBusy) router.push("/samples");
                  }}
                  disabled={navigationBusy}
                />
              ) : undefined
            }
            originPhotoPair={motion}
            originImageSizes={
              motion
                ? "(max-width: 760px) 100vw, 46vw"
                : "(max-width: 1600px) 100vw, 1600px"
            }
            applicationsSection={
              <HomeApplicationSection homeSection mobileDialogOnly={motion} />
            }
            supplySection={
              <NewHeroSevenOrderProcess
                idPrefix="new-hero7-home"
                applicationImageSrc={applicationImageSrc}
                destinations={{
                  samples: destination("samples"),
                  shop: destination("matcha"),
                }}
              />
            }
            destinations={{
              applications: destination("matcha"),
              samples: destination("samples"),
              origins: "/origins",
              shop: destination("matcha"),
            }}
          />
        </div>
      </div>
      {motion && <MobileHomeSections />}
    </div>
  );
}

export { NewHeroSevenMatcha } from "./new-hero-seven-matcha";
