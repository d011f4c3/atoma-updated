"use client";

import Link from "next/link";
import { createContext, useContext, type ComponentProps } from "react";
import {
  heroSevenDestination,
  heroSevenHref,
  type HeroSevenBasePath,
  type HeroSevenState,
} from "@/lib/new-hero-seven-view";

type Navigation = {
  state: HeroSevenState;
  basePath: HeroSevenBasePath;
  navigate: (href: string) => void;
};
export const HeroSevenNavigation = createContext<Navigation | null>(null);
export const useHeroSevenNavigation = () => useContext(HeroSevenNavigation);

export function HeroSevenLink({
  href,
  onClick,
  ...props
}: ComponentProps<"a"> & { href: string }) {
  const navigation = useHeroSevenNavigation();
  const destination = heroSevenDestination(href, navigation?.basePath);
  if (!navigation || !destination)
    return <Link href={href} onClick={onClick} {...props} />;
  const nextHref = heroSevenHref(destination, navigation.basePath);
  return (
    <a
      {...props}
      href={nextHref}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target !== "_self")
        )
          return;
        event.preventDefault();
        navigation.navigate(nextHref);
      }}
    />
  );
}
