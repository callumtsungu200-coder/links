import { areAdjacent, diagonalKey, neighbours, toRowCol } from './grid';
import { createRng, shuffle, type Rng } from './rng';
import { COLS, MIN_WORD_LENGTH, ROWS, type PlacedWord, type PuzzleDefinition, type PuzzleInstance } from './types';

/*
 * Board generation
 * ----------------
 * A board is an exact tiling of the grid by word paths: every cell belongs to
 * exactly one word, consecutive letters of a word are 8-neighbours, and no two
 * diagonal moves cross each other. The spangram is placed first and must run
 * from one edge of the board to the opposite edge.
 *
 * We pick a subset of the puzzle's word pool whose lengths fill the remaining
 * cells exactly, then backtrack: repeatedly take the most constrained empty
 * cell, grow a random path from it for one of the remaining words, and prune
 * whenever an empty region can no longer be filled by the words that are left.
 */

const EMPTY = -1;
const TEMP = -2;
const MIN_WORDS = 4;
const MAX_WORDS = 10;
const SEARCH_BUDGET = 40_000;
const MAX_ATTEMPTS = 60;

interface Board {
  rows: number;
  cols: number;
  owner: Int16Array;
  diag: Uint8Array;
}

class BudgetExceeded extends Error {}

function makeBoard(rows: number, cols: number): Board {
  return {
    rows,
    cols,
    owner: new Int16Array(rows * cols).fill(EMPTY),
    diag: new Uint8Array(rows * cols),
  };
}

function setPath(board: Board, path: number[], value: number, diagValue: 0 | 1) {
  for (let i = 0; i < path.length; i++) {
    board.owner[path[i]] = value;
    if (i > 0) {
      const key = diagonalKey(path[i - 1], path[i], board.cols);
      if (key >= 0) board.diag[key] = diagValue;
    }
  }
}

/**
 * Randomised depth-first search for simple paths of exactly `length` empty
 * cells starting at `start`. Collects up to `limit` paths accepted by `accept`.
 */
function findPaths(
  board: Board,
  start: number,
  length: number,
  rng: Rng,
  limit: number,
  counter: { steps: number },
  accept: (path: number[]) => boolean = () => true,
  canContinue: (cell: number, remaining: number) => boolean = () => true,
): number[][] {
  const results: number[][] = [];
  const path: number[] = [start];
  board.owner[start] = TEMP;

  const dfs = (): void => {
    if (results.length >= limit) return;
    if (++counter.steps > SEARCH_BUDGET) throw new BudgetExceeded();
    if (path.length === length) {
      if (accept(path)) results.push(path.slice());
      return;
    }
    const last = path[path.length - 1];
    for (const next of shuffle(neighbours(last, board.rows, board.cols), rng)) {
      if (board.owner[next] !== EMPTY) continue;
      const key = diagonalKey(last, next, board.cols);
      if (key >= 0 && board.diag[key]) continue;
      if (!canContinue(next, length - path.length - 1)) continue;
      path.push(next);
      board.owner[next] = TEMP;
      if (key >= 0) board.diag[key] = 1;
      dfs();
      if (key >= 0) board.diag[key] = 0;
      board.owner[next] = EMPTY;
      path.pop();
      if (results.length >= limit) return;
    }
  };

  try {
    dfs();
  } finally {
    board.owner[start] = EMPTY;
  }
  return results;
}

/** Sizes of the connected regions of empty cells. */
function emptyRegionSizes(board: Board): number[] {
  const seen = new Uint8Array(board.owner.length);
  const sizes: number[] = [];
  for (let i = 0; i < board.owner.length; i++) {
    if (board.owner[i] !== EMPTY || seen[i]) continue;
    let size = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const cell = stack.pop()!;
      size++;
      for (const n of neighbours(cell, board.rows, board.cols)) {
        if (board.owner[n] === EMPTY && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    sizes.push(size);
  }
  return sizes;
}

/** Every empty region must be exactly fillable by some subset of the remaining word lengths. */
function regionsFeasible(board: Board, lengths: number[]): boolean {
  const total = lengths.reduce((a, b) => a + b, 0);
  const reachable = new Uint8Array(total + 1);
  reachable[0] = 1;
  for (const len of lengths) {
    for (let s = total; s >= len; s--) if (reachable[s - len]) reachable[s] = 1;
  }
  return emptyRegionSizes(board).every((size) => size <= total && reachable[size] === 1);
}

/** The empty cell with the fewest empty neighbours; it is the hardest to cover. */
function mostConstrainedCell(board: Board, rng: Rng): number {
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < board.owner.length; i++) {
    if (board.owner[i] !== EMPTY) continue;
    let free = 0;
    for (const n of neighbours(i, board.rows, board.cols)) if (board.owner[n] === EMPTY) free++;
    const score = free + rng() * 0.5;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

/** Choose a random subset of the pool whose lengths sum exactly to `target`. */
export function chooseWords(pool: readonly string[], target: number, rng: Rng): string[] | null {
  const words = shuffle(pool, rng);
  const chosen: string[] = [];
  const search = (index: number, remaining: number): boolean => {
    if (remaining === 0) return chosen.length >= MIN_WORDS;
    if (chosen.length >= MAX_WORDS || index >= words.length) return false;
    const word = words[index];
    const left = remaining - word.length;
    if (left === 0 || left >= MIN_WORD_LENGTH) {
      chosen.push(word);
      if (search(index + 1, remaining - word.length)) return true;
      chosen.pop();
    }
    return search(index + 1, remaining);
  };
  return search(0, target) ? chosen : null;
}

type Orientation = 'horizontal' | 'vertical';

function placeSpangram(board: Board, length: number, rng: Rng, counter: { steps: number }): number[] | null {
  const { rows, cols } = board;
  const options: Orientation[] = [];
  if (length >= cols) options.push('horizontal');
  if (length >= rows) options.push('vertical');
  if (!options.length) return null;
  const orientation = options[Math.floor(rng() * options.length)];

  // Distance (in moves) from a cell to the far edge, and whether a cell is on it.
  const distance = (cell: number) => {
    const [r, c] = toRowCol(cell, cols);
    return orientation === 'horizontal' ? cols - 1 - c : rows - 1 - r;
  };
  const starts = [];
  for (let i = 0; i < (orientation === 'horizontal' ? rows : cols); i++) {
    starts.push(orientation === 'horizontal' ? i * cols : i);
  }

  for (const start of shuffle(starts, rng).slice(0, 4)) {
    const paths = findPaths(
      board,
      start,
      length,
      rng,
      3,
      counter,
      (path) => distance(path[path.length - 1]) === 0,
      (cell, remaining) => distance(cell) <= remaining,
    );
    for (const path of paths) return path;
  }
  return null;
}

function tile(board: Board, words: string[], rng: Rng, counter: { steps: number }, placed: number[][]): boolean {
  if (words.length === 0) return true;
  const start = mostConstrainedCell(board, rng);
  const tried = new Set<number>();
  for (const word of shuffle(words, rng)) {
    if (tried.has(word.length)) continue; // same-length words are interchangeable here
    tried.add(word.length);
    const rest = words.slice();
    rest.splice(rest.indexOf(word), 1);
    const restLengths = rest.map((w) => w.length);
    for (const path of findPaths(board, start, word.length, rng, 4, counter)) {
      const id = placed.length;
      setPath(board, path, id, 1);
      placed.push(path);
      if (regionsFeasible(board, restLengths) && tile(board, rest, rng, counter, placed)) return true;
      placed.pop();
      setPath(board, path, EMPTY, 0);
    }
  }
  return false;
}

/**
 * Assign concrete words to the placed paths. Paths were grown for word
 * lengths, so we match words to paths by length.
 */
function assignWords(paths: number[][], words: string[], rng: Rng): { word: string; cells: number[] }[] {
  const byLength = new Map<number, string[]>();
  for (const word of shuffle(words, rng)) {
    const list = byLength.get(word.length) ?? [];
    list.push(word);
    byLength.set(word.length, list);
  }
  return paths.map((path) => {
    const word = byLength.get(path.length)!.pop()!;
    // Spell the word in either direction along its path for extra variety.
    return { word, cells: rng() < 0.5 ? path : path.slice().reverse() };
  });
}

export function generatePuzzle(def: PuzzleDefinition, seed: number, rows = ROWS, cols = COLS): PuzzleInstance {
  const rng = createRng(seed);
  const cellCount = rows * cols;
  const spangram = def.spangram.toUpperCase();
  const pool = def.pool.map((w) => w.toUpperCase()).filter((w) => w !== spangram);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const words = chooseWords(pool, cellCount - spangram.length, rng);
    if (!words) break;
    const board = makeBoard(rows, cols);
    const counter = { steps: 0 };
    try {
      const spanPath = placeSpangram(board, spangram.length, rng, counter);
      if (!spanPath) continue;
      setPath(board, spanPath, 0, 1);
      if (!regionsFeasible(board, words.map((w) => w.length))) continue;
      const placed: number[][] = [spanPath];
      if (!tile(board, words, rng, counter, placed)) continue;

      const spanCells = rng() < 0.75 ? spanPath : spanPath.slice().reverse();
      const placedWords: PlacedWord[] = [
        { word: spangram, cells: spanCells, isSpangram: true },
        ...assignWords(placed.slice(1), words, rng).map((w) => ({ ...w, isSpangram: false })),
      ];
      const letters = new Array<string>(cellCount).fill('');
      for (const { word, cells } of placedWords) cells.forEach((cell, i) => (letters[cell] = word[i]));

      const instance: PuzzleInstance = {
        puzzleId: def.id,
        theme: def.theme,
        rows,
        cols,
        letters,
        words: placedWords,
        seed,
      };
      if (validatePuzzle(instance).length === 0) return instance;
    } catch (err) {
      if (!(err instanceof BudgetExceeded)) throw err;
    }
  }
  throw new Error(`Could not generate a board for puzzle "${def.id}" (seed ${seed}).`);
}

/** Returns a list of problems with the board; an empty list means it is valid and solvable. */
export function validatePuzzle(p: PuzzleInstance): string[] {
  const errors: string[] = [];
  const cellCount = p.rows * p.cols;
  const covered = new Array<number>(cellCount).fill(0);
  const diag = new Set<number>();

  if (p.letters.length !== cellCount) errors.push('letter count does not match the grid size');
  const spangrams = p.words.filter((w) => w.isSpangram);
  if (spangrams.length !== 1) errors.push('there must be exactly one spangram');

  for (const { word, cells } of p.words) {
    if (word.length < MIN_WORD_LENGTH) errors.push(`${word} is too short`);
    if (word.length !== cells.length) errors.push(`${word} has the wrong number of cells`);
    cells.forEach((cell, i) => {
      if (cell < 0 || cell >= cellCount) errors.push(`${word} leaves the grid`);
      covered[cell] = (covered[cell] ?? 0) + 1;
      if (p.letters[cell] !== word[i]) errors.push(`${word} letter ${i} does not match the grid`);
      if (i > 0) {
        if (!areAdjacent(cells[i - 1], cell, p.cols)) errors.push(`${word} is not connected`);
        const key = diagonalKey(cells[i - 1], cell, p.cols);
        if (key >= 0) {
          if (diag.has(key)) errors.push(`${word} crosses another diagonal`);
          diag.add(key);
        }
      }
    });
  }
  if (covered.some((c) => c !== 1)) errors.push('every cell must belong to exactly one word');

  const span = spangrams[0];
  if (span) {
    const rc = span.cells.map((c) => toRowCol(c, p.cols));
    const touches = (pred: (r: number, c: number) => boolean) => rc.some(([r, c]) => pred(r, c));
    const horizontal = touches((_, c) => c === 0) && touches((_, c) => c === p.cols - 1);
    const vertical = touches((r) => r === 0) && touches((r) => r === p.rows - 1);
    if (!horizontal && !vertical) errors.push('the spangram must span two opposite sides');
  }
  const words = p.words.map((w) => w.word);
  if (new Set(words).size !== words.length) errors.push('duplicate words');
  return errors;
}
