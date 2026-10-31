"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function useCurrentYear() {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => 2026,
  );
}

export default function Copyright() {
  const year = useCurrentYear();

  return (
    <p className="text-xs text-muted-foreground">
      © {year} BookNook. All rights reserved.
    </p>
  );
}
