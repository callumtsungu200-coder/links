import { areAdjacent } from './grid';

/*
 * Pure selection mechanics shared by drag and tap input.
 *
 * Drag: moving onto a neighbour of the last cell extends the path; moving back
 * onto the previous cell retracts it (so players can undo mid-drag).
 *
 * Tap: tapping a neighbour of the last cell extends, tapping the last cell
 * again submits, tapping an earlier selected cell trims back to it, and tapping
 * anywhere else starts a fresh selection.
 */

export type Path = readonly number[];

export function dragTo(path: Path, cell: number, cols: number, blocked: ReadonlySet<number>): Path {
  if (path.length === 0 || blocked.has(cell)) return path;
  const last = path[path.length - 1];
  if (cell === last) return path;
  if (path.length >= 2 && cell === path[path.length - 2]) return path.slice(0, -1);
  if (path.includes(cell) || !areAdjacent(last, cell, cols)) return path;
  return [...path, cell];
}

export interface TapResult {
  path: Path;
  submit: boolean;
}

export function tapCell(path: Path, cell: number, cols: number, blocked: ReadonlySet<number>): TapResult {
  if (blocked.has(cell)) return { path, submit: false };
  if (path.length === 0) return { path: [cell], submit: false };
  const last = path[path.length - 1];
  if (cell === last) return { path, submit: true };
  const index = path.indexOf(cell);
  if (index >= 0) return { path: path.slice(0, index + 1), submit: false };
  if (areAdjacent(last, cell, cols)) return { path: [...path, cell], submit: false };
  return { path: [cell], submit: false };
}

export function pathsEqual(a: Path, b: Path): boolean {
  return a.length === b.length && a.every((cell, i) => cell === b[i]);
}

export function spell(path: Path, letters: readonly string[]): string {
  return path.map((cell) => letters[cell]).join('');
}
