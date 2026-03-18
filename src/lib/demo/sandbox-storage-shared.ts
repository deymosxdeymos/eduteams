import {
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
} from "@/lib/demo/sandbox-shared";

export function isRelevantDemoSandboxStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
) {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    event.storageArea === window.localStorage &&
    (event.key === null ||
      event.key === DEMO_SANDBOX_STORAGE_KEY ||
      event.key.startsWith(`${DEMO_SANDBOX_STORAGE_KEY}:`))
  );
}

export function subscribeToDemoSandboxChanges(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (isRelevantDemoSandboxStorageEvent(event)) {
      onChange();
    }
  };

  window.addEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, onChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, onChange);
    window.removeEventListener("storage", handleStorage);
  };
}
