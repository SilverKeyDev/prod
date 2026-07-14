import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type AnalyticsTableColumn<T> = {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
  /** When true, clicks on this cell do not trigger onRowPress. */
  stopRowPress?: boolean;
};

type Props<T> = {
  columns: AnalyticsTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  onRowPress?: (row: T) => void;
};

export function AnalyticsDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No rows.",
  className = "w-full text-left text-sm",
  onRowPress,
}: Props<T>) {
  return (
    <Box className="overflow-x-auto">
      <table className={className}>
        <thead>
          <tr className="border-border border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={
                  col.headerClassName ??
                  "text-text-secondary py-2.5 pr-4 text-xs font-medium uppercase tracking-wide"
                }
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={
                onRowPress
                  ? "border-border/60 hover:bg-background-muted/40 cursor-pointer border-b transition-colors"
                  : "border-border/60 hover:bg-background-muted/25 border-b transition-colors"
              }
              onClick={onRowPress ? () => onRowPress(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={col.cellClassName ?? "py-3 pr-4 align-middle"}
                  onClick={
                    col.stopRowPress
                      ? (event) => {
                          event.stopPropagation();
                        }
                      : undefined
                  }
                >
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
