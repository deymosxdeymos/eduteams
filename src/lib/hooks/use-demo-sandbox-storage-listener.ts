"use client";

import { useEffect, useRef } from "react";
import { subscribeToDemoSandboxChanges } from "@/lib/demo/sandbox-storage-shared";

export function useDemoSandboxStorageListener(enabled: boolean, onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return subscribeToDemoSandboxChanges(() => {
      onChangeRef.current();
    });
  }, [enabled]);
}
