"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import {
  parseTastingDraft,
  tastingToDraft,
  TASTING_NOTES_LIMIT,
  type TastingDraft,
  type TastingRecord,
} from "@/lib/sample-tastings";
import { downloadTastingCard } from "@/lib/tasting-card-image";
import { useSampleTastings } from "./use-sample-tastings";
import { useSampleTastingSession } from "./sample-tasting-session-provider";
import { useCart } from "./cart-drawer";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import { ProductApplicationCutout } from "./product-application-cutout";
import styles from "./sample-tasting-tools.module.css";

const preparations = { hot: "Hot", iced: "Iced", recipe: "Recipe" } as const;

/** Personal trial records are kept separate from product facts and commerce. */
export function SampleTastingTools() {
  const { t } = useStorefrontLocale();
  const { busy } = useCart();
  const saved = useSampleTastings();
  const {
    view,
    setView,
    selected,
    setSelected,
    pair,
    setPair,
    drafts,
    setDrafts,
  } = useSampleTastingSession();
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const textFallback = useRef<HTMLTextAreaElement>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackArea, setFeedbackArea] = useState<"editor" | "export">(
    "editor",
  );
  const [invalid, setInvalid] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const item = SAMPLE_SET_CONTENTS.find((tea) => tea.key === selected)!;
  const selectedIndex = SAMPLE_SET_CONTENTS.findIndex(
    (tea) => tea.key === selected,
  );
  const nextItem =
    SAMPLE_SET_CONTENTS[(selectedIndex + 1) % SAMPLE_SET_CONTENTS.length] ??
    item;
  const savedCount = SAMPLE_SET_CONTENTS.filter(
    (tea) => saved.records[tea.key],
  ).length;
  const draft = drafts[selected] ?? tastingToDraft(saved.records[selected]);
  const record = parseTastingDraft(draft);
  const dirty = Boolean(drafts[selected]);
  const hasContent = Object.values(draft).some((value) => value.trim());
  const actionFeedbackVisible =
    view === "card" && feedback && (feedbackArea === "editor" || previewOpen);

  useEffect(() => {
    if (!feedback || !window.matchMedia("(max-width: 760px)").matches) return;
    const message = document.getElementById(`${id}-${feedbackArea}-feedback`);
    if (
      !message?.getClientRects().length ||
      message.closest("[hidden], details:not([open])")
    )
      return;
    const action =
      feedbackArea === "editor"
        ? root.current?.querySelector('button[type="submit"]')
        : message.previousElementSibling;
    if (!action) return;
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop ?? 0;
    const bottom = top + (viewport?.height ?? window.innerHeight);
    const actionBounds = action.getBoundingClientRect();
    const messageBounds = message.getBoundingClientRect();
    // A result just below a tapped action should stay in view, including above
    // the phone keyboard. Never pull someone back after they scroll away.
    if (
      actionBounds.bottom >= top &&
      actionBounds.top < bottom &&
      messageBounds.bottom > bottom
    )
      window.scrollBy({
        top: messageBounds.bottom - bottom + 12,
        behavior: "instant",
      });
  }, [feedback, feedbackArea, id]);

  function recipeFacts(value: TastingRecord | null | undefined) {
    if (!value) return [];
    const facts: { label: string; value: string }[] = [];
    if (value.preparation)
      facts.push({
        label: t("Preparation"),
        value: t(preparations[value.preparation]),
      });
    if (value.matchaMg !== null)
      facts.push({ label: t("Matcha"), value: `${value.matchaMg / 1000} g` });
    if (value.waterMl !== null)
      facts.push({ label: t("Water"), value: `${value.waterMl} ml` });
    if (value.milkMl !== null)
      facts.push({ label: t("Milk"), value: `${value.milkMl} ml` });
    return facts;
  }

  const card = {
    heading: t("Tasting card"),
    title: t(item.name),
    code: item.productCode,
    facts: [
      { label: t("Application"), value: t(item.application) },
      { label: t("Sample size"), value: `${item.grams} g` },
      ...recipeFacts(record),
    ],
    notesLabel: t("Your notes"),
    notes: record?.notes || t("No tasting notes yet."),
    footer: t("Your personal tasting notes"),
  };
  const cardText = [
    `ATOMA / ${card.heading}`,
    `${card.title} · ${card.code}`,
    "",
    ...card.facts.map((fact) => `${fact.label}: ${fact.value}`),
    "",
    `${card.notesLabel}:`,
    card.notes,
    "",
    card.footer,
  ].join("\n");

  function edit(key: ProductKey) {
    setSelected(key);
    setView("card");
    setFeedback("");
    setInvalid(false);
    setManualCopy(false);
  }

  function update(field: keyof TastingDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [selected]: { ...draft, [field]: value },
    }));
    setFeedback("");
    setInvalid(false);
    setManualCopy(false);
  }

  function discardDraft() {
    setDrafts((current) => {
      const next = { ...current };
      delete next[selected];
      return next;
    });
  }

  function save(event: FormEvent) {
    event.preventDefault();
    setFeedbackArea("editor");
    if (!record) {
      setInvalid(true);
      setFeedback(
        hasContent
          ? "Check your recipe: use up to three decimal places for matcha and whole millilitres for liquids."
          : "Add a note or recipe before saving.",
      );
      return;
    }
    if (saved.saveTasting(selected, record)) {
      discardDraft();
      setFeedback("Saved on this device.");
    } else {
      setFeedback(
        "Your card could not be saved on this device. You can still copy or download it.",
      );
    }
  }

  async function copyCard() {
    setFeedbackArea("export");
    setFeedback("");
    try {
      await navigator.clipboard.writeText(cardText);
      setManualCopy(false);
      setFeedback("Card copied.");
    } catch {
      setManualCopy(true);
      setFeedback(
        "Copy is unavailable. Select the card text below to copy it.",
      );
      requestAnimationFrame(() => {
        textFallback.current?.focus();
        textFallback.current?.select();
      });
    }
  }

  async function downloadCard() {
    if (!record || exporting) return;
    setFeedbackArea("export");
    setFeedback("");
    setExporting(true);
    try {
      const appearance = getComputedStyle(root.current!);
      // Capture the preview palette at the click, before waiting for fonts.
      await downloadTastingCard(card, appearance.fontFamily, {
        surface: appearance.getPropertyValue("--color-raised").trim(),
        ink: appearance.getPropertyValue("--color-ink").trim(),
        muted: appearance.getPropertyValue("--color-muted").trim(),
        line: appearance.getPropertyValue("--color-line").trim(),
      });
      setFeedback("Download started.");
    } catch {
      setFeedback(
        "The card could not be downloaded. You can copy its text instead.",
      );
    } finally {
      setExporting(false);
    }
  }

  function selectCompared(index: 0 | 1, key: ProductKey) {
    setPair((current) => {
      const next: [ProductKey, ProductKey] = [...current];
      const other = index === 0 ? 1 : 0;
      if (next[other] === key) next[other] = next[index];
      next[index] = key;
      return next;
    });
  }

  function editButton(key: ProductKey) {
    return (
      <button
        className={styles.textButton}
        type="button"
        aria-label={t("Edit {matcha} card", {
          matcha: t(SAMPLE_SET_CONTENTS.find((tea) => tea.key === key)!.name),
        })}
        onClick={() => {
          edit(key);
          requestAnimationFrame(() =>
            root.current
              ?.querySelector<HTMLTextAreaElement>('[name="notes"]')
              ?.focus(),
          );
        }}
      >
        <ScrambleText
          text={t("Edit card")}
          interactive
          animateOnMount={false}
          wrap
        />
        <span aria-hidden="true">↗</span>
      </button>
    );
  }

  function orderLink(key: ProductKey, context: "editor" | "comparison") {
    const tea = SAMPLE_SET_CONTENTS.find((item) => item.key === key);
    const href = tea && oneKilogramProductUrl(tea.productHandle);
    if (!tea || !href) return null;
    return (
      <Link
        className={styles.orderLink}
        href={href}
        aria-disabled={busy || undefined}
        tabIndex={busy ? -1 : undefined}
        onClick={(event) => {
          if (busy) event.preventDefault();
        }}
        onNavigate={(event) => {
          if (busy) event.preventDefault();
        }}
        data-tasting-one-kilogram={key}
        data-tasting-link-context={context}
      >
        <span>
          {t("View 1 kg of {name}", { name: t(tea.name) })
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
        <span aria-hidden="true">↗</span>
      </Link>
    );
  }

  return (
    <section
      ref={root}
      className={styles.tools}
      data-sample-tasting-tools
      data-tasting-view={view}
      data-tasting-selected={selected}
      aria-labelledby={`${id}-title`}
    >
      <header className={styles.heading} data-page-reveal="rise">
        <div>
          <span className={styles.eyebrow}>{t("Tasting tools")}</span>
          <h2 id={`${id}-title`}>{t("Compare your samples")}</h2>
          <p>
            {t("Keep a recipe, note what you taste, and compare two matcha.")}
          </p>
        </div>
        <div
          className={styles.views}
          role="group"
          aria-label={t("Tasting tools")}
        >
          <button
            type="button"
            aria-pressed={view === "card"}
            disabled={!saved.ready}
            onClick={() => setView("card")}
          >
            <ScrambleText
              text={t("Tasting card")}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
          <button
            type="button"
            aria-pressed={view === "compare"}
            disabled={!saved.ready}
            onClick={() => setView("compare")}
          >
            <ScrambleText
              text={t("Compare samples")}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
        </div>
      </header>
      <noscript>
        <p>{t("Enable JavaScript to save and compare your tasting cards.")}</p>
      </noscript>

      <div
        className={styles.editor}
        hidden={view !== "card"}
        data-tasting-editor
      >
        <aside className={styles.chooser}>
          <div className={styles.choiceHeading}>
            <span>{t("Choose a matcha")}</span>
          </div>
          <div
            className={styles.teaChoices}
            role="group"
            aria-label={t("Choose a matcha")}
            data-page-reveal="rise"
          >
            {SAMPLE_SET_CONTENTS.map((tea, index) => (
              <button
                key={tea.key}
                type="button"
                data-tasting-tea={tea.key}
                aria-pressed={selected === tea.key}
                disabled={!saved.ready}
                onClick={() => edit(tea.key)}
              >
                <span className={styles.teaNumber}>0{index + 1}</span>
                <span>
                  <ScrambleText
                    text={t(tea.name.replace(/ Matcha$/, ""))}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </span>
                {saved.records[tea.key] && (
                  <span
                    className={styles.savedMark}
                    aria-label={t("Saved on this device.")}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className={styles.progressNote}>
            <span>{t("Your saved tasting")}</span>
            <output
              data-tasting-progress
              aria-label={t("Your saved tasting")}
              aria-live="polite"
            >
              {savedCount} / {SAMPLE_SET_CONTENTS.length}
            </output>
          </p>
        </aside>
        <div className={styles.workspace}>
          <form
            className={styles.form}
            onSubmit={save}
            aria-label={`${t("Tasting card")} · ${t(item.name)}`}
            data-page-reveal="rise"
          >
            <fieldset disabled={!saved.ready}>
              <div className={styles.activeTea} data-tasting-current>
                <div className={styles.activeImage} aria-hidden="true">
                  <ProductApplicationCutout productKey={selected} />
                </div>
                <div>
                  <span className={styles.eyebrow}>◇ {item.productCode}</span>
                  <h3>{t(item.name)}</h3>
                  <p>{t(item.application)}</p>
                </div>
              </div>
              <label className={styles.notes}>
                <span>{t("Your notes")}</span>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={TASTING_NOTES_LIMIT}
                  value={draft.notes}
                  placeholder={t("What worked in your drink or recipe?")}
                  onChange={(event) => update("notes", event.target.value)}
                />
              </label>
              <div className={styles.noteMeta}>
                <span>
                  {dirty
                    ? t("Unsaved changes.")
                    : saved.records[selected]
                      ? t("Saved on this device.")
                      : null}
                </span>
                <span
                  className={
                    draft.notes.length < 480 ? styles.srOnly : undefined
                  }
                >
                  {draft.notes.length} / {TASTING_NOTES_LIMIT}
                </span>
              </div>
              <details className={styles.disclosure}>
                <summary>
                  <ScrambleText
                    text={t("Recipe (optional)")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">+</span>
                </summary>
                <div className={styles.recipeFields}>
                  <label>
                    <span>{t("Preparation")}</span>
                    <select
                      name="preparation"
                      value={draft.preparation}
                      onChange={(event) =>
                        update("preparation", event.target.value)
                      }
                    >
                      <option value="">{t("Not recorded")}</option>
                      {Object.entries(preparations).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      ["matchaGrams", "Matcha (g)", "2"],
                      ["waterMl", "Water (ml)", "40"],
                      ["milkMl", "Milk (ml)", "150"],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <label key={field}>
                      <span>{t(label)}</span>
                      <input
                        name={field}
                        type="text"
                        inputMode={
                          field === "matchaGrams" ? "decimal" : "numeric"
                        }
                        maxLength={10}
                        value={draft[field]}
                        placeholder={placeholder}
                        aria-invalid={(invalid && hasContent) || undefined}
                        aria-describedby={
                          invalid ? `${id}-editor-feedback` : undefined
                        }
                        onChange={(event) => update(field, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </details>
              <div className={styles.actions}>
                <button className={styles.primary} type="submit">
                  <ScrambleText
                    text={t("Save tasting card")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </button>
                <button
                  className={styles.nextButton}
                  type="button"
                  data-tasting-next={nextItem.key}
                  onClick={() => {
                    edit(nextItem.key);
                    requestAnimationFrame(() =>
                      root.current
                        ?.querySelector<HTMLTextAreaElement>('[name="notes"]')
                        ?.focus({ preventScroll: true }),
                    );
                  }}
                >
                  <ScrambleText
                    text={t("Next matcha")}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">→</span>
                </button>
                {saved.records[selected] && (
                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => {
                      setFeedbackArea("editor");
                      if (saved.clearTasting(selected)) {
                        setFeedback("Saved card cleared.");
                        root.current
                          ?.querySelector<HTMLButtonElement>(
                            'button[type="submit"]',
                          )
                          ?.focus({ preventScroll: true });
                      } else
                        setFeedback("Your saved card could not be cleared.");
                    }}
                  >
                    <ScrambleText
                      text={t("Clear saved card")}
                      interactive
                      animateOnMount={false}
                      wrap
                    />
                  </button>
                )}
              </div>
            </fieldset>
            <p
              className={styles.feedback}
              id={`${id}-editor-feedback`}
              role="status"
            >
              {feedbackArea === "editor" && feedback ? t(feedback) : ""}
            </p>
          </form>

          <details
            className={`${styles.disclosure} ${styles.preview}`}
            data-tasting-preview
            onToggle={(event) => setPreviewOpen(event.currentTarget.open)}
          >
            <summary data-page-reveal="rise">
              <ScrambleText
                text={t("Card preview")}
                interactive
                animateOnMount={false}
                wrap
              />
              <span aria-hidden="true">+</span>
            </summary>
            <article
              className={styles.card}
              aria-label={`${t("Card preview")} · ${t(item.name)}`}
            >
              <div className={styles.cardTop}>
                <span>ATOMA / {t("Tasting card")}</span>
                <span>◇ {item.productCode}</span>
              </div>
              <h3>{card.title}</h3>
              <dl>
                {card.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.cardNotes}>
                <span>{card.notesLabel}</span>
                <p>{card.notes}</p>
              </div>
              <footer>{card.footer}</footer>
            </article>
            <div className={styles.exportActions}>
              <button type="button" disabled={!record} onClick={copyCard}>
                <ScrambleText
                  text={t("Copy card")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
              </button>
              <button
                type="button"
                disabled={!record || exporting}
                onClick={downloadCard}
              >
                <ScrambleText
                  text={t("Download card")}
                  interactive
                  animateOnMount={false}
                  wrap
                />
                <span aria-hidden="true">↓</span>
              </button>
            </div>
            <p
              className={styles.feedback}
              id={`${id}-export-feedback`}
              role="status"
            >
              {feedbackArea === "export" && feedback ? t(feedback) : ""}
            </p>
            {manualCopy && (
              <label className={styles.copyFallback}>
                <span>{t("Card text")}</span>
                <textarea
                  ref={textFallback}
                  value={cardText}
                  readOnly
                  rows={8}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
            )}
          </details>
          <div className={styles.editorOrder}>
            {orderLink(selected, "editor")}
          </div>
        </div>
      </div>

      <div hidden={view !== "compare"} data-tasting-comparison>
        <p className={styles.compareNote}>
          {t(
            "Comparison uses your saved cards. Keep the recipe consistent while tasting.",
          )}
        </p>
        <div className={styles.compareSelectors}>
          {pair.map((key, index) => (
            <label key={index}>
              <span>{t(index === 0 ? "First matcha" : "Second matcha")}</span>
              <select
                value={key}
                data-tasting-compare-slot={index}
                onChange={(event) =>
                  selectCompared(
                    index as 0 | 1,
                    event.target.value as ProductKey,
                  )
                }
              >
                {SAMPLE_SET_CONTENTS.map((tea) => (
                  <option key={tea.key} value={tea.key}>
                    {t(tea.name.replace(/ Matcha$/, ""))}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <table className={styles.comparison} role="table">
          <caption className={styles.srOnly}>
            {t("Compare your samples")}
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              <td className={styles.corner} role="cell" />
              {pair.map((key, index) => {
                const tea = SAMPLE_SET_CONTENTS.find((tea) => tea.key === key)!;
                return (
                  <th
                    key={key}
                    scope="col"
                    role="columnheader"
                    id={`${id}-${index === 0 ? "first" : "second"}-tea`}
                  >
                    {t(tea.name.replace(/ Matcha$/, ""))}
                    <span className={styles.comparedApplication}>
                      {t(tea.application)}
                    </span>
                    <span className={styles.comparedSize}>
                      <span className={styles.srOnly}>
                        {t("Sample size")}:{" "}
                      </span>
                      {tea.grams} g
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody role="rowgroup">
            <tr className={styles.groupRow} role="row">
              <th colSpan={3} role="rowheader">
                {t("Your saved tasting")}
              </th>
            </tr>
            <tr role="row">
              <th scope="row" role="rowheader" id={`${id}-recipe`}>
                {t("Recipe")}
              </th>
              {pair.map((key, index) => (
                <td
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea ${id}-recipe`}
                >
                  {recipeFacts(saved.records[key]).length ? (
                    <ul>
                      {recipeFacts(saved.records[key]).map((fact) => (
                        <li
                          key={fact.label}
                          className={
                            fact.label === t("Preparation")
                              ? styles.preparationFact
                              : undefined
                          }
                        >
                          <span className={styles.recipeLabel}>
                            {fact.label}:
                          </span>{" "}
                          <span className={styles.recipeValue}>
                            {fact.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    t("No recipe recorded.")
                  )}
                </td>
              ))}
            </tr>
            <tr className={styles.notesRow} role="row">
              <th scope="row" role="rowheader" id={`${id}-notes`}>
                {t("Your notes")}
              </th>
              {pair.map((key, index) => (
                <td
                  className={styles.comparedNotes}
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea ${id}-notes`}
                >
                  <div className={styles.mobileNoteHeading}>
                    <span aria-hidden="true">
                      {t(
                        SAMPLE_SET_CONTENTS.find(
                          (tea) => tea.key === key,
                        )!.name.replace(/ Matcha$/, ""),
                      )}
                    </span>
                    {editButton(key)}
                  </div>
                  <p>
                    {saved.records[key]?.notes ||
                      t(
                        saved.records[key]
                          ? "No tasting notes yet."
                          : "No saved card yet.",
                      )}
                  </p>
                </td>
              ))}
            </tr>
            <tr className={styles.compareActions} role="row">
              <td className={styles.corner} role="cell" />
              {pair.map((key, index) => (
                <td
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea`}
                >
                  {editButton(key)}
                </td>
              ))}
            </tr>
            <tr className={styles.orderActions} role="row">
              <td className={styles.corner} role="cell" />
              {pair.map((key, index) => (
                <td
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea`}
                >
                  {orderLink(key, "comparison")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className={styles.feedback} role="status">
        {saved.error && !actionFeedbackVisible
          ? t(
              "Device storage is unavailable. You can still copy or download a card.",
            )
          : ""}
      </p>
      <p className={styles.deviceNote} data-page-reveal="fade">
        {t("These notes and recipes stay on this device.")}
      </p>
    </section>
  );
}
