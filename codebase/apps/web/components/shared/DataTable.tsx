'use client';

import { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { TableRowSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { id?: string }> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  isLoading = false,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no items to display.',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = useCallback(
    (key: keyof T) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') {
          setSortDir(null);
          setSortKey(null);
        } else setSortDir('asc');
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey, sortDir]
  );

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === bVal) return 0;
    const result = aVal < bVal ? -1 : 1;
    return sortDir === 'asc' ? result : -result;
  });

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  'text-xs font-semibold text-slate-600 uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-slate-900 transition-colors',
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <span className="text-slate-400">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
                        ) : sortDir === 'desc' ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={columns.length} />
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                />
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <TableRow
                key={row.id ?? rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-slate-50'
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={String(col.key)}
                    className={cn('text-sm text-slate-700', col.className)}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
