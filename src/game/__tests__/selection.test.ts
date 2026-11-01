import { describe, expect, it } from 'vitest';
import { areAdjacent, diagonalKey, neighbours } from '../grid';
import { dragTo, pathsEqual, spell, tapCell } from '../selection';

const COLS = 6;
const ROWS = 8;
const at = (r: number, c: number) => r * COLS + c;
const none = new Set<number>();

describe('grid geometry', () => {
  it('treats all eight surrounding cells as adjacent', () => {
    const centre = at(3, 3);
    for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      expect(areAdjacent(centre, at(3 + dr, 3 + dc), COLS)).toBe(true);
    }
    expect(areAdjacent(centre, centre, COLS)).toBe(false);
    expect(areAdjacent(centre, at(3, 5), COLS)).toBe(false);
    expect(areAdjacent(centre, at(5, 3), COLS)).toBe(false);
  });

  it('does not wrap around row edges', () => {
    // Last cell of row 0 and first cell of row 1 are consecutive indices but not neighbours.
    expect(areAdjacent(at(0, 5), at(1, 0), COLS)).toBe(false);
    expect(neighbours(at(0, 5), ROWS, COLS)).not.toContain(at(1, 0));
  });

  it('counts neighbours correctly at corners, edges and centre', () => {
    expect(neighbours(at(0, 0), ROWS, COLS)).toHaveLength(3);
    expect(neighbours(at(0, 2), ROWS, COLS)).toHaveLength(5);
    expect(neighbours(at(4, 2), ROWS, COLS)).toHaveLength(8);
  });

  it('gives both diagonals of a 2x2 square the same crossing key', () => {
    expect(diagonalKey(at(1, 1), at(2, 2), COLS)).toBe(diagonalKey(at(1, 2), at(2, 1), COLS));
    expect(diagonalKey(at(1, 1), at(1, 2), COLS)).toBe(-1);
  });
});

describe('dragTo', () => {
  it('extends horizontally, vertically and diagonally', () => {
    let path = [at(2, 2)] as readonly number[];
    path = dragTo(path, at(2, 3), COLS, none);
    path = dragTo(path, at(3, 3), COLS, none);
    path = dragTo(path, at(4, 4), COLS, none);
    path = dragTo(path, at(5, 3), COLS, none);
    expect(path).toEqual([at(2, 2), at(2, 3), at(3, 3), at(4, 4), at(5, 3)]);
  });

  it('ignores non-adjacent cells (fast drags never skip letters)', () => {
    const path = [at(2, 2)];
    expect(dragTo(path, at(2, 4), COLS, none)).toBe(path);
    expect(dragTo(path, at(4, 4), COLS, none)).toBe(path);
  });

  it('retracts when moving back onto the previous cell', () => {
    const path = [at(0, 0), at(0, 1), at(1, 2)];
    expect(dragTo(path, at(0, 1), COLS, none)).toEqual([at(0, 0), at(0, 1)]);
  });

  it('never revisits a cell already in the path', () => {
    const path = [at(0, 0), at(0, 1), at(1, 1)];
    // (0,0) is adjacent to (1,1) but already used and not the previous cell.
    expect(dragTo(path, at(0, 0), COLS, none)).toBe(path);
  });

  it('cannot enter cells that belong to found words', () => {
    const path = [at(0, 0)];
    expect(dragTo(path, at(0, 1), COLS, new Set([at(0, 1)]))).toBe(path);
  });

  it('does nothing without a starting cell or when hovering the head', () => {
    expect(dragTo([], at(0, 0), COLS, none)).toEqual([]);
    const path = [at(0, 0)];
    expect(dragTo(path, at(0, 0), COLS, none)).toBe(path);
  });
});

describe('tapCell', () => {
  it('starts, extends and submits a word', () => {
    let r = tapCell([], at(3, 0), COLS, none);
    expect(r).toEqual({ path: [at(3, 0)], submit: false });
    r = tapCell(r.path, at(2, 1), COLS, none);
    expect(r.path).toEqual([at(3, 0), at(2, 1)]);
    r = tapCell(r.path, at(2, 1), COLS, none);
    expect(r.submit).toBe(true);
  });

  it('starts a fresh selection when tapping a distant cell', () => {
    expect(tapCell([at(0, 0), at(0, 1)], at(6, 5), COLS, none)).toEqual({ path: [at(6, 5)], submit: false });
  });

  it('trims back when tapping an earlier selected cell', () => {
    const path = [at(0, 0), at(0, 1), at(0, 2), at(0, 3)];
    expect(tapCell(path, at(0, 1), COLS, none).path).toEqual([at(0, 0), at(0, 1)]);
  });

  it('ignores found cells', () => {
    const path = [at(0, 0)];
    expect(tapCell(path, at(0, 1), COLS, new Set([at(0, 1)]))).toEqual({ path, submit: false });
  });
});

describe('helpers', () => {
  it('spells a path and compares paths by order', () => {
    const letters = 'ABCDEF'.split('');
    expect(spell([0, 1, 2], letters)).toBe('ABC');
    expect(pathsEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(pathsEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });
});
