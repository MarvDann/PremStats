import { JSX, splitProps, For, createSignal, createMemo } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const tableVariants = tv({
  base: 'w-full caption-bottom text-sm',
  variants: {
    variant: {
      default: '',
      striped: '[&_tbody_tr:nth-child(odd)]:bg-muted/50'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export interface Column<T> {
  key: string
  header: string
  accessor: (item: T) => JSX.Element | string | number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface DataTableProps<T> extends JSX.HTMLAttributes<HTMLTableElement> {
  data: T[]
  columns: Column<T>[]
  variant?: 'default' | 'striped'
  sortable?: boolean
  class?: string
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T> (props: DataTableProps<T>) {
  const [local, others] = splitProps(props, ['data', 'columns', 'variant', 'sortable', 'class'])
  const [sortColumn, setSortColumn] = createSignal<string | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection>(null)

  const handleSort = (columnKey: string) => {
    if (!local.sortable) return
    
    const column = local.columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn() === columnKey) {
      if (sortDirection() === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection() === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = createMemo(() => {
    if (!sortColumn() || !sortDirection()) {
      return local.data
    }

    const column = local.columns.find(col => col.key === sortColumn()!)
    if (!column) return local.data

    return [...local.data].sort((a, b) => {
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)
      
      let aSort: string | number
      let bSort: string | number
      
      if (typeof aValue === 'string' || typeof aValue === 'number') {
        aSort = aValue
      } else {
        aSort = String(aValue)
      }
      
      if (typeof bValue === 'string' || typeof bValue === 'number') {
        bSort = bValue
      } else {
        bSort = String(bValue)
      }

      if (typeof aSort === 'number' && typeof bSort === 'number') {
        return sortDirection() === 'asc' ? aSort - bSort : bSort - aSort
      }

      const aStr = String(aSort).toLowerCase()
      const bStr = String(bSort).toLowerCase()
      
      if (sortDirection() === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
      }
    })
  })

  const getSortIcon = (columnKey: string) => {
    if (sortColumn() !== columnKey) {
      return (
        <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    if (sortDirection() === 'asc') {
      return (
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      )
    }

    return (
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const getAlignmentClass = (align?: string) => {
    switch (align) {
    case 'center': return 'text-center'
    case 'right': return 'text-right'
    default: return 'text-left'
    }
  }

  return (
    <div class="relative w-full overflow-auto">
      <table
        class={cn(tableVariants({ variant: local.variant }), local.class)}
        {...others}
      >
        <thead class="[&_tr]:border-b">
          <tr class="border-b transition-colors hover:bg-muted/50">
            <For each={local.columns}>
              {(column) => (
                <th
                  class={cn(
                    'h-12 px-4 font-medium text-muted-foreground',
                    getAlignmentClass(column.align),
                    column.sortable && local.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                  )}
                  style={column.width ? { width: column.width } : {}}
                  onClick={() => handleSort(column.key)}
                >
                  <div class="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && local.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody class="[&_tr:last-child]:border-0">
          <For each={sortedData()}>
            {(item) => (
              <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <For each={local.columns}>
                  {(column) => (
                    <td class={cn('p-4', getAlignmentClass(column.align))}>
                      {column.accessor(item)}
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}