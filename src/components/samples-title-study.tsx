"use client";

import Link from "next/link";
import { useState } from "react";
import { sampleTitleTreatments } from "@/lib/sample-title-treatments";
import { SamplePanelTitle } from "./sample-panel-title";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useCart } from "./cart-drawer";
import styles from "./samples-title-study.module.css";

export function SamplesTitleStudy() {
  const theme = useStorefrontTheme();
  const { locale } = useStorefrontLocale();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  return (
    <main
      className={styles.study}
      data-sample-title-study
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <Link
          href="/samples-page-study"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          ← Page study
        </Link>
        <span>ATOMA / Title study</span>
        <label>
          Appearance{" "}
          <select
            aria-label="Study appearance"
            value={tone}
            disabled={busy}
            onChange={(event) =>
              setTone(event.target.value as "light" | "dark")
            }
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </label>
      </header>
      <div className={styles.content}>
        <header className={styles.introduction} lang="en">
          <div>
            <p>Sample Set / Panel titles</p>
            <h1>A name. Six treatments.</h1>
          </div>
          <p>
            Compare the title at purchase and compact sizes. Preview any
            treatment in the page before choosing.
          </p>
        </header>
        <div className={styles.grid}>
          {sampleTitleTreatments.map((item, index) => (
            <article
              className={styles.option}
              data-title-option={item.value}
              key={item.value}
              aria-label={item.name}
            >
              <div className={styles.optionLabel} lang="en">
                <span>
                  {String(index).padStart(2, "0")} / {item.name}
                </span>
                <span>{index === 0 ? "Reference" : "Study"}</span>
              </div>
              <div className={styles.preview} lang={locale}>
                <SamplePanelTitle treatment={item.value} />
              </div>
              <div className={styles.compactLabel} lang="en">
                Compact panel
              </div>
              <div className={styles.compact} lang={locale}>
                <SamplePanelTitle treatment={item.value} compact />
                <span aria-hidden="true">↗</span>
              </div>
              <p className={styles.note} lang="en">
                {item.note}
              </p>
              <Link
                className={styles.previewLink}
                href={`/samples-page-study?layout=glance&title=${item.value}`}
                aria-label={`Preview ${item.name} in page`}
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
                lang="en"
              >
                Preview in page <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
