import type { ReactNode } from 'react'

type DataTableProps = {
  headers: string[]
  children: ReactNode
}

// Scrolls sideways inside its own box, so wide tables never make the whole page scroll on a phone.
export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm tabular-nums [&_td]:border-b [&_td]:border-line [&_td]:px-1.5 [&_td]:py-2.5">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="border-b-2 border-ink px-1.5 py-2 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-muted uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
