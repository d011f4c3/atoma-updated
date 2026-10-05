"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ScrambleText } from "./scramble-text";
import type { ProductContent } from "@/lib/product-content";
import styles from "./label-card.module.css";

export type LabelCardProps = {
  title: string;
  application: string;
  format: string;
  quantity: number;
  annotation?: string;
  reference: string;
  profile?: Pick<ProductContent, "materialProfile" | "profileKind">;
  presentation?: "paper" | "ink";
  showReference?: boolean;
  visible?: boolean;
  expanded?: boolean;
  tone?: "dark" | "light";
  onEditReference?: () => void;
};

type Pose = { x: number; y: number; rx: number; ry: number; rz: number };
type Drag = {
  id: number;
  x: number;
  y: number;
  time: number;
  vx: number;
  vy: number;
};
const REST = { rx: -4, ry: 6, rz: -2 };
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

function Ink({
  field,
  value,
  delay,
  visible,
}: {
  field: string;
  value: string;
  delay: number;
  visible: boolean;
}) {
  const inkRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (field !== "reference") return;
    const printed = inkRef.current;
    const row = printed?.closest("dd");
    if (!printed || !row) return;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;
    let active = true;
    const fit = () => {
      if (!active) return;
      const style = getComputedStyle(row);
      const baseSize = parseFloat(style.fontSize);
      context.font = `${baseSize}px ${style.fontFamily}`;
      const textWidth = context.measureText(value).width;
      const width = row.clientWidth;
      if (!width || !textWidth) return;
      // Reserve two handwritten lines even for unusually wide initials.
      // Measure the joined script, never split it into separate glyph boxes.
      const scale = Math.min(1, (width * 1.65) / textWidth);
      printed.style.fontSize = `${baseSize * scale}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    void document.fonts.ready.then(fit);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [field, value, visible]);

  return (
    <span className={styles.ink}>
      <span className={styles.accessible} data-label-field={field}>
        {value}
      </span>
      <span
        key={`${visible}:${value}`}
        ref={inkRef}
        aria-hidden="true"
        data-label-ink={field}
        className={styles.printed}
        style={{ "--ink-delay": `${delay}ms` } as CSSProperties}
      >
        {field === "reference"
          ? value
          : Array.from(value).map((character, index) => (
              <span
                key={index}
                className={styles.glyph}
                style={
                  {
                    "--glyph-delay": `${Math.min(index, 36) * 8}ms`,
                  } as CSSProperties
                }
              >
                {character}
              </span>
            ))}
      </span>
    </span>
  );
}

function LabelCardFace({
  title,
  application,
  format,
  quantity,
  annotation,
  reference,
  profile,
  visible = true,
  showReference = true,
  onEditReference,
}: LabelCardProps) {
  return (
    <div className={styles.front}>
      <header className={styles.header}>
        <span className={styles.brand}>ATOMA</span>
        {!profile && <span className={styles.heading}>MATCHA</span>}
        <span className={styles.descriptor}>
          {profile ? "MATERIAL / MATCHA" : "POWDER / YOUR SELECTION"}
        </span>
      </header>
      <dl className={styles.fields} aria-live="polite" aria-atomic="false">
        <div className={styles.selection}>
          <dt className={profile ? styles.accessible : undefined}>SELECTION</dt>
          <dd className={styles.name}>
            <Ink
              field="name"
              value={title || "Matcha"}
              delay={20}
              visible={visible}
            />
          </dd>
          <dd className={styles.application}>
            <Ink
              field="application"
              value={application || "—"}
              delay={55}
              visible={visible}
            />
          </dd>
        </div>
        {profile && (
          <div className={styles.specifications} aria-live="off">
            <dt>SPECIFICATIONS</dt>
            <dd>
              <dl className={styles.profile}>
                {profile.materialProfile.map((property, index) => (
                  <div key={property.label}>
                    <dt>{property.label}</dt>
                    <dd>
                      <Ink
                        field={`specification-${property.label.toLowerCase()}`}
                        value={property.value}
                        delay={80 + index * 25}
                        visible={visible}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </dd>
          </div>
        )}
        <div className={styles.order}>
          <div>
            <dt>FORMAT</dt>
            <dd>
              <Ink
                field="format"
                value={format || "—"}
                delay={90}
                visible={visible}
              />
            </dd>
          </div>
          {annotation ? (
            <div>
              <dt className={styles.accessible}>NOTE</dt>
              <dd className={styles.annotation}>{annotation}</dd>
            </div>
          ) : (
            <div>
              <dt>QUANTITY</dt>
              <dd className={styles.quantity}>
                <Ink
                  field="quantity"
                  value={quantity > 0 ? String(quantity).padStart(2, "0") : "—"}
                  delay={110}
                  visible={visible}
                />
              </dd>
            </div>
          )}
        </div>
        {showReference && (
          <div className={styles.reference}>
            <dt>YOUR REFERENCE</dt>
            <dd
              data-reference-length={
                reference.trim().length > 20 ? "long" : "short"
              }
            >
              {onEditReference ? (
                <button
                  type="button"
                  className={styles.referenceEdit}
                  data-reference-trigger="card"
                  aria-label={
                    reference.trim()
                      ? "Edit reference on label"
                      : "Add reference to label"
                  }
                  onClick={onEditReference}
                >
                  <Ink
                    field="reference"
                    value={reference.trim() || "—"}
                    delay={140}
                    visible={visible}
                  />
                </button>
              ) : (
                <Ink
                  field="reference"
                  value={reference.trim() || "—"}
                  delay={140}
                  visible={visible}
                />
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function PrintedLabelCard({
  visible = true,
  expanded = false,
  tone = "dark",
  ...content
}: LabelCardProps) {
  return (
    <div
      className={`${styles.root} ${styles.inkOnly}`}
      data-label-card
      data-presentation="ink"
      data-specifications={Boolean(content.profile)}
      data-expanded={expanded}
      data-visible={visible}
      data-tone={tone}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div
        className={styles.card}
        role="group"
        aria-label="Printed product information"
      >
        <LabelCardFace {...content} visible={visible} />
      </div>
    </div>
  );
}

/** The paper object is the default; direct ink reuses its exact field layout. */
export function LabelCard({
  presentation = "paper",
  ...props
}: LabelCardProps) {
  return presentation === "ink" ? (
    <PrintedLabelCard {...props} />
  ) : (
    <PaperLabelCard {...props} />
  );
}

/** A movable paper object; its position is independent of the selected ink. */
function PaperLabelCard({
  title,
  application,
  format,
  quantity,
  annotation,
  reference,
  profile,
  visible = true,
  expanded = false,
  tone = "dark",
  showReference = true,
  onEditReference,
}: LabelCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const objectRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<Pose>({ x: 0, y: 0, ...REST });
  const dragRef = useRef<Drag | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const entranceRef = useRef<Animation | undefined>(undefined);
  const reducedRef = useRef(false);
  const instructionId = `${useId()}-label-movement`;

  const paint = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const pose = poseRef.current;
    root.style.setProperty("--label-x", `${pose.x}px`);
    root.style.setProperty("--label-y", `${pose.y}px`);
    root.style.setProperty("--label-rx", `${pose.rx}deg`);
    root.style.setProperty("--label-ry", `${pose.ry}deg`);
    root.style.setProperty("--label-rz", `${pose.rz}deg`);
    root.style.setProperty("--shadow-x", `${-pose.ry * 0.9}px`);
    root.dataset.x = pose.x.toFixed(2);
    root.dataset.y = pose.y.toFixed(2);
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
    entranceRef.current?.cancel();
    entranceRef.current = undefined;
  }, []);

  const bounded = useCallback((x: number, y: number) => {
    const root = rootRef.current;
    const stage =
      root?.closest<HTMLElement>("[data-label-bounds]") ?? root?.parentElement;
    if (!root || !stage) return { x, y };
    const card = root.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const horizontal = [
      bounds.left + 8 - card.left,
      bounds.right - 8 - card.right,
    ];
    const vertical = [
      bounds.top + 8 - card.top,
      bounds.bottom - 8 - card.bottom,
    ];
    return {
      x:
        horizontal[0]! <= horizontal[1]!
          ? clamp(x, Math.min(0, horizontal[0]!), Math.max(0, horizontal[1]!))
          : 0,
      y:
        vertical[0]! <= vertical[1]!
          ? clamp(y, Math.min(0, vertical[0]!), Math.max(0, vertical[1]!))
          : 0,
    };
  }, []);

  const settle = useCallback(
    (vx = 0, vy = 0, reset = false) => {
      stop();
      if (reducedRef.current) {
        if (reset) poseRef.current.x = poseRef.current.y = 0;
        Object.assign(poseRef.current, REST);
        paint();
        return;
      }
      let previous: number | undefined;
      const tick = (time: number) => {
        const delta =
          previous === undefined ? 16 : Math.min(32, time - previous);
        previous = time;
        const pose = poseRef.current;
        const decay = Math.exp(-delta / 95);
        const target = reset
          ? { x: pose.x * decay, y: pose.y * decay }
          : bounded(pose.x + vx * delta, pose.y + vy * delta);
        if (!reset) {
          if (Math.abs(target.x - (pose.x + vx * delta)) > 0.1) vx = 0;
          if (Math.abs(target.y - (pose.y + vy * delta)) > 0.1) vy = 0;
        }
        pose.x = target.x;
        pose.y = target.y;
        vx *= Math.exp(-delta / 105);
        vy *= Math.exp(-delta / 105);
        pose.rx = REST.rx + (pose.rx - REST.rx) * decay;
        pose.ry = REST.ry + (pose.ry - REST.ry) * decay;
        pose.rz = REST.rz + (pose.rz - REST.rz) * decay;
        paint();
        const moving =
          Math.abs(vx) + Math.abs(vy) > 0.012 ||
          Math.abs(pose.rx - REST.rx) +
            Math.abs(pose.ry - REST.ry) +
            Math.abs(pose.rz - REST.rz) >
            0.05 ||
          (reset && Math.abs(pose.x) + Math.abs(pose.y) > 0.1);
        if (moving) frameRef.current = requestAnimationFrame(tick);
        else {
          frameRef.current = undefined;
          Object.assign(pose, REST);
          if (reset) pose.x = pose.y = 0;
          paint();
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [bounded, paint, stop],
  );

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const synchronize = () => {
      reducedRef.current = preference.matches;
      if (preference.matches) {
        stop();
        Object.assign(poseRef.current, REST);
        paint();
      }
    };
    synchronize();
    const resize = new ResizeObserver(() => {
      if (!rootRef.current?.getBoundingClientRect().width) return;
      Object.assign(
        poseRef.current,
        bounded(poseRef.current.x, poseRef.current.y),
      );
      paint();
    });
    if (rootRef.current) resize.observe(rootRef.current);
    const stage = rootRef.current?.closest<HTMLElement>("[data-label-bounds]");
    if (stage) resize.observe(stage);
    preference.addEventListener("change", synchronize);
    return () => {
      stop();
      resize.disconnect();
      preference.removeEventListener("change", synchronize);
    };
  }, [bounded, paint, stop]);

  useEffect(() => {
    if (visible) {
      const object = objectRef.current;
      if (
        !object ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const transform = getComputedStyle(object).transform;
      const animation = object.animate(
        [
          {
            transform: `${transform} translateY(10px) rotateX(-4deg) scale(0.97)`,
          },
          { transform },
        ],
        { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      entranceRef.current = animation;
      return () => {
        animation.cancel();
        if (entranceRef.current === animation) entranceRef.current = undefined;
      };
    }
    stop();
    dragRef.current = null;
    if (rootRef.current) rootRef.current.dataset.dragging = "false";
  }, [visible, stop]);

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !visible) return;
    if (event.target instanceof Element && event.target.closest("button"))
      return;
    stop();
    // Clicking an already keyboard-focused card can retain :focus-visible.
    event.currentTarget.dataset.pointerFocus = "true";
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      vx: 0,
      vy: 0,
    };
    if (rootRef.current) rootRef.current.dataset.dragging = "true";
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const pose = poseRef.current;
    if (drag?.id === event.pointerId) {
      const now = performance.now();
      const delta = Math.max(8, now - drag.time);
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.vx = clamp(drag.vx * 0.35 + (dx / delta) * 0.65, -1.3, 1.3);
      drag.vy = clamp(drag.vy * 0.35 + (dy / delta) * 0.65, -1.3, 1.3);
      Object.assign(pose, bounded(pose.x + dx, pose.y + dy));
      if (!reducedRef.current) {
        pose.rx = REST.rx + clamp(drag.vy * 6, -6, 6);
        pose.ry = REST.ry - clamp(drag.vx * 6, -6, 6);
        pose.rz = REST.rz + clamp(drag.vx * 2, -2, 2);
      }
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.time = now;
      paint();
    } else if (
      event.pointerType === "mouse" &&
      !reducedRef.current &&
      frameRef.current === undefined
    ) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      pose.rx = REST.rx + (0.5 - y) * 6;
      pose.ry = REST.ry + (x - 0.5) * 6;
      rootRef.current?.style.setProperty("--light-x", `${x * 100}%`);
      rootRef.current?.style.setProperty("--light-y", `${y * 100}%`);
      paint();
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (rootRef.current) rootRef.current.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    const recent = performance.now() - drag.time < 90;
    settle(
      cancelled || !recent ? 0 : drag.vx,
      cancelled || !recent ? 0 : drag.vy,
    );
  }

  function moveKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    delete event.currentTarget.dataset.pointerFocus;
    if (event.key === "Home") {
      event.preventDefault();
      settle(0, 0, true);
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    stop();
    const step = event.shiftKey ? 24 : 12;
    const pose = poseRef.current;
    Object.assign(
      pose,
      bounded(pose.x + direction[0] * step, pose.y + direction[1] * step),
    );
    if (!reducedRef.current) {
      pose.rx = REST.rx + direction[1] * 2;
      pose.ry = REST.ry - direction[0] * 2;
    }
    paint();
    settle();
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-label-card
      data-specifications={Boolean(profile)}
      data-expanded={expanded}
      data-visible={visible}
      data-tone={tone}
      data-x="0"
      data-y="0"
      data-dragging="false"
      aria-hidden={!visible}
      inert={!visible}
    >
      <div ref={objectRef} className={styles.object}>
        <div
          ref={faceRef}
          className={styles.card}
          role="group"
          aria-label="Move label card"
          aria-describedby={instructionId}
          tabIndex={visible ? 0 : -1}
          onPointerDown={beginDrag}
          onPointerMove={movePointer}
          onPointerUp={(event) => endDrag(event)}
          onPointerCancel={(event) => endDrag(event, true)}
          onLostPointerCapture={(event) => endDrag(event, true)}
          onPointerLeave={() => {
            if (!dragRef.current) settle();
          }}
          onKeyDown={moveKey}
          onBlur={(event) => {
            delete event.currentTarget.dataset.pointerFocus;
          }}
        >
          <div className={styles.shadow} aria-hidden="true" />
          <div className={styles.back} aria-hidden="true">
            ATOMA
          </div>
          <div className={styles.edgeTop} aria-hidden="true" />
          <div className={styles.edgeBottom} aria-hidden="true" />
          <div className={styles.edgeLeft} aria-hidden="true" />
          <div className={styles.edgeRight} aria-hidden="true" />
          <LabelCardFace
            title={title}
            application={application}
            format={format}
            quantity={quantity}
            annotation={annotation}
            reference={reference}
            profile={profile}
            visible={visible}
            showReference={showReference}
            onEditReference={onEditReference}
          />
        </div>
        <div className={styles.controls}>
          <p id={instructionId}>
            <ScrambleText text="Drag to move" periodic />
            <span className={styles.accessible}>
              . Arrow keys move the card. Hold Shift for larger steps. Home
              resets its position.
            </span>
          </p>
          <button
            type="button"
            aria-label="Reset label position"
            onClick={() => settle(0, 0, true)}
          >
            <ScrambleText text="Reset" interactive />{" "}
            <span aria-hidden="true">↺</span>
          </button>
        </div>
      </div>
    </div>
  );
}
