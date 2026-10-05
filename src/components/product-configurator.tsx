"use client";

import type { ProductCodePlacement } from "@/lib/product-display-index";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getProductContent } from "@/lib/product-content";
import type { ProductContent } from "@/lib/product-content";
import { productName } from "@/lib/product-name";
import { HomeHeader } from "./home-header";
import { CatalogPanel } from "./catalog-panel";
import { HomepageProductInformation } from "./homepage-product-information";
import type { OriginPreviewVariant } from "./origin-preview";
import { ShopPreview, type ShopPreviewVariant } from "./shop-preview";
import {
  ShopExplorationPanel,
  type ShopExplorationLayout,
} from "./shop-exploration-panel";
import {
  VisualProductSelectors,
  VisualSectionSelectors,
  type VisualSelectorVariant,
  type VisualSectionVariant,
} from "./visual-product-selectors";
import { useProductSelection } from "./use-product-selection";
import { useOrigins } from "./origins-provider";
import { useCart } from "./cart-drawer";
import { ProductInformation } from "./product-information";
import { ScrambleText } from "./scramble-text";
import { AddToCartButton } from "./add-to-cart-button";
import { PurchaseOptions } from "./purchase-options";
import { VesselScene } from "./vessel-scene";
import { BagScene } from "./bag-scene";
import { PowderScene } from "./powder-scene";
import { LabelCard } from "./label-card";
import { SilverBagScene } from "./silver-bag-scene";
import { ReferenceEditor } from "./reference-editor";
import styles from "./product-configurator.module.css";

type BuilderStep = 0 | 1;
type HomepageInformationView = "overview" | "specifications" | "origins";
type ShoppingMode = "builder" | "standard" | HomepageInformationView;

export type ProductLabelSnapshot = {
  title: string;
  application: string;
  format: string;
  quantity: number;
  reference: string;
  profile?: Pick<ProductContent, "materialProfile" | "profileKind">;
};

const homepageViews = [
  { value: "overview", label: "Overview" },
  { value: "specifications", label: "Specifications" },
  { value: "origins", label: "Origins" },
  { value: "builder", label: "Shop" },
] as const;

const mobileViewportQuery = "(max-width: 760px)";

function subscribeMobileViewport(onChange: () => void) {
  const viewport = window.matchMedia(mobileViewportQuery);
  viewport.addEventListener("change", onChange);
  return () => viewport.removeEventListener("change", onChange);
}

function getMobileViewport() {
  return window.matchMedia(mobileViewportQuery).matches;
}

export function ProductConfigurator({
  packaging = "label",
  tone = "light",
  embedded = false,
  active = true,
  onClose,
  onSceneReady,
  onLabelChange,
  entryFromTray = false,
  enterPowder = true,
  entryPending = false,
  entryLoading = false,
  entrySettled = true,
  selectorVariant = "current",
  sectionSelectorVariant = "current",
  selectorPlacement = "right",
  initialProductHandle,
  originPreviewVariant = "current",
  shopPreviewVariant = "current",
  shopExplorationLayout,
  productCodePlacement,
  initialView = "overview",
  materialObject = "powder",
}: {
  packaging?: "label" | "bag" | "canister";
  tone?: "dark" | "light";
  embedded?: boolean;
  active?: boolean;
  onClose?: () => void;
  onSceneReady?: () => void;
  onLabelChange?: (label: ProductLabelSnapshot) => void;
  entryFromTray?: boolean;
  enterPowder?: boolean;
  entryPending?: boolean;
  entryLoading?: boolean;
  entrySettled?: boolean;
  selectorVariant?: "current" | VisualSelectorVariant;
  sectionSelectorVariant?: "current" | VisualSectionVariant;
  selectorPlacement?: "left" | "right";
  initialProductHandle?: string;
  originPreviewVariant?: "current" | OriginPreviewVariant;
  shopPreviewVariant?: "current" | "refined" | ShopPreviewVariant;
  shopExplorationLayout?: ShopExplorationLayout;
  productCodePlacement?: ProductCodePlacement;
  initialView?: HomepageInformationView | "builder";
  materialObject?: "powder" | "silver-bag";
}) {
  const silverBag = materialObject === "silver-bag";
  const PackagingScene = packaging === "bag" ? BagScene : VesselScene;
  const Container = embedded ? "div" : "main";
  const model = useProductSelection(initialProductHandle);
  const { setSelectedMatcha } = useOrigins();
  const cart = useCart();
  const mobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewport,
    () => false,
  );
  const mobileEmbedded = embedded && mobileViewport;
  const [hasEntered, setEntered] = useState(false);
  const entered = embedded ? active : hasEntered;
  const [mode, setMode] = useState<ShoppingMode>(
    embedded ? initialView : "standard",
  );
  const [step, setStep] = useState<BuilderStep>(0);
  const builderStep = embedded ? 1 : step;
  const [openedVessel, setOpenedVessel] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [editingReference, setEditingReference] = useState(false);
  const referenceEditorOpen = editingReference && !mobileEmbedded && !silverBag;
  const referenceTriggerRef = useRef<HTMLElement | null>(null);
  const referenceTriggerKind = useRef<string | undefined>(undefined);
  const restoreReferenceFocus = useRef(false);
  const [labelHasQuantity, setLabelHasQuantity] = useState(
    embedded && initialView === "builder",
  );
  const entryTriggerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  const materialTouchRef = useRef<{
    identifier: number;
    x: number;
    y: number;
  } | null>(null);
  const content = getProductContent(model.product);
  useEffect(() => {
    if (!entered || !model.product) return;
    setSelectedMatcha(content.name);
    return () => setSelectedMatcha(null);
  }, [entered, model.product, content.name, setSelectedMatcha]);
  const products =
    model.catalog?.status === "ready" ? model.catalog.products : [];
  const index = Math.max(
    0,
    model.catalog?.products.findIndex(
      (product) => product.id === model.product?.id,
    ) ?? 0,
  );
  const format =
    model.variant?.title === "Default Title"
      ? "Standard"
      : (model.variant?.title ?? "MATCHA");
  const materialStage =
    packaging !== "label" && entered && (mode === "standard" || builderStep > 0)
      ? "vessel"
      : "powder";
  const prepareSelection = entered || embedded;
  const labelVisible =
    packaging === "label" &&
    !silverBag &&
    !mobileEmbedded &&
    entered &&
    entrySettled &&
    Boolean(model.product) &&
    (!embedded || mode === "builder");
  const showSilverBag = silverBag && mode === "builder";
  const labelExpanded = labelVisible && referenceEditorOpen;
  const labelFormatSelected =
    labelHasQuantity || mode === "standard" || builderStep > 0;
  const materialBrowsing =
    embedded &&
    entered &&
    packaging === "label" &&
    !referenceEditorOpen &&
    (mobileEmbedded || mode !== "builder" || builderStep === 0);
  const materialSentence =
    content.materialSummary.split(/(?<=[.!?])\s/)[0] ?? "";

  const bagLabel = useMemo<ProductLabelSnapshot>(
    () => ({
      title: content.name,
      application: content.labelUse,
      format: model.variant ? format : "",
      quantity: model.variant ? model.quantity : 0,
      reference: labelText,
      profile: {
        materialProfile: content.materialProfile,
        profileKind: content.profileKind,
      },
    }),
    [
      content.name,
      content.labelUse,
      content.materialProfile,
      content.profileKind,
      model.variant,
      model.quantity,
      format,
      labelText,
    ],
  );

  useEffect(() => {
    if (model.product) onLabelChange?.(bagLabel);
  }, [model.product, bagLabel, onLabelChange]);

  function canSwipeMaterial() {
    return (
      materialBrowsing &&
      entrySettled &&
      !entryPending &&
      !cart.busy &&
      !model.loading &&
      Boolean(model.product) &&
      products.length > 1 &&
      window.matchMedia("(max-width: 760px)").matches
    );
  }

  function browseMaterial(direction: -1 | 1) {
    const next = products[index + direction];
    if (!next || entryPending || !entrySettled || cart.busy) return;
    model.selectProduct(next.id);
    setOpenedVessel(false);
  }

  function enter(nextMode: ShoppingMode = mode) {
    if (!entered)
      entryTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    setMode(nextMode);
    if (nextMode === "standard") setLabelHasQuantity(true);
    setEntered(true);
  }
  function close() {
    if (cart.busy) return;
    if (referenceEditorOpen) {
      finishReference();
      return;
    }
    if (embedded) {
      setEditingReference(false);
      setStep(0);
      setMode("overview");
      setOpenedVessel(false);
      onClose?.();
      return;
    }
    setEntered(false);
    setOpenedVessel(false);
    requestAnimationFrame(() => {
      (entryTriggerRef.current ?? triggerRef.current)?.focus({
        preventScroll: true,
      });
      overviewRef.current?.scrollIntoView({ block: "start" });
    });
  }
  function goToStep(next: BuilderStep) {
    if (cart.busy) return;
    setStep(next);
    if (next > 0) setLabelHasQuantity(true);
    setOpenedVessel(false);
  }
  function editReference() {
    if (cart.busy) return;
    referenceTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    referenceTriggerKind.current =
      referenceTriggerRef.current?.dataset.referenceTrigger;
    setEditingReference(true);
  }
  function finishReference() {
    restoreReferenceFocus.current = true;
    setEditingReference(false);
  }
  useEffect(() => {
    if (!entered || referenceEditorOpen) return;
    const frame = requestAnimationFrame(() => {
      if (restoreReferenceFocus.current) {
        restoreReferenceFocus.current = false;
        const trigger = referenceTriggerRef.current?.isConnected
          ? referenceTriggerRef.current
          : Array.from(
              panelRef.current
                ?.closest("[data-editing-reference]")
                ?.querySelectorAll<HTMLElement>("[data-reference-trigger]") ??
                [],
            ).find(
              (element) =>
                element.dataset.referenceTrigger ===
                referenceTriggerKind.current,
            );
        if (trigger && trigger.getClientRects().length > 0) {
          trigger.focus({ preventScroll: true });
          if (embedded)
            trigger.scrollIntoView({ block: "nearest", inline: "nearest" });
          return;
        }
      }
      const mobileFlow = mobileEmbedded;
      if (embedded && !mobileFlow) scrollRef.current?.scrollTo({ top: 0 });
      // Keep section navigation focused while its contents and material settle.
      // Moving focus and scrolling here interrupts the in-place transition.
      if (
        silverBag &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement.closest('[aria-label="Shopping mode"]') &&
        panelRef.current?.contains(document.activeElement)
      )
        return;
      // A native menu must retain focus while arrow keys change its value.
      // Button and CTA navigation still move focus into the selected view.
      if (
        document.activeElement instanceof HTMLSelectElement &&
        document.activeElement.getAttribute("aria-label") ===
          "Information view" &&
        panelRef.current?.contains(document.activeElement)
      )
        return;
      const heading =
        (model.loading
          ? panelRef.current?.querySelector<HTMLElement>(
              "[data-homepage-product-information]",
            )
          : null) ??
        Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            entryLoading ? 'button[aria-label="Back to overview"]' : "h2",
          ) ?? [],
        ).find((element) => element.getClientRects().length > 0);
      heading?.focus({ preventScroll: true });
      if (mobileFlow && !silverBag)
        heading?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    entered,
    mode,
    step,
    entryLoading,
    referenceEditorOpen,
    embedded,
    mobileEmbedded,
    model.loading,
    silverBag,
  ]);

  const referenceAction = silverBag ? null : (
    <button
      type="button"
      className={styles.referenceAction}
      onClick={editReference}
      data-reference-trigger="panel"
      disabled={cart.busy}
    >
      <span>
        <ScrambleText
          text={labelText.trim() ? "Edit reference" : "Add reference"}
          interactive
        />
        <small>
          <ScrambleText text="Personalize your label" periodic wrap />
        </small>
      </span>
      <span aria-hidden="true">↗</span>
    </button>
  );

  const placeSelectorLeft =
    embedded && selectorPlacement === "left" && selectorVariant !== "current";
  const visualProductSelector =
    embedded && products.length > 0 && selectorVariant !== "current" ? (
      <VisualProductSelectors
        products={products}
        selectedId={model.product?.id}
        variant={selectorVariant}
        productCodePlacement={productCodePlacement}
        tone={tone}
        disabled={
          entryPending || !entrySettled || cart.busy || referenceEditorOpen
        }
        onSelect={(id) => {
          if (id !== model.product?.id) {
            model.selectProduct(id);
            setOpenedVessel(false);
          }
        }}
      />
    ) : null;

  return (
    <Container
      className={styles.experience}
      data-embedded={embedded}
      data-tone={tone}
      data-exploring={entered}
      data-mode={mode}
      data-selector-variant={selectorVariant}
      data-section-selector-variant={sectionSelectorVariant}
      data-selector-placement={placeSelectorLeft ? "left" : "right"}
      data-shop-preview-variant={shopPreviewVariant}
      data-origin-preview-variant={originPreviewVariant}
      data-pose={index}
      data-multiple={model.quantity > 1}
      data-step={referenceEditorOpen ? 2 : builderStep}
      data-editing-reference={referenceEditorOpen}
      data-stage={materialStage}
      data-packaging={packaging}
      data-material-object={materialObject}
      data-bag-visible={showSilverBag}
      data-label-visible={labelVisible}
      data-label-expanded={labelExpanded}
      data-material-browsing={materialBrowsing}
      data-entry-settled={entrySettled}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          entered &&
          !document.querySelector("dialog[open]")
        )
          close();
      }}
    >
      {!embedded && (
        <HomeHeader tone={tone} onExplore={() => enter()} exploring={entered} />
      )}
      <section
        ref={overviewRef}
        className={styles.workspace}
        data-brand-part="selection-workspace"
        aria-label="Matcha selection"
      >
        {placeSelectorLeft && (
          <div className={styles.stageSelectors} data-stage-selectors>
            {visualProductSelector}
          </div>
        )}
        <div
          className={styles.stageArea}
          key="material-stage"
          data-brand-part="material-stage"
        >
          <div
            className={styles.stageHeading}
            data-brand-part="material-heading"
          >
            <ScrambleText text="ATOMA / MATCHA" delay={150} periodic wrap />
            <span>
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(model.catalog?.products.length ?? 3).padStart(2, "0")}
            </span>
          </div>
          <div
            className={styles.object}
            data-product-object
            data-label-bounds
            data-material-swipe={materialBrowsing || undefined}
            onTouchStart={(event) => {
              materialTouchRef.current = null;
              if (
                !canSwipeMaterial() ||
                event.touches.length !== 1 ||
                (event.target instanceof Element &&
                  event.target.closest(
                    silverBag
                      ? 'button, a[href], input, select, textarea, [role="button"], [data-label-card]'
                      : 'button, a[href], input, select, textarea, [role="button"], [role="group"]',
                  ))
              )
                return;
              const touch = event.touches[0];
              if (touch)
                materialTouchRef.current = {
                  identifier: touch.identifier,
                  x: touch.clientX,
                  y: touch.clientY,
                };
            }}
            onTouchMove={(event) => {
              const start = materialTouchRef.current;
              if (!start) return;
              const touch = Array.from(event.touches).find(
                (item) => item.identifier === start.identifier,
              );
              if (!touch || event.touches.length !== 1) {
                materialTouchRef.current = null;
                return;
              }
              const horizontal = Math.abs(touch.clientX - start.x);
              const vertical = Math.abs(touch.clientY - start.y);
              if (vertical > 12 && vertical > horizontal)
                materialTouchRef.current = null;
            }}
            onTouchEnd={(event) => {
              const start = materialTouchRef.current;
              materialTouchRef.current = null;
              if (!start || !canSwipeMaterial()) return;
              const touch = Array.from(event.changedTouches).find(
                (item) => item.identifier === start.identifier,
              );
              if (!touch) return;
              const horizontal = touch.clientX - start.x;
              const vertical = touch.clientY - start.y;
              if (
                Math.abs(horizontal) >= 45 &&
                Math.abs(horizontal) > Math.abs(vertical) * 1.3
              )
                browseMaterial(horizontal < 0 ? 1 : -1);
            }}
            onTouchCancel={() => {
              materialTouchRef.current = null;
            }}
          >
            {silverBag ? (
              <>
                <div className={styles.silverPowderLayer}>
                  <PowderScene
                    title={prepareSelection ? content.name : "Matcha"}
                    selectionIndex={prepareSelection ? index : 0}
                    enterPowder={enterPowder}
                    tone={tone}
                    onReady={onSceneReady}
                  />
                </div>
                <div
                  className={styles.silverBagLayer}
                  data-product-bag
                  aria-hidden={!showSilverBag}
                  inert={!showSilverBag}
                >
                  <SilverBagScene
                    {...bagLabel}
                    tone={tone}
                    interactive={false}
                  />
                </div>
              </>
            ) : packaging === "label" ? (
              <>
                <div className={styles.powderLayer}>
                  <PowderScene
                    title={prepareSelection ? content.name : "Matcha"}
                    selectionIndex={prepareSelection ? index : 0}
                    entryFromTray={entryFromTray}
                    enterPowder={enterPowder}
                    tone={tone}
                    onReady={onSceneReady}
                  />
                </div>
                <div
                  className={styles.cardDock}
                  inert={!labelVisible}
                  aria-hidden={!labelVisible}
                >
                  <LabelCard
                    title={content.name}
                    application={content.labelUse}
                    format={labelFormatSelected ? format : ""}
                    quantity={labelFormatSelected ? model.quantity : 0}
                    reference={labelText}
                    profile={embedded ? content : undefined}
                    visible={labelVisible}
                    expanded={labelExpanded}
                    tone={tone}
                    onEditReference={editReference}
                  />
                </div>
              </>
            ) : (
              <PackagingScene
                title={prepareSelection ? content.name : "MATCHA"}
                format={prepareSelection ? format : ""}
                quantity={prepareSelection ? model.quantity : 1}
                selectionIndex={prepareSelection ? index : 0}
                open={openedVessel}
                stage={materialStage}
                labelText={labelText}
                application={content.labelUse}
                inspectingLabel={entered && referenceEditorOpen}
                tone={tone}
                onReady={onSceneReady}
                {...(packaging === "bag" ? { entryFromTray, enterPowder } : {})}
              />
            )}
          </div>
          {materialBrowsing && products.length > 0 && (
            <div className={styles.mobileMaterialControls}>
              <div className={styles.materialNavigation}>
                <button
                  type="button"
                  aria-label="Previous matcha"
                  disabled={
                    index === 0 || entryPending || !entrySettled || cart.busy
                  }
                  onClick={() => browseMaterial(-1)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <span>
                  <ScrambleText text="Swipe to explore" periodic wrap />
                </span>
                <button
                  type="button"
                  aria-label="Next matcha"
                  disabled={
                    index === products.length - 1 ||
                    entryPending ||
                    !entrySettled ||
                    cart.busy
                  }
                  onClick={() => browseMaterial(1)}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <span
                className={styles.materialAnnouncement}
                aria-live="polite"
                aria-atomic="true"
              >
                {content.name}
              </span>
            </div>
          )}
          <div
            className={styles.objectCaption}
            data-brand-part="material-caption"
          >
            <span>
              <ScrambleText
                text={entered ? content.name : "MATCHA / IN ITS MATERIAL FORM"}
                periodic
                wrap
              />
            </span>
            {materialStage === "vessel" && (
              <button
                type="button"
                aria-pressed={openedVessel}
                onClick={() => setOpenedVessel((value) => !value)}
              >
                <ScrambleText
                  text={`${openedVessel ? "CLOSE" : "OPEN"} ${packaging === "bag" ? "BAG" : "VESSEL"}`}
                  interactive
                />
                <span aria-hidden="true">{openedVessel ? "−" : "+"}</span>
              </button>
            )}
            {labelVisible && !silverBag && (
              <button
                type="button"
                data-reference-trigger="caption"
                disabled={cart.busy}
                aria-label={
                  referenceEditorOpen
                    ? "Done editing reference"
                    : labelText.trim()
                      ? "Edit label reference"
                      : "Add label reference"
                }
                onClick={() => {
                  if (referenceEditorOpen) finishReference();
                  else editReference();
                }}
              >
                <span className={styles.labelCaption}>
                  <ScrambleText
                    text={
                      referenceEditorOpen
                        ? "DONE EDITING"
                        : labelText.trim()
                          ? "EDIT REFERENCE"
                          : "ADD REFERENCE"
                    }
                    interactive
                  />
                </span>
                <span aria-hidden="true">{labelExpanded ? "−" : "↗"}</span>
              </button>
            )}
          </div>
        </div>
        <div className={styles.entry} hidden={entered || embedded}>
          <span className={styles.eyebrow}>
            <ScrambleText
              text="MATERIAL / INFORMATION / SELECTION"
              delay={200}
              periodic
              wrap
            />
          </span>
          <h1>
            A closer look
            <br />
            at matcha.
          </h1>
          <p>
            <ScrambleText text="Understand the material." periodic wrap />
            <br />
            <ScrambleText text="Make it your selection." periodic wrap />
          </p>
          <button
            ref={triggerRef}
            type="button"
            className={styles.enter}
            onClick={() => enter("standard")}
            aria-controls="matcha-workspace"
            aria-expanded={entered}
          >
            <ScrambleText text="SELECT MATCHA" interactive />
            <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            className={styles.direct}
            onClick={() => enter("builder")}
          >
            <ScrambleText
              text="Explore with the interactive builder"
              interactive
              wrap
            />{" "}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        {entered && (
          <div
            ref={panelRef}
            id="matcha-workspace"
            className={styles.controlArea}
            data-selection-controls
            data-brand-part="selection-controls"
          >
            <div className={embedded ? styles.homepageControls : undefined}>
              {embedded &&
                products.length > 0 &&
                !placeSelectorLeft &&
                (selectorVariant !== "current" ? (
                  visualProductSelector
                ) : (
                  <div
                    className={styles.typeChoices}
                    role="group"
                    aria-label="Matcha to explore"
                  >
                    {products.map((product, position) => {
                      const details = getProductContent(product);
                      const name = productName(product.title);
                      const grade = name.replace(/\s+matcha$/i, "") || name;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          className={styles.typeChoice}
                          data-homepage-product-choice={product.id}
                          aria-label={`Select ${name}`}
                          aria-pressed={product.id === model.product?.id}
                          disabled={
                            entryPending ||
                            !entrySettled ||
                            cart.busy ||
                            referenceEditorOpen
                          }
                          onClick={() => {
                            if (product.id !== model.product?.id) {
                              model.selectProduct(product.id);
                              setOpenedVessel(false);
                            }
                          }}
                        >
                          <span className={styles.typeIndex} aria-hidden="true">
                            {String(position + 1).padStart(2, "0")}
                          </span>
                          <span className={styles.typeName}>
                            <ScrambleText text={grade} interactive wrap />
                            <small>{details.application}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              <div className={styles.modeHeader}>
                {embedded && sectionSelectorVariant !== "current" ? (
                  <VisualSectionSelectors
                    variant={sectionSelectorVariant}
                    active={mode}
                    disabled={entryPending || cart.busy}
                    onSelect={(view) => {
                      setEditingReference(false);
                      setMode(view);
                    }}
                  />
                ) : (
                  <div
                    className={styles.modeSwitch}
                    role="group"
                    aria-label="Shopping mode"
                  >
                    {embedded ? (
                      homepageViews.map((view) => (
                        <button
                          key={view.value}
                          type="button"
                          aria-pressed={mode === view.value}
                          disabled={entryPending || cart.busy}
                          onClick={() => {
                            setEditingReference(false);
                            setMode(view.value);
                          }}
                        >
                          <ScrambleText text={view.label} interactive />
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-pressed={mode === "standard"}
                          disabled={entryPending || cart.busy}
                          onClick={() => {
                            setEditingReference(false);
                            setMode("standard");
                            setLabelHasQuantity(true);
                          }}
                        >
                          <ScrambleText text="Standard selection" interactive />
                        </button>
                        <button
                          type="button"
                          aria-pressed={mode === "builder"}
                          disabled={cart.busy}
                          onClick={() => {
                            setEditingReference(false);
                            setMode("builder");
                          }}
                        >
                          <ScrambleText
                            text="Interactive builder"
                            interactive
                          />
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.close}
                  onClick={close}
                  disabled={cart.busy}
                  aria-label={
                    referenceEditorOpen
                      ? "Close reference editor"
                      : "Back to overview"
                  }
                >
                  ×
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className={styles.controlScroll}
              data-selection-scroll
              data-brand-part="selection-scroll"
            >
              {referenceEditorOpen ? (
                <ReferenceEditor
                  value={labelText}
                  onChange={setLabelText}
                  onDone={finishReference}
                />
              ) : embedded &&
                (mode === "overview" ||
                  mode === "specifications" ||
                  mode === "origins") ? (
                <HomepageProductInformation
                  originPreviewVariant={originPreviewVariant}
                  productCodePlacement={productCodePlacement}
                  model={model}
                  view={mode}
                  tone={tone}
                  onSpecifications={() => setMode("specifications")}
                  onShop={() => {
                    setMode("builder");
                    goToStep(1);
                  }}
                />
              ) : mode === "standard" ? (
                <div className={styles.standard}>
                  <h2 tabIndex={-1}>Choose your matcha.</h2>
                  <CatalogPanel
                    model={model}
                    compact
                    referenceControl={referenceAction}
                  />
                </div>
              ) : embedded && shopExplorationLayout ? (
                <ShopExplorationPanel
                  model={model}
                  layout={shopExplorationLayout}
                  productCodePlacement={productCodePlacement}
                  tone={tone}
                  onIncrement={() => {
                    setLabelHasQuantity(true);
                    model.incrementQuantity();
                  }}
                  onDecrement={() => {
                    setLabelHasQuantity(true);
                    model.decrementQuantity();
                  }}
                />
              ) : embedded &&
                shopPreviewVariant !== "current" &&
                shopPreviewVariant !== "refined" ? (
                <ShopPreview
                  model={model}
                  variant={shopPreviewVariant}
                  tone={tone}
                  onIncrement={() => {
                    setLabelHasQuantity(true);
                    model.incrementQuantity();
                  }}
                  onDecrement={() => {
                    setLabelHasQuantity(true);
                    model.decrementQuantity();
                  }}
                  referenceControl={
                    !mobileEmbedded ? referenceAction : undefined
                  }
                />
              ) : (
                <>
                  {!embedded && (
                    <nav className={styles.steps} aria-label="Builder steps">
                      {(["Matcha", "Quantity"] as const).map(
                        (name, position) => (
                          <button
                            key={name}
                            type="button"
                            aria-current={
                              (step === 0 ? 0 : 1) === position
                                ? "step"
                                : undefined
                            }
                            onClick={() => goToStep(position as BuilderStep)}
                            disabled={
                              cart.busy || (entryPending && position > 0)
                            }
                          >
                            <span className={styles.stepNumber}>
                              0{position + 1}
                            </span>
                            <ScrambleText text={name} interactive />
                          </button>
                        ),
                      )}
                    </nav>
                  )}
                  <div
                    className={styles.builderBody}
                    data-shop-refined={
                      embedded && shopPreviewVariant === "refined"
                        ? "true"
                        : undefined
                    }
                  >
                    <h2 tabIndex={-1}>
                      {embedded
                        ? "Format & quantity."
                        : step === 0
                          ? "Choose your matcha."
                          : "How much would you like?"}
                    </h2>
                    <p className={styles.guidance}>
                      <ScrambleText
                        text={
                          embedded
                            ? `${content.name} · ${content.application}`
                            : step === 0
                              ? "Start with what you make."
                              : `${content.name}. Ready to make yours.`
                        }
                        periodic
                        wrap
                      />
                    </p>
                    {model.loading ? (
                      <div className={styles.state} role="status">
                        Opening the collection…
                      </div>
                    ) : model.catalog?.status !== "ready" ? (
                      <div className={styles.state} role="status">
                        <p>
                          {model.catalog?.status === "empty"
                            ? "The next selection is taking shape."
                            : "The collection couldn’t be loaded."}
                        </p>
                        <button type="button" onClick={model.retry}>
                          <ScrambleText text="Try again" interactive />{" "}
                          <span aria-hidden="true">↻</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {builderStep === 0 && (
                          <>
                            <fieldset
                              className={styles.applicationChoices}
                              disabled={cart.busy}
                            >
                              <legend>Choose a matcha</legend>
                              {model.catalog.products.map(
                                (product, position) => {
                                  const details = getProductContent(product);
                                  return (
                                    <label
                                      key={product.id}
                                      data-selected={
                                        product.id === model.product?.id
                                      }
                                    >
                                      <input
                                        type="radio"
                                        name="builder-matcha"
                                        checked={
                                          product.id === model.product?.id
                                        }
                                        onChange={() => {
                                          model.selectProduct(product.id);
                                          setOpenedVessel(false);
                                        }}
                                      />
                                      <span className={styles.choiceIndex}>
                                        {String(position + 1).padStart(2, "0")}
                                      </span>
                                      <span>
                                        <strong>
                                          <ScrambleText
                                            text={
                                              details.application ===
                                              "Matcha selection"
                                                ? productName(product.title)
                                                : details.application
                                            }
                                            interactive
                                            wrap
                                          />
                                        </strong>
                                        <small>
                                          <ScrambleText
                                            text={productName(product.title)}
                                            interactive
                                            periodic
                                            wrap
                                          />
                                          {!product.variants.some(
                                            (variant) => variant.available,
                                          ) && " / UNAVAILABLE"}
                                        </small>
                                      </span>
                                      <span
                                        className={styles.choiceMark}
                                        aria-hidden="true"
                                      >
                                        {product.id === model.product?.id
                                          ? "●"
                                          : "○"}
                                      </span>
                                    </label>
                                  );
                                },
                              )}
                            </fieldset>
                            <div className={styles.materialNote}>
                              <p>
                                <ScrambleText
                                  text={materialSentence}
                                  periodic
                                  wrap
                                />
                              </p>
                              <ProductInformation content={content} />
                            </div>
                            <button
                              type="button"
                              className={styles.primary}
                              onClick={() => goToStep(1)}
                              disabled={entryPending || cart.busy}
                            >
                              <ScrambleText
                                text="Continue to quantity"
                                interactive
                                wrap
                              />{" "}
                              <span aria-hidden="true">→</span>
                            </button>
                          </>
                        )}
                        {builderStep === 1 && (
                          <>
                            <fieldset
                              className={styles.formats}
                              disabled={cart.busy}
                            >
                              <legend>
                                <ScrambleText text="Format" periodic wrap />
                              </legend>
                              {model.product?.variants.length === 1 ? (
                                <span>
                                  <ScrambleText text={format} periodic wrap />
                                </span>
                              ) : (
                                <div>
                                  {model.product?.variants.map((variant) => (
                                    <button
                                      key={variant.id}
                                      type="button"
                                      aria-pressed={
                                        variant.id === model.variant?.id
                                      }
                                      onClick={() =>
                                        model.selectVariant(variant.id)
                                      }
                                    >
                                      <ScrambleText
                                        text={
                                          variant.title === "Default Title"
                                            ? "Standard"
                                            : variant.title
                                        }
                                        interactive
                                        wrap
                                      />
                                      {!variant.available && (
                                        <small>Unavailable</small>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </fieldset>
                            <div className={styles.quantityBuilder}>
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={
                                  cart.busy ||
                                  !model.variant ||
                                  model.quantity <= model.variant.minimum
                                }
                                onClick={() => {
                                  setLabelHasQuantity(true);
                                  model.decrementQuantity();
                                }}
                              >
                                −
                              </button>
                              <div>
                                <output
                                  aria-label="Quantity"
                                  aria-live="polite"
                                >
                                  {String(model.quantity).padStart(2, "0")}
                                </output>
                                <span>
                                  <ScrambleText
                                    text={`${model.quantity === 1 ? "UNIT" : "UNITS"} / ${format}`}
                                    periodic
                                    wrap
                                  />
                                </span>
                              </div>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={cart.busy || !model.canIncrement}
                                onClick={() => {
                                  setLabelHasQuantity(true);
                                  model.incrementQuantity();
                                }}
                              >
                                +
                              </button>
                            </div>
                            <div className={styles.optionalActions}>
                              <ProductInformation content={content} />
                            </div>
                          </>
                        )}
                        {!mobileEmbedded &&
                          (embedded || builderStep > 0) &&
                          referenceAction}
                        {builderStep > 0 && (
                          <div className={styles.purchase}>
                            <PurchaseOptions />
                            <div className={styles.purchaseFacts}>
                              <span>
                                {format} × {model.quantity}
                                <small>
                                  <ScrambleText
                                    text={content.name}
                                    periodic
                                    wrap
                                  />
                                </small>
                              </span>
                              <strong data-shop-total>
                                {model.priceLabel}
                              </strong>
                            </div>
                            <AddToCartButton
                              available={Boolean(model.variant?.available)}
                              pending={cart.adding}
                              onAdd={() => {
                                if (model.product && model.variant)
                                  void cart.addItem(
                                    model.product.handle,
                                    model.variant.id,
                                    model.quantity,
                                  );
                              }}
                            />
                            {cart.error && <p role="alert">{cart.error}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
      {!embedded && (
        <footer className={styles.footer}>
          <Link href="/">
            <ScrambleText text="01 / THE TRAY" interactive />
          </Link>
          {packaging !== "label" && (
            <Link href="/concept-02">
              <ScrambleText text="LABEL STUDY" interactive />{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          )}
          <span>
            <ScrambleText text="ATOMA / CONCEPT 02" periodic wrap />
          </span>
        </footer>
      )}
    </Container>
  );
}
