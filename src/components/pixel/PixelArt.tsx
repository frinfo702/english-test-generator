import { memo } from "react";

interface PixelArtProps {
  /** Layers are painted in order; "." (or a missing cell) is transparent. */
  layers: readonly (readonly string[])[];
  palette: Record<string, string>;
  width: number;
  height: number;
  className?: string;
  title?: string;
}

/**
 * Renders character grids as a crisp SVG. Horizontal runs of one colour are
 * merged into a single rect, so a 32×26 sprite is ~150 nodes rather than 800.
 */
export const PixelArt = memo(function PixelArt({
  layers,
  palette,
  width,
  height,
  className,
  title,
}: PixelArtProps) {
  const rects: React.ReactNode[] = [];
  layers.forEach((rows, li) => {
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let end = x + 1;
        while (end < row.length && row[end] === ch) end++;
        const fill = palette[ch];
        if (fill) {
          rects.push(
            <rect
              key={`${li}-${y}-${x}`}
              x={x}
              y={y}
              width={end - x}
              height={1}
              fill={fill}
            />,
          );
        }
        x = end;
      }
    });
  });

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
});
