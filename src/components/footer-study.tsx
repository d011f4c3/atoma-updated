"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SiteFooter, type FooterDirection } from "./site-footer";
import { SpecimenHero } from "./specimen-hero";
import { usePageScroll } from "./smooth-scroll";
import styles from "./footer-study.module.css";

const directions = [
  {
    value: "index",
    name: "01 — Index",
    description:
      "A quiet brand signature beside three numbered navigation columns.",
  },
  {
    value: "colophon",
    name: "02 — Colophon",
    description:
      "An open typographic finish, with a large closing mark and pared-back links.",
  },
  {
    value: "compact",
    name: "03 — Compact",
    description:
      "A low, restrained band that keeps the product experience in the foreground.",
  },
  {
    value: "rail",
    name: "04 — Rail",
    description:
      "Compact proportions with an indexed navigation rail and a separate information line.",
  },
  {
    value: "directory",
    name: "05 — Directory",
    description:
      "A small brand signature beside stacked navigation and a dedicated information column.",
  },
] as const;

export function FooterStudy({ year }: { year: number }) {
  const [direction, setDirection] = useState<FooterDirection>("index");
  const [tone, setTone] = useState<"light" | "dark">("light");
  const { busy } = useCart();
  const scrollTo = usePageScroll();
  const id = useId();
  const topRef = useRef<HTMLHeadingElement>(null);
  const toolbarRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const selected = directions.find((item) => item.value === direction)!;

  function moveTo(target: HTMLElement | null) {
    if (busy || !target) return;
    target.focus({ preventScroll: true });
    const top =
      target === topRef.current
        ? 0
        : window.scrollY +
          target.getBoundingClientRect().top -
          (toolbarRef.current?.getBoundingClientRect().height ?? 0) -
          12;
    scrollTo(top);
  }

  return (
    <div
      className={styles.study}
      data-footer-study
      data-footer-direction={direction}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header ref={toolbarRef} className={styles.toolbar}>
        <h1 id="footer-study-top" ref={topRef} tabIndex={-1}>
          Footer study
        </h1>
        <div className={styles.field}>
          <label htmlFor={`${id}-layout`}>Footer layout</label>
          <select
            id={`${id}-layout`}
            value={direction}
            disabled={busy}
            onChange={(event) =>
              setDirection(event.target.value as FooterDirection)
            }
          >
            {directions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-tone`}>Study appearance</label>
          <select
            id={`${id}-tone`}
            value={tone}
            disabled={busy}
            onChange={(event) =>
              setTone(event.target.value as "light" | "dark")
            }
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => moveTo(footerRef.current)}
        >
          View footer <span aria-hidden="true">↓</span>
        </button>
        <Link
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.homeLabel}>Current homepage</span>
          <span className={styles.mobileHomeLabel}>Home</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <p className={styles.note}>{selected.description}</p>
      </header>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(next) => {
            if (!busy) setTone(next);
          }}
          materialObject="silver-bag"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          originPreviewVariant="panorama"
          shopPreviewVariant="refined"
        />
      </div>
      <SiteFooter
        direction={direction}
        tone={tone}
        year={year}
        footerRef={footerRef}
        onBackToTop={() => moveTo(topRef.current)}
      />
    </div>
  );
}
