import type { ReactNode } from "react";
import {
  getProductDisplayIndex,
  type ProductCodePlacement,
} from "@/lib/product-display-index";
import styles from "./product-code-identity.module.css";

/** Presentation annotation. Product names and commerce identifiers stay intact. */
export function ProductCodeIdentity({
  className = "",
  handle,
  placement,
  children,
}: {
  className?: string;
  handle?: string;
  placement?: ProductCodePlacement;
  children: ReactNode;
}) {
  const code = placement && handle ? getProductDisplayIndex(handle) : undefined;

  return (
    <header
      className={`${className} ${styles.identity}`}
      data-code-placement={code ? placement : undefined}
      data-display-index={code}
    >
      {code && (
        <span className={styles.mark}>
          <span className={styles.srOnly}>Product code </span>
          {code}
        </span>
      )}
      {children}
    </header>
  );
}
