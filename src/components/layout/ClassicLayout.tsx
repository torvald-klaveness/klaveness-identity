import { BlockContent } from "@/components/blocks/Block";
import type { ClassicLayout as ClassicLayoutData, ClassicRow } from "@/content/types";

/**
 * Squarespace "classic editor" layout: rows of columns on a 12-column grid.
 * Columns stack on screens up to 767px wide.
 */
function Row({ row, parentSpan }: { row: ClassicRow; parentSpan: number }) {
  return (
    <div className="classic-row">
      {row.cols.map((col, i) => (
        <div
          key={i}
          className="classic-col"
          style={{ width: `${(col.span / parentSpan) * 100}%` }}
        >
          {col.items.map((item, j) =>
            "row" in item ? (
              <Row key={j} row={item.row} parentSpan={col.span} />
            ) : (
              <div key={item.id} className={`classic-block classic-block--${item.type}`}>
                <BlockContent
                  block={item}
                  placement={{
                    sizes: `(max-width: 767px) 100vw, ${Math.round((col.span / 12) * 100)}vw`,
                  }}
                />
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

export function ClassicLayout({ layout }: { layout: ClassicLayoutData }) {
  return (
    <div className="classic">
      {layout.rows.map((row, i) => (
        <Row key={i} row={row} parentSpan={12} />
      ))}
    </div>
  );
}
