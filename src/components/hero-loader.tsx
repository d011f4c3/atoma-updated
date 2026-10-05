import styles from "./hero-loader.module.css";

export function HeroLoader({
  progress,
  phase,
  tone,
}: {
  progress: number;
  phase: "loading" | "complete" | "leaving";
  tone: "light" | "dark";
}) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={styles.loader}
      data-hero-loader
      data-state={phase}
      data-tone={tone}
      role="progressbar"
      aria-label="Loading ATOMA"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className={styles.register} aria-hidden="true">
        <div className={styles.progress}>
          <div className={styles.rail}>
            <span
              className={styles.fill}
              style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
            />
          </div>
          <div className={styles.readout}>
            <span className={styles.status}>
              {value === 100 ? "READY" : "LOADING"}
            </span>
            <span className={styles.percentage}>
              {String(value).padStart(2, "0")}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
