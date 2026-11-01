import { describe, expect, it } from 'vitest';
import { applyHint, canHint, createGame, formatTime, hintedWord, submitPath, tick } from '../gameState';
import { generatePuzzle } from '../generator';
import { PUZZLES } from '../puzzles';

const puzzle = generatePuzzle(PUZZLES[0], 2024);
const theme = puzzle.words.filter((w) => !w.isSpangram);
const spangram = puzzle.words.find((w) => w.isSpangram)!;

describe('submitPath', () => {
  it('accepts a theme word traced along its path', () => {
    const word = theme[0];
    const state = submitPath(createGame(puzzle), word.cells);
    expect(state.found).toEqual([word.word]);
    expect(state.feedback?.kind).toBe('found');
    expect(state.status).toBe('playing');
  });

  it('recognises the spangram', () => {
    const state = submitPath(createGame(puzzle), spangram.cells);
    expect(state.found).toEqual([spangram.word]);
    expect(state.feedback).toMatchObject({ kind: 'spangram', text: 'SPANGRAM!' });
  });

  it('rejects a word traced backwards', () => {
    const word = theme[0];
    const state = submitPath(createGame(puzzle), word.cells.slice().reverse());
    expect(state.found).toEqual([]);
  });

  it('rejects short selections and non-theme words', () => {
    const game = createGame(puzzle);
    expect(submitPath(game, theme[0].cells.slice(0, 3)).feedback?.kind).toBe('short');
    expect(submitPath(game, theme[0].cells.slice(0, -1)).feedback?.kind).toBe('invalid');
  });

  it('reports words that were already found', () => {
    const once = submitPath(createGame(puzzle), theme[0].cells);
    const twice = submitPath(once, theme[0].cells);
    expect(twice.found).toHaveLength(1);
    expect(twice.feedback?.kind).toBe('already');
    expect(twice.feedback!.id).toBeGreaterThan(once.feedback!.id);
  });

  it('wins once every word including the spangram is found', () => {
    let state = createGame(puzzle);
    for (const w of puzzle.words) state = submitPath(state, w.cells);
    expect(state.status).toBe('won');
    expect(state.found).toHaveLength(puzzle.words.length);
    // Further input is ignored after winning.
    expect(submitPath(state, theme[0].cells)).toBe(state);
  });
});

describe('hints', () => {
  it('outlines a non-spangram word first, then reveals its order, then waits', () => {
    let state = applyHint(createGame(puzzle), () => 0);
    expect(state.hint).toEqual({ word: theme[0].word, level: 1 });
    expect(state.hintsUsed).toBe(1);
    expect(hintedWord(state)?.isSpangram).toBe(false);

    state = applyHint(state);
    expect(state.hint?.level).toBe(2);
    expect(state.hintsUsed).toBe(2);
    expect(canHint(state)).toBe(false);
    expect(applyHint(state)).toBe(state);
  });

  it('clears the hint when the hinted word is found and allows a new one', () => {
    let state = applyHint(createGame(puzzle), () => 0);
    const target = hintedWord(state)!;
    state = submitPath(state, target.cells);
    expect(state.hint).toBeNull();
    expect(canHint(state)).toBe(true);
  });

  it('only hints the spangram once every other word is found', () => {
    let state = createGame(puzzle);
    for (const w of theme) state = submitPath(state, w.cells);
    state = applyHint(state);
    expect(state.hint?.word).toBe(spangram.word);
  });
});

describe('timer helpers', () => {
  it('ticks only while playing', () => {
    const game = tick(createGame(puzzle), 1500);
    expect(game.elapsedMs).toBe(1500);
    expect(tick({ ...game, status: 'won' }, 1000).elapsedMs).toBe(1500);
  });

  it('formats durations', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65_000)).toBe('1:05');
    expect(formatTime(3_725_000)).toBe('1:02:05');
  });
});
