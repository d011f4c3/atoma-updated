"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { translate, type Locale } from "@/lib/i18n";
import {
  SHOP_CATEGORIES,
  matchesShopCategory,
  type ShopCategory,
} from "@/lib/shop-category-filter";
import styles from "./shop-category-filters.module.css";

export type ShopFilterDirection = "index" | "tiles" | "facets";

const uses: Record<ShopCategory, string> = {
  all: "Explore the range",
  ceremonial: "Tea with water",
  barista: "For lattes",
  culinary: "For recipes",
};

type CategoryChoicesProps = {
  products: CatalogProduct[];
  category: ShopCategory;
  direction: ShopFilterDirection;
  loading: boolean;
  disabled: boolean;
  onChange: (category: ShopCategory) => void;
  allChoice: RefObject<HTMLButtonElement | null>;
  onSelect?: () => void;
  locale: Locale;
};

function CategoryChoices({
  products,
  category,
  direction,
  loading,
  disabled,
  onChange,
  allChoice,
  onSelect,
  locale,
}: CategoryChoicesProps) {
  return SHOP_CATEGORIES.map((item) => {
    const count = products.filter((product) =>
      matchesShopCategory(product.handle, item.value),
    ).length;
    return (
      <button
        key={item.value}
        ref={item.value === "all" ? allChoice : undefined}
        type="button"
        className={styles.choice}
        data-shop-category={item.value}
        aria-pressed={category === item.value}
        disabled={disabled}
        onClick={() => {
          onChange(item.value);
          onSelect?.();
        }}
      >
        <span className={styles.choiceName}>
          {translate(locale, item.label)}
        </span>
        <span
          className={styles.count}
          aria-label={
            loading
              ? translate(locale, "Count loading")
              : translate(locale, "{count} matcha", { count })
          }
        >
          {loading ? "—" : String(count).padStart(2, "0")}
        </span>
        {direction === "tiles" && (
          <span className={styles.use}>
            {translate(locale, uses[item.value])}
          </span>
        )}
        {direction === "facets" && (
          <span className={styles.check} aria-hidden="true">
            {category === item.value ? "✓" : null}
          </span>
        )}
      </button>
    );
  });
}

function CategoryDropdown({
  id,
  label,
  disabled,
  trigger,
  choices,
}: {
  id: string;
  label: string;
  disabled: boolean;
  trigger: RefObject<HTMLButtonElement | null>;
  choices: CategoryChoicesProps;
}) {
  const control = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [disclosure, setDisclosure] = useState({ open: false, disabled });
  // A commerce lock also resets the disclosure, so unlocking cannot reopen it.
  if (disclosure.disabled !== disabled) {
    setDisclosure({ open: false, disabled });
  }
  const open = disclosure.open && !disabled;

  function close(restoreFocus = false) {
    setDisclosure({ open: false, disabled });
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !control.current?.contains(event.target)
      ) {
        setDisclosure({ open: false, disabled });
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        setDisclosure({ open: false, disabled });
        trigger.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, disabled, trigger]);

  useLayoutEffect(() => {
    if (!open) return;
    function placePanel() {
      const anchor = control.current;
      const popup = panel.current;
      if (!anchor || !popup) return;
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 20;
      const above = rect.top - 20;
      const useAbove = below < popup.scrollHeight + 2 && above > below;
      anchor.dataset.side = useAbove ? "above" : "below";
      popup.style.maxHeight = `${Math.max(48, useAbove ? above : below)}px`;
    }
    placePanel();
    window.addEventListener("resize", placePanel);
    return () => window.removeEventListener("resize", placePanel);
  }, [open]);

  return (
    <div
      ref={control}
      className={styles.facetControl}
      data-side="below"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.facetTrigger}
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        data-shop-category-trigger
        onClick={() => setDisclosure({ open: !open, disabled })}
      >
        <span>
          <span className={styles.facetLabel}>
            {translate(choices.locale, "Category")}
          </span>
          {label}
        </span>
        <svg
          className={styles.chevron}
          viewBox="0 0 16 16"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        ref={panel}
        id={id}
        className={styles.facetPanel}
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <div
          className={styles.choices}
          role="group"
          aria-label={translate(choices.locale, "Matcha category")}
        >
          <CategoryChoices {...choices} onSelect={() => close(true)} />
        </div>
      </div>
    </div>
  );
}

export function ShopCategoryFilters({
  products,
  category,
  direction,
  showFuture,
  loading,
  disabled,
  onChange,
  locale = "en",
}: {
  products: CatalogProduct[];
  category: ShopCategory;
  direction: ShopFilterDirection;
  showFuture: boolean;
  loading: boolean;
  disabled: boolean;
  onChange: (category: ShopCategory) => void;
  locale?: Locale;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const allChoice = useRef<HTMLButtonElement>(null);
  const selected = SHOP_CATEGORIES.find((item) => item.value === category)!;
  const choices = {
    products,
    category,
    direction,
    loading,
    disabled,
    onChange,
    allChoice,
    locale,
  };

  const future = showFuture && (
    <div className={styles.futureFields} data-shop-future-fields>
      {["Taste", "Region"].map((name) => (
        <div
          className={styles.futureField}
          data-shop-future-filter={name.toLowerCase()}
          key={name}
        >
          <span>{translate(locale, name)}</span>
          <span>{translate(locale, "Coming soon")}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section
      className={styles.filters}
      data-shop-filters={direction}
      aria-labelledby={`${id}-label`}
      lang={locale}
    >
      <div className={styles.heading}>
        <h2 id={`${id}-label`}>
          {translate(
            locale,
            showFuture ? "Refine the collection" : "Browse by category",
          )}
        </h2>
        {category !== "all" && (
          <button
            type="button"
            className={styles.clear}
            data-shop-clear-category
            disabled={disabled}
            onClick={() => {
              (direction === "facets" ? trigger : allChoice).current?.focus({
                preventScroll: true,
              });
              onChange("all");
            }}
          >
            {translate(locale, "Clear")} <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {direction === "facets" ? (
        <div className={styles.facetRow}>
          <CategoryDropdown
            id={`${id}-choices`}
            label={translate(locale, selected.label)}
            disabled={disabled}
            trigger={trigger}
            choices={choices}
          />
          {future}
        </div>
      ) : (
        <>
          <div
            className={styles.choices}
            role="group"
            aria-label={translate(locale, "Matcha category")}
          >
            <CategoryChoices {...choices} />
          </div>
          {future}
        </>
      )}
    </section>
  );
}
