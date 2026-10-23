"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { powderMask } from "@/lib/powder-mask";
import styles from "./shop-material-image.module.css";

const powderPhotographs = new Set([
  "/images/matcha/culinary.jpg",
  "/images/matcha/latte.jpg",
  "/images/matcha/tea-service.jpg",
]);

type ShopMaterialImageProps = {
  src: string;
  alt: string;
  showWhilePreparing?: boolean;
  framing?: "source" | "powder";
};

/** A static material photograph, sized by its surrounding product card. */
export function ShopMaterialImage({
  src,
  alt,
  showWhilePreparing = false,
  framing = "source",
}: ShopMaterialImageProps) {
  const [mask, setMask] = useState<{
    source: string;
    url: string | null;
  } | null>(null);
  const canMask = powderPhotographs.has(src);
  const framePowder = framing === "powder" && canMask;
  const currentMask = mask?.source === src ? mask.url : null;
  const pending = canMask && mask?.source !== src;

  useEffect(() => {
    if (!powderPhotographs.has(src)) return;
    let current = true;
    void powderMask(src).then((url) => {
      if (current) setMask({ source: src, url });
    });
    return () => {
      current = false;
    };
  }, [src]);

  const photograph = (
    <Image
      src={src}
      alt={alt}
      {...(framePowder ? { width: 1200, height: 900 } : { fill: true })}
      unoptimized
      sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
      className={styles.image}
      style={
        currentMask
          ? {
              maskImage: `url("${currentMask}")`,
              WebkitMaskImage: `url("${currentMask}")`,
            }
          : undefined
      }
      draggable={false}
    />
  );

  return (
    <div
      className={styles.root}
      data-masked={Boolean(currentMask)}
      data-pending={pending}
      data-show-while-preparing={showWhilePreparing || undefined}
      data-framing={framePowder ? "powder" : undefined}
    >
      {framePowder ? (
        <div className={styles.powderFrame}>{photograph}</div>
      ) : (
        photograph
      )}
    </div>
  );
}
