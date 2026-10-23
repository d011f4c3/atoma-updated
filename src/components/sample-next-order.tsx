"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { Catalog } from "@/lib/catalog-types";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import {
  oneKilogramProductUrl,
  resolveOneKilogramVariant,
} from "@/lib/sample-journey";
import { useSavedMatcha } from "./use-saved-matcha";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useSampleTastingSession } from "./sample-tasting-session-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./sample-next-order.module.css";

export function SampleNextOrder({
  catalog,
  loading,
  disabled = false,
}: {
  catalog: Catalog | null;
  loading: boolean;
  disabled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const saved = useSavedMatcha();
  const { nextOrderChoice: choice, setNextOrderChoice: setChoice } =
    useSampleTastingSession();
  const [feedback, setFeedback] = useState<
    "cleared" | "save-error" | "clear-error" | null
  >(null);
  const id = useId();
  const saveButton = useRef<HTMLButtonElement>(null);
  const selected =
    SAMPLE_SET_CONTENTS.find(
      (item) => item.productHandle === (choice ?? saved.productHandle),
    ) ?? SAMPLE_SET_CONTENTS.find((item) => item.key === "ceremonial");
  const savedChoice = SAMPLE_SET_CONTENTS.find(
    (item) => item.productHandle === saved.productHandle,
  );
  if (!selected) return null;
  const href = oneKilogramProductUrl(selected.productHandle);
  if (!href) return null;
  const product = catalog?.products.find(
    (item) => item.handle === selected.productHandle,
  );
  const variant = resolveOneKilogramVariant(product);
  const availability = loading
    ? "Checking 1 kg availability…"
    : catalog?.status !== "ready"
      ? "Check current availability on the product page."
      : !variant
        ? "1 kg is not currently listed for this matcha."
        : variant.available
          ? "1 kg is currently available."
          : "1 kg is currently unavailable.";

  return (
    <div
      className={styles.nextOrder}
      data-sample-next-order
      data-page-reveal="rise"
    >
      <div className={styles.introduction}>
        <span className={styles.progression}>
          {t("Try 20 g → Choose 1 kg → Reorder")}
        </span>
        <h2 id="samples-next" tabIndex={-1}>
          {t("Ready for 1 kg?")}
        </h2>
        <p className={styles.purpose}>
          {t("Choose the matcha you want to serve.")}
        </p>
        <details className={styles.guidance}>
          <summary>
            <ScrambleText
              text={t("After your samples")}
              interactive
              animateOnMount={false}
              wrap
            />
            <span aria-hidden="true" />
          </summary>
          <ol>
            <li>
              {t(
                "Prepare each sample in the drink or recipe you intend to serve.",
              )}
            </li>
            <li>
              {t(
                "Keep the recipe consistent while comparing flavour and texture.",
              )}
            </li>
            <li>
              {t(
                "Review the 1 kg format, then use your saved choice when it is time to reorder.",
              )}
            </li>
          </ol>
          <div className={styles.offer} data-sample-first-order-offer>
            <p>
              {t(
                "¥4,500 credit toward your first eligible wholesale order of 1 kg or more after buying the Sample Set.",
              )}
            </p>
            <p>
              {t(
                "Approximately US$29. The credit is set in JPY and converted by Shopify at checkout.",
              )}
            </p>
            <p>
              {t(
                "Your credit code is included in your Sample Set order confirmation email. Keep it for when you are ready to order 1 kg or more.",
              )}
            </p>
            <p>{t("Use the same email as your Sample Set order.")}</p>
            <p>
              {t(
                "Once per customer, on one order. Excludes subscriptions and cannot be combined with other discounts.",
              )}
            </p>
            <p>{t("Shopify checks eligibility at checkout.")}</p>
          </div>
        </details>
      </div>
      <div className={styles.selection}>
        <fieldset className={styles.choices} disabled={disabled}>
          <legend>{t("Choose your next matcha")}</legend>
          {SAMPLE_SET_CONTENTS.map((item) => (
            <label className={styles.choice} key={item.key}>
              <input
                type="radio"
                name={`${id}-matcha`}
                value={item.productHandle}
                checked={selected.productHandle === item.productHandle}
                onChange={() => {
                  setChoice(item.productHandle);
                  setFeedback(null);
                }}
              />
              <span className={styles.choiceName}>
                <ScrambleText
                  text={t(item.name.replace(/ Matcha$/, ""))}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </span>
              <span className={styles.application}>{t(item.application)}</span>
            </label>
          ))}
        </fieldset>
        <p className={styles.availability} aria-live="polite">
          {t(selected.name)} · {t(availability)}
        </p>
        <div className={styles.actions}>
          <Link
            href={href}
            className={styles.action}
            aria-disabled={disabled || undefined}
            onClick={(event) => {
              if (disabled) event.preventDefault();
            }}
            onNavigate={(event) => {
              if (disabled) event.preventDefault();
            }}
            data-sample-one-kilogram
          >
            <span>
              {t("View 1 kg of {name}", { name: t(selected.name) })
                .split(/(1 kg)/)
                .map((part, index) =>
                  part === "1 kg" ? (
                    part
                  ) : (
                    <ScrambleText
                      key={index}
                      text={part}
                      interactive
                      animateOnMount={false}
                      wrap
                    />
                  ),
                )}
            </span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 19 19 5M5 5h14v14" />
            </svg>
          </Link>
          <button
            type="button"
            className={styles.save}
            ref={saveButton}
            disabled={disabled || !saved.ready}
            onClick={() => {
              setFeedback(
                saved.saveMatcha(selected.productHandle) ? null : "save-error",
              );
            }}
          >
            <ScrambleText
              text={t("Save for next time")}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
        </div>
        <div className={styles.memory}>
          <p className={styles.deviceNote}>
            {t("Saves your tea choice on this device only.")}
          </p>
          <div className={styles.savedStatus} role="status">
            {feedback === "save-error" ? (
              <p>{t("Your choice could not be saved on this device.")}</p>
            ) : feedback === "clear-error" ? (
              <p>
                {t("Your saved choice could not be cleared on this device.")}
              </p>
            ) : savedChoice ? (
              <p>
                {t("Saved on this device: {matcha}", {
                  matcha: t(savedChoice.name),
                })}
              </p>
            ) : feedback === "cleared" ? (
              <p>{t("Saved choice cleared.")}</p>
            ) : null}
          </div>
          {savedChoice && (
            <button
              type="button"
              className={styles.clear}
              disabled={disabled || !saved.ready}
              onClick={() => {
                const cleared = saved.clearMatcha();
                setFeedback(cleared ? "cleared" : "clear-error");
                if (cleared) {
                  setChoice(selected.productHandle);
                  saveButton.current?.focus({ preventScroll: true });
                }
              }}
            >
              <ScrambleText
                text={t("Clear saved choice")}
                interactive
                animateOnMount={false}
                wrap
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
