import { describe, expect, it } from 'vitest';
import { chooseWords, generatePuzzle, validatePuzzle } from '../generator';
import { PUZZLES } from '../puzzles';
import { createRng } from '../rng';
import { CELL_COUNT, COLS, MIN_WORD_LENGTH, ROWS } from '../types';

const SEEDS_PER_PUZZLE = 25;

describe('puzzle collection', () => {
  it('has unique ids and well-formed words', () => {
    const ids = PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PUZZLES) {
      for (const word of [p.spangram, ...p.pool]) {
        expect(word, `${p.id}: ${word}`).toMatch(/^[A-Z]+$/);
        expect(word.length).toBeGreaterThanOrEqual(MIN_WORD_LENGTH);
      }
      expect(new Set(p.pool).size, `${p.id} has duplicate pool words`).toBe(p.pool.length);
      expect(p.pool).not.toContain(p.spangram);
      // The spangram must be long enough to reach across the board.
      expect(p.spangram.length).toBeGreaterThanOrEqual(Math.min(ROWS, COLS));
    }
  });

  it('every puzzle has at least one word subset that exactly fills the board', () => {
    for (const p of PUZZLES) {
      const words = chooseWords(p.pool, CELL_COUNT - p.spangram.length, createRng(1));
      expect(words, p.id).not.toBeNull();
      expect(words!.reduce((n, w) => n + w.length, 0)).toBe(CELL_COUNT - p.spangram.length);
    }
  });
});

describe('generatePuzzle', () => {
  it.each(PUZZLES.map((p) => [p.id, p] as const))('always produces a valid, fully solvable board for %s', (_, def) => {
    for (let seed = 1; seed <= SEEDS_PER_PUZZLE; seed++) {
      const puzzle = generatePuzzle(def, seed * 7919);
      expect(validatePuzzle(puzzle)).toEqual([]);
      expect(puzzle.letters).toHaveLength(CELL_COUNT);
      expect(puzzle.words.filter((w) => w.isSpangram)).toHaveLength(1);
      expect(puzzle.words.find((w) => w.isSpangram)!.word).toBe(def.spangram);
      for (const w of puzzle.words.filter((x) => !x.isSpangram)) expect(def.pool).toContain(w.word);
    }
  });

  it('is deterministic for a given seed and varies across seeds', () => {
    const def = PUZZLES[0];
    expect(generatePuzzle(def, 42)).toEqual(generatePuzzle(def, 42));
    const boards = new Set(Array.from({ length: 10 }, (_, i) => generatePuzzle(def, i + 1).letters.join('')));
    expect(boards.size).toBeGreaterThan(5);
  });
});

describe('validatePuzzle', () => {
  const good = generatePuzzle(PUZZLES[1], 123);

  it('rejects a board whose letters do not match its words', () => {
    const letters = good.letters.slice();
    const cell = good.words[1].cells[0];
    letters[cell] = letters[cell] === 'Z' ? 'Q' : 'Z';
    expect(validatePuzzle({ ...good, letters })).not.toEqual([]);
  });

  it('rejects disconnected word paths', () => {
    const words = good.words.map((w) => ({ ...w, cells: w.cells.slice() }));
    // Swap first and last cells of a long word: same letters set, broken path.
    const w = words.find((x) => !x.isSpangram && x.cells.length >= 5)!;
    [w.cells[0], w.cells[w.cells.length - 1]] = [w.cells[w.cells.length - 1], w.cells[0]];
    expect(validatePuzzle({ ...good, words })).not.toEqual([]);
  });

  it('rejects boards with uncovered cells', () => {
    expect(validatePuzzle({ ...good, words: good.words.slice(0, -1) })).toContain(
      'every cell must belong to exactly one word',
    );
  });
});
