"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import {
  parseTastingDraft,
  tastingToDraft,
  TASTING_NOTES_LIMIT,
  type TastingDraft,
  type TastingRecord,
} from "@/lib/sample-tastings";
import { downloadTastingCard } from "@/lib/tasting-card-image";
import { useSampleTastings } from "./use-sample-tastings";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-tasting-tools.module.css";

const preparations = { hot: "Hot", iced: "Iced", recipe: "Recipe" } as const;

/** Personal trial records are kept separate from product facts and commerce. */
export function SampleTastingTools() {
  const { t } = useStorefrontLocale();
  const saved = useSampleTastings();
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const textFallback = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState<"card" | "compare">("card");
  const [selected, setSelected] = useState<ProductKey>("ceremonial");
  const [pair, setPair] = useState<[ProductKey, ProductKey]>([
    "ceremonial",
    "barista",
  ]);
  const [drafts, setDrafts] = useState<
    Partial<Record<ProductKey, TastingDraft>>
  >({});
  const [feedback, setFeedback] = useState("");
  const [feedbackArea, setFeedbackArea] = useState<"editor" | "export">(
    "editor",
  );
  const [invalid, setInvalid] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const item = SAMPLE_SET_CONTENTS.find((tea) => tea.key === selected)!;
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
        {t("Edit card")}
        <span aria-hidden="true">↗</span>
      </button>
    );
  }

  return (
    <section
      ref={root}
      className={styles.tools}
      data-sample-tasting-tools
      aria-labelledby={`${id}-title`}
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{t("Tasting tools")}</span>
          <h2 id={`${id}-title`}>{t("Compare your samples")}</h2>
        </div>
        <p>
          {t("Keep a recipe, note what you taste, and compare two matcha.")}
        </p>
      </header>
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
          {t("Tasting card")}
        </button>
        <button
          type="button"
          aria-pressed={view === "compare"}
          disabled={!saved.ready}
          onClick={() => setView("compare")}
        >
          {t("Compare samples")}
        </button>
      </div>
      <noscript>
        <p>{t("Enable JavaScript to save and compare your tasting cards.")}</p>
      </noscript>

      <div hidden={view !== "card"} data-tasting-editor>
        <div
          className={styles.teaChoices}
          role="group"
          aria-label={t("Choose a matcha")}
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
              <span>{t(tea.name.replace(/ Matcha$/, ""))}</span>
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
        <div className={styles.workspace}>
          <form
            className={styles.form}
            onSubmit={save}
            aria-label={`${t("Tasting card")} · ${t(item.name)}`}
          >
            <fieldset disabled={!saved.ready}>
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
                  {t(
                    dirty
                      ? "Unsaved changes."
                      : saved.records[selected]
                        ? "Saved on this device."
                        : "Add a note or recipe to make your first card.",
                  )}
                </span>
                <span>
                  {draft.notes.length} / {TASTING_NOTES_LIMIT}
                </span>
              </div>
              <details className={styles.disclosure}>
                <summary>
                  {t("Recipe (optional)")}
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
                  {t("Save tasting card")}
                  <span aria-hidden="true">↗</span>
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
                    {t("Clear saved card")}
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
            <summary>
              {t("Card preview")}
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
                {t("Copy card")}
              </button>
              <button
                type="button"
                disabled={!record || exporting}
                onClick={downloadCard}
              >
                {t("Download card")}
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
              <th scope="col" role="columnheader" id={`${id}-first-tea`}>
                {t(
                  SAMPLE_SET_CONTENTS.find(
                    (tea) => tea.key === pair[0],
                  )!.name.replace(/ Matcha$/, ""),
                )}
              </th>
              <th scope="col" role="columnheader" id={`${id}-second-tea`}>
                {t(
                  SAMPLE_SET_CONTENTS.find(
                    (tea) => tea.key === pair[1],
                  )!.name.replace(/ Matcha$/, ""),
                )}
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            <tr className={styles.groupRow} role="row">
              <th colSpan={3} role="rowheader">
                {t("Product details")}
              </th>
            </tr>
            <tr role="row">
              <th scope="row" role="rowheader" id={`${id}-application`}>
                {t("Application")}
              </th>
              {pair.map((key, index) => (
                <td
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea ${id}-application`}
                >
                  {t(
                    SAMPLE_SET_CONTENTS.find((tea) => tea.key === key)!
                      .application,
                  )}
                </td>
              ))}
            </tr>
            <tr role="row">
              <th scope="row" role="rowheader" id={`${id}-size`}>
                {t("Sample size")}
              </th>
              {pair.map((key, index) => (
                <td
                  key={key}
                  role="cell"
                  headers={`${id}-${index === 0 ? "first" : "second"}-tea ${id}-size`}
                >
                  {SAMPLE_SET_CONTENTS.find((tea) => tea.key === key)!.grams} g
                </td>
              ))}
            </tr>
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
      <p className={styles.deviceNote}>
        {t("These notes and recipes stay on this device.")}
      </p>
    </section>
  );
}
