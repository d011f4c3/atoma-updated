"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useEffect, useId, useRef } from "react";
import { ScrambleText } from "./scramble-text";
import styles from "./reference-editor.module.css";

type ReferenceEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
};

export function ReferenceEditor({
  value,
  onChange,
  onDone,
}: ReferenceEditorProps) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus({ preventScroll: true });
      input.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <form
      className={styles.editor}
      aria-labelledby={`${id}-title`}
      onSubmit={(event) => {
        event.preventDefault();
        onDone();
      }}
    >
      <h2 id={`${id}-title`}>{t("Make it yours.")}</h2>
      <p className={styles.introduction} id={`${id}-hint`}>
        <ScrambleText
          text={t("Add a name, studio, or short note.")}
          periodic
          wrap
        />
      </p>
      <div className={styles.field}>
        <div className={styles.fieldHeading}>
          <label htmlFor={`${id}-reference`}>{t("Your reference")}</label>
          <span className={styles.counter}>{value.length} / 32</span>
        </div>
        <input
          ref={inputRef}
          id={`${id}-reference`}
          className={styles.input}
          type="text"
          value={value}
          maxLength={32}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("E.g. Studio 01")}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby={`${id}-hint ${id}-preview`}
        />
        <p className={styles.note} id={`${id}-preview`}>
          <ScrambleText
            text={t("For your label preview only.")}
            periodic
            wrap
          />
        </p>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          disabled={value.length === 0}
          onClick={() => {
            onChange("");
            inputRef.current?.focus({ preventScroll: true });
          }}
        >
          <ScrambleText text={t("Clear text")} interactive />
          <span aria-hidden="true">×</span>
        </button>
        <button className={styles.done} type="submit">
          <ScrambleText text={t("Done")} interactive />
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
