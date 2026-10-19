"use client";

import Link from "next/link";
import { ShopMaterialImage } from "./shop-material-image";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import styles from "./about-selection-invitation.module.css";

export function AboutSelectionInvitation({
  t,
  busy,
}: {
  t: (source: string) => string;
  busy: boolean;
}) {
  return (
    <section
      className={styles.invitation}
      aria-labelledby="closing-title"
      data-about-selection-invitation
    >
      <div className={styles.heading}>
        <h2 id="closing-title">{t("Find your matcha.")}</h2>
        <Link
          href="/shop"
          className={styles.selectionLink}
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span>{t("Explore the selection")}</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19 19 5M5 5h14v14" />
          </svg>
        </Link>
      </div>
      <ul className={styles.selection} aria-label={t("Matcha")}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <li key={item.key}>
            <div className={styles.material} aria-hidden="true">
              <ShopMaterialImage src={item.image} alt="" />
            </div>
            <div className={styles.productCaption}>
              <span className={styles.number}>{item.productCode}</span>
              <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.foot}>
        <span>ATOMA</span>
        <a href="#about-top">
          {t("About ATOMA")} <span aria-hidden="true">↑</span>
        </a>
      </div>
    </section>
  );
}
