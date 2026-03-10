'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  onChange: (key: string, value: string) => void;
  currentValues?: Record<string, string>;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterBar({
  filters,
  onChange,
  currentValues = {},
  searchPlaceholder = 'Search...',
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {/* Search input */}
      <div className="relative min-w-[200px] flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9 h-9 text-sm"
          value={currentValues['search'] ?? ''}
          onChange={(e) => onChange('search', e.target.value)}
        />
      </div>

      {/* Dropdown filters */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={currentValues[filter.key] ?? 'all'}
          onValueChange={(value) => onChange(filter.key, value)}
        >
          <SelectTrigger className="h-9 text-sm min-w-[130px] max-w-[180px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
