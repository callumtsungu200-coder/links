/** Geometry helpers for a rows x cols board addressed by flat cell index. */

export function toRowCol(cell: number, cols: number): [number, number] {
  return [Math.floor(cell / cols), cell % cols];
}

export function areAdjacent(a: number, b: number, cols: number): boolean {
  if (a === b) return false;
  const [ar, ac] = toRowCol(a, cols);
  const [br, bc] = toRowCol(b, cols);
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1;
}

export function neighbours(cell: number, rows: number, cols: number): number[] {
  const [r, c] = toRowCol(cell, cols);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
    }
  }
  return out;
}

/**
 * Two diagonal moves cross only if they are the two diagonals of the same
 * 2x2 square. Returns that square's key (its top-left cell), or -1 for an
 * orthogonal move.
 */
export function diagonalKey(a: number, b: number, cols: number): number {
  const [ar, ac] = toRowCol(a, cols);
  const [br, bc] = toRowCol(b, cols);
  if (ar === br || ac === bc) return -1;
  return Math.min(ar, br) * cols + Math.min(ac, bc);
}
