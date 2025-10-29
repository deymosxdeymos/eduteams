import { useMemo } from 'react';
import { useDebounce } from './use-debounce';

type KeyOf<T> = Extract<keyof T, string>;

interface UseFuzzySearchProps<T> {
  data: T[];
  searchTerm: string;
  keys: KeyOf<T>[];
  debounceDelay?: number;
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) i++;
  }
  return i === needle.length;
}

function levenshteinWithin(a: string, b: string, max: number): number | null {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return null;

  // Use a single array for better memory efficiency
  const dp = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) dp[j] = j;

  for (let i = 1; i <= la; i++) {
    let prev = i - 1;
    let curr = i;
    let minInRow = curr;
    for (let j = 1; j <= lb; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        curr = prev;
      } else {
        curr = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      dp[j - 1] = prev;
      prev = tmp;
      dp[j] = curr;
      minInRow = Math.min(minInRow, curr);
    }
    // Early exit if minimum distance in this row exceeds max
    if (minInRow > max) return null;
  }
  return dp[lb] <= max ? dp[lb] : null;
}

function fuzzyMatch(haystackRaw: string, needleRaw: string): boolean {
  const haystack = normalize(haystackRaw);
  const needle = normalize(needleRaw);
  if (!needle) return true;

  // Fast path: exact substring match
  if (haystack.includes(needle)) return true;

  // Fast path: subsequence match (cheaper than Levenshtein)
  if (isSubsequence(needle, haystack)) return true;

  // Only do expensive Levenshtein for short strings
  if (needle.length > 10) return false;

  const words = haystack.split(/[^a-z0-9]+/g).filter(Boolean);
  const allowed = needle.length <= 4 ? 1 : 2;
  for (const w of words) {
    // Skip words that differ too much in length
    if (Math.abs(w.length - needle.length) > allowed) continue;
    const d = levenshteinWithin(w, needle, allowed);
    if (d !== null && d <= allowed) return true;
  }
  return false;
}

export function useFuzzySearch<T>({
  data,
  searchTerm,
  keys,
  debounceDelay = 300,
}: UseFuzzySearchProps<T>): T[] {
  const debounced = useDebounce(searchTerm, debounceDelay);

  const filtered = useMemo(() => {
    const term = normalize(debounced);
    if (!term) return data;
    return data.filter(item =>
      keys.some(key => {
        const value = (item as Record<string, unknown>)[key];
        if (value == null) return false;
        const str = String(value);
        return fuzzyMatch(str, term);
      })
    );
  }, [data, debounced, keys]);

  return filtered;
}
