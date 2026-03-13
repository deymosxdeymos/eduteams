"use client";

import { Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InputRounded } from "@/components/ui/input-rounded";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";

interface MultiSelectComboboxBadgesProps {
  /** Current selected values */
  value: string[];
  /** Callback when value changes */
  onChange: (value: string[]) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Optional API endpoint to fetch suggestions (GET with ?q=search) */
  suggestionsEndpoint?: string;
  /** Optional static suggestions */
  suggestions?: string[];
  /** Loading state for external operations */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Label for empty state when no suggestions */
  emptyLabel?: string;
  /** Label for creating new items */
  createLabel?: (query: string) => string;
  /** Whether to show the combobox (false = simple input with Enter) */
  showCombobox?: boolean;
}

export function MultiSelectComboboxBadges({
  value,
  onChange,
  placeholder,
  suggestionsEndpoint,
  suggestions: staticSuggestions = [],
  loading = false,
  disabled = false,
  emptyLabel = "No results found",
  createLabel,
  showCombobox = true,
}: MultiSelectComboboxBadgesProps) {
  const [inputValue, setInputValue] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fetchedSuggestions, setFetchedSuggestions] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fetchRequestIdRef = useRef(0);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const listboxId = useId();

  // Debounce the input value to reduce API calls (300ms delay)
  const debouncedInputValue = useDebounce(inputValue, 300);

  const fetchSuggestions = useCallback(
    async (query: string, requestId: number, signal: AbortSignal) => {
      if (!suggestionsEndpoint) {
        return;
      }

      try {
        const url = new URL(suggestionsEndpoint, window.location.origin);
        const trimmedQuery = query.trim();

        // Allow empty query to fetch initial suggestions.
        if (trimmedQuery) {
          url.searchParams.set("q", trimmedQuery);
        }

        const response = await fetch(url.toString(), { signal });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: Array<string | { name?: string }>;
        };
        const names =
          payload.data
            ?.map((item) => (typeof item === "string" ? item : item.name))
            .filter((item): item is string => Boolean(item)) ?? [];

        if (fetchRequestIdRef.current === requestId) {
          setFetchedSuggestions(names);
          lastFetchedKeyRef.current = `${suggestionsEndpoint}::${query.trim()}`;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch suggestions:", error);
      } finally {
        if (fetchRequestIdRef.current === requestId) {
          setIsFetching(false);
        }
      }
    },
    [suggestionsEndpoint],
  );

  useEffect(() => {
    if (!suggestionsEndpoint) {
      fetchRequestIdRef.current += 1;
      setFetchedSuggestions([]);
      setIsFetching(false);
      lastFetchedKeyRef.current = null;
      return;
    }

    if (!showCombobox || !popoverOpen) {
      fetchRequestIdRef.current += 1;
      setIsFetching(false);
      return;
    }

    const query = debouncedInputValue.trim();
    const fetchKey = `${suggestionsEndpoint}::${query}`;
    if (lastFetchedKeyRef.current === fetchKey) {
      setIsFetching(false);
      return;
    }

    const controller = new AbortController();
    const requestId = fetchRequestIdRef.current + 1;
    fetchRequestIdRef.current = requestId;
    setIsFetching(true);

    void fetchSuggestions(query, requestId, controller.signal);

    return () => {
      controller.abort();
      setIsFetching(false);
    };
  }, [debouncedInputValue, suggestionsEndpoint, fetchSuggestions, popoverOpen, showCombobox]);

  // Combine static and fetched suggestions
  const allSuggestions = useMemo(() => {
    const combined = [...staticSuggestions, ...fetchedSuggestions];
    // Deduplicate (case-insensitive)
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of combined) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique;
  }, [staticSuggestions, fetchedSuggestions]);

  // Filter suggestions based on input and exclude already selected
  const filteredSuggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return allSuggestions.filter((s) => !value.includes(s));
    return allSuggestions.filter((s) => s.toLowerCase().includes(query) && !value.includes(s));
  }, [allSuggestions, inputValue, value]);

  const trimmedInput = inputValue.trim();
  const showCreate =
    createLabel &&
    trimmedInput.length > 0 &&
    !value.some((v) => v.toLowerCase() === trimmedInput.toLowerCase()) &&
    !filteredSuggestions.some((s) => s.toLowerCase() === trimmedInput.toLowerCase());

  const addItem = useCallback(
    (item: string) => {
      const trimmed = item.trim();
      if (!trimmed || value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
        return;
      }
      onChange([...value, trimmed]);
      setInputValue("");
      setPopoverOpen(false);
    },
    [value, onChange],
  );

  const removeItem = useCallback(
    (item: string) => {
      onChange(value.filter((v) => v !== item));
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        // If there's a filtered suggestion, add the first one
        if (filteredSuggestions.length > 0) {
          addItem(filteredSuggestions[0]);
        } else if (showCreate) {
          addItem(trimmedInput);
        } else if (trimmedInput) {
          // In simple mode or when no suggestions match, add the input
          addItem(trimmedInput);
        }
      }
    },
    [showCreate, trimmedInput, addItem, filteredSuggestions],
  );

  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
  }, []);

  // Simple input mode (no combobox)
  if (!showCombobox) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-x-2">
          <InputRounded
            className="flex-1"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
          />
          <Button
            variant="onboarding"
            className="rounded-full w-12 h-12 shrink-0"
            onClick={() => addItem(trimmedInput)}
            disabled={!trimmedInput || disabled || loading}
            type="button"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item}
              className="bg-white text-neutral-800 border border-black rounded-full px-4 py-2 shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-900">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  aria-label={`Remove ${item}`}
                  className="p-1 -m-1 cursor-pointer text-stone-900 hover:text-stone-700 touch-manipulation"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // Combobox mode with autocomplete
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-x-2">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
          <PopoverAnchor asChild>
            <div className="flex-1">
              <InputRounded
                ref={inputRef}
                className="w-full"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setPopoverOpen(true);
                  // Initial fetch is handled by useEffect with debounced value
                }}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget as HTMLElement | null;
                  if (!relatedTarget) {
                    return;
                  }
                  if (relatedTarget.closest("[data-radix-popper-content-wrapper]")) {
                    return;
                  }
                  if (relatedTarget === e.currentTarget) {
                    return;
                  }
                  setPopoverOpen(false);
                }}
                disabled={disabled || loading}
                role="combobox"
                aria-expanded={popoverOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-haspopup="listbox"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            role="listbox"
            id={listboxId}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              const inputElement = inputRef.current;
              const inputWrapper =
                inputElement?.closest("div.flex-1") || inputElement?.parentElement;
              const isInput =
                target === inputElement ||
                inputElement?.contains(target) ||
                inputWrapper?.contains(target);
              if (isInput) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              const inputElement = inputRef.current;
              const inputWrapper =
                inputElement?.closest("div.flex-1") || inputElement?.parentElement;
              const isInput =
                target === inputElement ||
                inputElement?.contains(target) ||
                inputWrapper?.contains(target);
              if (isInput) {
                e.preventDefault();
              }
            }}
            onFocusOutside={(e) => {
              const target = e.target as HTMLElement;
              const inputElement = inputRef.current;
              const inputWrapper =
                inputElement?.closest("div.flex-1") || inputElement?.parentElement;
              const isInput =
                target === inputElement ||
                inputElement?.contains(target) ||
                inputWrapper?.contains(target);
              if (isInput) {
                e.preventDefault();
              }
            }}
          >
            <Command className="max-h-[300px]">
              <CommandInput
                value={inputValue}
                onValueChange={handleInputChange}
                placeholder={placeholder}
                className="hidden"
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                {isFetching ? (
                  <div
                    className="flex items-center justify-center py-6 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Loading...</span>
                  </div>
                ) : filteredSuggestions.length > 0 ? (
                  <CommandGroup className="p-1" role="group" aria-label="Suggestions">
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => addItem(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                        role="option"
                        className="flex items-center"
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" aria-hidden="true" />
                        <span className="text-sm">{suggestion}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : showCreate ? (
                  <CommandGroup className="p-1" role="group" aria-label="Create">
                    <CommandItem
                      key={`create-${trimmedInput}`}
                      value={trimmedInput}
                      onSelect={() => addItem(trimmedInput)}
                      onMouseDown={(e) => e.preventDefault()}
                      role="option"
                      className="flex items-center"
                    >
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span className="text-sm">
                        {createLabel ? createLabel(trimmedInput) : `Create "${trimmedInput}"`}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                ) : trimmedInput.length > 0 ? (
                  <div
                    className="p-4 text-center text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    {emptyLabel}
                  </div>
                ) : (
                  <div
                    className="p-4 text-center text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    Start typing to search for skills
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          variant="onboarding"
          className="rounded-full w-12 h-12 shrink-0"
          onClick={() => addItem(trimmedInput)}
          disabled={!trimmedInput || disabled || loading}
          type="button"
          aria-label={
            loading
              ? "Adding item..."
              : trimmedInput
                ? createLabel
                  ? createLabel(trimmedInput)
                  : `Create "${trimmedInput}"`
                : "Add item"
          }
        >
          {loading ? (
            <LoadingSpinner size="sm" className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Plus className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge
            key={item}
            className="bg-white text-neutral-800 border border-black rounded-full px-4 py-2 shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-900">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(item)}
                aria-label={`Remove ${item}`}
                className="p-1 -m-1 cursor-pointer text-stone-900 hover:text-stone-700 touch-manipulation"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </Badge>
        ))}
      </div>
    </div>
  );
}
