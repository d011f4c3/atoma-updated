"use client";

import { useId } from "react";
import { money } from "@/lib/product-selection";
import { SHOPIFY_CUSTOMER_ACCOUNT_URL } from "@/lib/customer-account";
import type { ProductSelectionModel } from "./use-product-selection";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./purchase-options.module.css";

/** Choices exist only when the server has admitted a current Shopify allocation. */
export function PurchaseOptions({
  model,
  disabled = false,
  settled = false,
}: {
  model: ProductSelectionModel;
  disabled?: boolean;
  settled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const name = useId();
  const plans = model.variant?.sellingPlans ?? [];
  const selected = model.selectedSellingPlanKey;
  return (
    <fieldset
      className={styles.options}
      disabled={disabled || model.refreshing}
    >
      <legend>
        <ScrambleText
          text={t("Purchase")}
          periodic={!settled}
          animateOnMount={!settled}
          wrap
        />
      </legend>
      <div className={styles.choices}>
        <label
          className={styles.choice}
          data-selected={selected === null}
          data-unavailable={!model.variant?.available}
        >
          <input
            type="radio"
            name={name}
            checked={selected === null}
            disabled={!model.variant?.available}
            onChange={() => model.selectSellingPlan(null)}
            aria-label={t("One-time purchase")}
          />
          <span>
            <ScrambleText
              text={t("One-time")}
              periodic={!settled}
              animateOnMount={!settled}
              wrap
            />
          </span>
          <span className={styles.mark} aria-hidden="true">
            {selected === null ? "●" : "○"}
          </span>
        </label>
        {plans.length ? (
          plans.map((plan) => (
            <label
              key={plan.id}
              className={styles.choice}
              data-selected={selected === plan.id}
              data-unavailable={!plan.available}
            >
              <input
                type="radio"
                name={name}
                checked={selected === plan.id}
                disabled={!plan.available}
                onChange={() => model.selectSellingPlan(plan.id)}
                aria-label={`${t("Subscribe")} · ${plan.name}`}
              />
              <span>
                <ScrambleText
                  text={t("Subscribe")}
                  periodic={!settled}
                  animateOnMount={!settled}
                  wrap
                />
                <small>{t("Every 4 weeks")}</small>
                {plans.length > 1 && <small>{plan.name}</small>}
              </span>
              <span className={styles.mark} aria-hidden="true">
                {selected === plan.id ? "●" : "○"}
              </span>
            </label>
          ))
        ) : (
          <label className={styles.choice} data-unavailable="true">
            <input
              type="radio"
              name={name}
              disabled
              checked={false}
              readOnly
              aria-label={t("Subscribe — unavailable")}
            />
            <span>
              <ScrambleText
                text={t("Subscribe")}
                periodic={!settled}
                animateOnMount={!settled}
                wrap
              />
              <small>{t("Not available yet")}</small>
            </span>
            <span className={styles.mark} aria-hidden="true">
              ○
            </span>
          </label>
        )}
      </div>
      {model.selectedSellingPlan && !model.refreshing && (
        <>
          <p className={styles.terms} aria-label={t("Subscription terms")}>
            {money(
              model.selectedSellingPlan.priceMinor,
              model.selectedSellingPlan.currency,
            )}{" "}
            / {t("Per delivery")}. {t("Billed and delivered every 4 weeks.")}
          </p>
          <div className={styles.management}>
            <a
              href={SHOPIFY_CUSTOMER_ACCOUNT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Manage subscriptions (opens in a new tab)")}
              aria-disabled={disabled || undefined}
              onClick={(event) => {
                if (disabled) event.preventDefault();
              }}
            >
              {t("Manage subscriptions")} <span aria-hidden="true">↗</span>
            </a>
            <span>{t("Sign in, then choose Subscriptions")}</span>
          </div>
        </>
      )}
      {model.refreshing && (
        <p className={styles.terms} role="status">
          {t("Updating prices…")}
        </p>
      )}
      {selected && !model.selectedSellingPlan && !model.refreshing && (
        <p className={styles.terms} role="status">
          {t("Selected subscription unavailable")}
        </p>
      )}
    </fieldset>
  );
}
