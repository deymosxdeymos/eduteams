import { useMemo } from 'react';
import { useDebounce } from './use-debounce';
import type { Class } from '@/types/dashboard';

interface UseSearchProps {
  data: Class[];
  searchTerm: string;
  searchFields?: (keyof Class)[];
  debounceDelay?: number;
}

/**
 * Custom hook for searching and filtering classes with debouncing
 * @param data - Array of classes to search through
 * @param searchTerm - The search term
 * @param searchFields - Fields to search in (defaults to title, classCode, academicYear)
 * @param debounceDelay - Debounce delay in milliseconds (defaults to 300)
 * @returns Filtered array of classes
 */
export function useSearch({
  data,
  searchTerm,
  searchFields = ['title', 'classCode', 'academicYear'],
  debounceDelay = 300,
}: UseSearchProps): Class[] {
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return data;
    }

    const lowercaseSearchTerm = debouncedSearchTerm.toLowerCase();

    return data.filter(item =>
      searchFields.some(field => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(lowercaseSearchTerm);
        }
        if (typeof fieldValue === 'number') {
          return fieldValue.toString().includes(lowercaseSearchTerm);
        }
        return false;
      })
    );
  }, [data, debouncedSearchTerm, searchFields]);

  return filteredData;
}
