import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type AnalyticsTableColumn<T> = {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: AnalyticsTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
};

export function AnalyticsDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No rows.",
  className = "w-full text-left text-sm",
}: Props<T>) {
  return (
    <Box className="overflow-x-auto">
      <table className={className}>
        <thead>
          <tr className="border-border border-b">
            {columns.map((col) => (
              <th key={col.key} className={col.headerClassName ?? "py-2 pr-4 font-medium"}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-border/60 border-b">
              {columns.map((col) => (
                <td key={col.key} className={col.cellClassName ?? "py-2 pr-4"}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <Box className="py-6 text-center text-sm opacity-60">{emptyMessage}</Box>
      ) : null}
    </Box>
  );
}
