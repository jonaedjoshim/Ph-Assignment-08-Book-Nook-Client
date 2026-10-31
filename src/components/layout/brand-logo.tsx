"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  iconSize?: number;
  priority?: boolean;
}

const subscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export default function BrandLogo({
  className,
  iconSize = 42,
  priority = false,
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const icon =
    mounted && resolvedTheme === "dark"
      ? "/assets/brand/icon-dark.svg"
      : "/assets/brand/icon-light.svg";

  return (
    <Link
      href="/"
      aria-label="BookNook Home"
      className={cn("inline-flex shrink-0 items-center gap-1", className)}
    >
      <Image
        src={icon}
        alt=""
        width={iconSize}
        height={iconSize}
        priority={priority}
        className="shrink-0 object-contain"
        style={{
          width: iconSize,
          height: iconSize,
        }}
      />

      <span className="font-serif text-[30px] font-semibold leading-none tracking-[-0.035em] text-foreground">
        BookNook
      </span>
    </Link>
  );
}