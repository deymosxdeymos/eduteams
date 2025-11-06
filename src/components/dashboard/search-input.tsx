'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ChangeEvent, ComponentProps, ReactNode } from 'react';
import type { Course } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import CreateClassModal from './create-class-modal';
import JoinClassModal from './join-class-modal';

type InputProps = ComponentProps<typeof Input>;

interface SearchInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'placeholder'> {
  onClassCreated?: (course?: Course) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  isStudent?: boolean;
  showClassActions?: boolean;
  leftSlot?: ReactNode;
  containerClassName?: string;
  inputWrapperClassName?: string;
  iconClassName?: string;
}

export function SearchInput({
  onClassCreated,
  searchValue = '',
  onSearchChange = () => {},
  placeholder,
  ariaLabel,
  isStudent = false,
  showClassActions = true,
  leftSlot,
  containerClassName,
  inputWrapperClassName,
  iconClassName,
  className,
  type,
  ...inputProps
}: SearchInputProps) {
  const t = useTranslations('dashboard.search');
  const actualPlaceholder = placeholder || t('placeholder');
  const actualAriaLabel = ariaLabel || actualPlaceholder;

  const effectiveLeftSlot =
    leftSlot ??
    (showClassActions ? (
      isStudent ? (
        <JoinClassModal onClassJoined={() => onClassCreated?.()} />
      ) : (
        <CreateClassModal onClassCreated={onClassCreated} />
      )
    ) : null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const hasLeftSlot = Boolean(effectiveLeftSlot);
  const containerBaseClass = hasLeftSlot
    ? 'flex items-center justify-between gap-4'
    : 'relative';

  const inputType = type || 'search';

  const inputWrapperClasses = cn(
    'relative',
    hasLeftSlot && showClassActions ? 'w-86' : 'w-full',
    inputWrapperClassName
  );

  const searchField = (
    <div className={inputWrapperClasses}>
      <Input
        {...inputProps}
        type={inputType}
        value={searchValue}
        onChange={handleChange}
        placeholder={actualPlaceholder}
        aria-label={actualAriaLabel}
        className={cn(
          'rounded-full pr-10 py-2.5 h-11 text-gray-700 placeholder:text-gray-400',
          className
        )}
      />
      <Search
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400',
          iconClassName
        )}
      />
    </div>
  );

  if (!hasLeftSlot) {
    return (
      <div className={cn(containerBaseClass, containerClassName)}>
        {searchField}
      </div>
    );
  }

  return (
    <div className={cn(containerBaseClass, containerClassName)}>
      <div className='shrink-0'>{effectiveLeftSlot}</div>
      {searchField}
    </div>
  );
}
