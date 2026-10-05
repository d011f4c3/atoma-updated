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
};

/** A static material photograph, sized by its surrounding product card. */
export function ShopMaterialImage({ src, alt }: ShopMaterialImageProps) {
  const [mask, setMask] = useState<{
    source: string;
    url: string | null;
  } | null>(null);
  const canMask = powderPhotographs.has(src);
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

  return (
    <div
      className={styles.root}
      data-masked={Boolean(currentMask)}
      data-pending={pending}
    >
      <Image
        src={src}
        alt={alt}
        fill
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
    </div>
  );
}
