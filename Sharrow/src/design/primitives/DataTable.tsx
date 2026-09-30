import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  width?: string
  /** Enables sorting on this column. */
  sortable?: boolean
  sortValue?: (row: T) => number | string
  /** Header hint for screen readers when the header is an icon/number. */
  headerLabel?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  caption: string
  loading?: boolean
  loadingRows?: number
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  /** Initial sort — applied only when `onSortChange` is not provided. */
  initialSort?: { columnId: string; direction: 'asc' | 'desc' }
  dense?: boolean
  className?: string
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

/**
 * Semantic data table with sortable headers, sticky head and skeleton rows.
 * Rows are keyboard-activatable when `onRowClick` is provided.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  loading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  rowClassName,
  initialSort,
  dense = false,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.id === sort.columnId)
    if (!col?.sortValue) return rows
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [rows, sort, columns])

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return
    setSort((prev) =>
      prev?.columnId === col.id
        ? { columnId: col.id, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId: col.id, direction: 'asc' },
    )
  }

  if (!loading && rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-md border border-line bg-surface-1', className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => {
              const active = sort?.columnId === col.id
              return (
                <th
                  key={col.id}
                  scope="col"
                  style={{ width: col.width }}
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'sticky top-0 z-10 bg-surface-1 px-4 py-2.5 font-medium text-ink-3',
                    'text-2xs uppercase tracking-[0.06em]',
                    alignClass[col.align ?? 'left'],
                    col.sortable && 'cursor-pointer select-none hover:text-ink-2',
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={cn(
                        'inline-flex items-center gap-1.5 transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                        active && 'text-ink',
                      )}
                      aria-label={`Sort by ${col.headerLabel ?? (typeof col.header === 'string' ? col.header : col.id)}`}
                    >
                      {col.header}
                      {active ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-line/70">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3">
                      <Skeleton variant="text" width={i % 2 ? '60%' : '80%'} />
                    </td>
                  ))}
                </tr>
              ))
            : sorted.map((row) => (
                <tr
                  key={getRowId(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b border-line/70 transition-colors last:border-0',
                    'hover:bg-surface-2',
                    onRowClick && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        dense ? 'px-4 py-2' : 'px-4 py-3',
                        'text-ink-2',
                        alignClass[col.align ?? 'left'],
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && rows.length === 0 && !emptyState && (
        <EmptyState size="sm" title="Nothing to show yet" body="This table will populate as records arrive." />
      )}
    </div>
  )
}
