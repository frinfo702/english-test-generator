/**
 * A pixel clock face: a ring, and a wedge swept clockwise from 12 o'clock
 * over the elapsed fraction. Rows are PixelArt grids ("." is empty).
 */
export function clockFace(
  fraction: number,
  size = 15,
): { ring: string[]; wedge: string[] } {
  const c = (size - 1) / 2;
  const radius = c - 1;
  const swept = Math.min(1, Math.max(0, fraction));
  const ring: string[] = [];
  const wedge: string[] = [];
  for (let y = 0; y < size; y++) {
    let ringRow = "";
    let wedgeRow = "";
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      // Half-open band: a closed interval doubles the ring on the axes, an
      // open one drops the four axis cells and leaves gaps.
      const onRing = d > radius - 0.5 && d <= radius + 0.5;
      // Clockwise from 12 o'clock, 0..1.
      const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
      const inFace = d <= radius - 0.5;
      // The centre cell is the hub, drawn with the ring.
      ringRow += onRing || d === 0 ? "o" : ".";
      wedgeRow += inFace && d > 0 && turn < swept ? "w" : ".";
    }
    ring.push(ringRow);
    wedge.push(wedgeRow);
  }
  return { ring, wedge };
}
