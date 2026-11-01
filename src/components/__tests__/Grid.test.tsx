import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { generatePuzzle } from '../../game/generator';
import { createGame } from '../../game/gameState';
import { PUZZLES } from '../../game/puzzles';
import { EMPTY_STATS } from '../../game/stats';
import { toRowCol } from '../../game/grid';
import { Grid } from '../Grid';

const CELL = 100;
const puzzle = generatePuzzle(PUZZLES[3], 99);
const { cols } = puzzle;

/** Give the board a real size: 100px cells with the origin at (0, 0). */
function layoutBoard() {
  const board = screen.getByTestId('board');
  board.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: cols * CELL, height: puzzle.rows * CELL, right: cols * CELL, bottom: puzzle.rows * CELL, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return board;
}

const centre = (cell: number) => {
  const [r, c] = toRowCol(cell, cols);
  return { clientX: c * CELL + CELL / 2, clientY: r * CELL + CELL / 2, pointerId: 1, pointerType: 'touch' };
};

function drag(board: HTMLElement, cells: readonly number[]) {
  fireEvent.pointerDown(board, centre(cells[0]));
  for (const cell of cells.slice(1)) fireEvent.pointerMove(board, centre(cell));
  fireEvent.pointerUp(board, centre(cells[cells.length - 1]));
}

function tapAll(board: HTMLElement, cells: readonly number[]) {
  for (const cell of cells) {
    fireEvent.pointerDown(board, centre(cell));
    fireEvent.pointerUp(board, centre(cell));
  }
}

const selectedCells = (board: HTMLElement) =>
  Array.from(board.querySelectorAll<HTMLElement>('.cell.is-selected')).map((el) => Number(el.dataset.cell));

afterEach(cleanup);

describe('<Grid /> selection mechanics', () => {
  const word = puzzle.words.find((w) => !w.isSpangram && w.cells.length >= 5)!;

  it('renders one cell per letter', () => {
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={() => {}} />);
    expect(screen.getAllByRole('gridcell')).toHaveLength(puzzle.letters.length);
  });

  it('submits a dragged path on release (mouse or touch)', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={onSubmit} />);
    drag(layoutBoard(), word.cells);
    expect(onSubmit).toHaveBeenCalledWith(word.cells);
  });

  it('highlights letters while dragging and retracts when dragging back', () => {
    const onSelectionChange = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={() => {}} onSelectionChange={onSelectionChange} />);
    const board = layoutBoard();
    const [a, b, c] = word.cells;
    fireEvent.pointerDown(board, centre(a));
    fireEvent.pointerMove(board, centre(b));
    fireEvent.pointerMove(board, centre(c));
    expect(selectedCells(board).sort()).toEqual([a, b, c].sort());
    fireEvent.pointerMove(board, centre(b));
    expect(selectedCells(board).sort()).toEqual([a, b].sort());
    expect(onSelectionChange).toHaveBeenLastCalledWith([a, b]);
  });

  it('ignores the corners of a cell so diagonal drags do not clip neighbours', () => {
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={() => {}} />);
    const board = layoutBoard();
    fireEvent.pointerDown(board, centre(0));
    // Pass through the shared corner of cells 0, 1, 6 and 7 on the way to cell 7.
    fireEvent.pointerMove(board, { clientX: 98, clientY: 98, pointerId: 1 });
    expect(selectedCells(board)).toEqual([0]);
    fireEvent.pointerMove(board, { clientX: 150, clientY: 150, pointerId: 1 });
    expect(selectedCells(board).sort((x, y) => x - y)).toEqual([0, 7]);
  });

  it('fills in letters skipped by a fast straight swipe', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={onSubmit} />);
    const board = layoutBoard();
    // One pointermove jumping from (row 0, col 0) to (row 0, col 3).
    fireEvent.pointerDown(board, centre(0));
    fireEvent.pointerMove(board, centre(3));
    fireEvent.pointerUp(board, centre(3));
    expect(onSubmit).toHaveBeenCalledWith([0, 1, 2, 3]);
  });

  it('supports tapping letters and tapping the last one again to submit', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={onSubmit} />);
    const board = layoutBoard();
    tapAll(board, word.cells);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(selectedCells(board)).toHaveLength(word.cells.length);
    tapAll(board, [word.cells[word.cells.length - 1]]);
    expect(onSubmit).toHaveBeenCalledWith(word.cells);
    expect(selectedCells(board)).toEqual([]);
  });

  it('continues the word when dragging away from the last tapped letter', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={onSubmit} />);
    const board = layoutBoard();
    const [a, b, ...rest] = word.cells;
    tapAll(board, [a, b]);
    // Press on the last tapped letter, then drag through the rest of the word.
    drag(board, [b, ...rest]);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(word.cells);
  });

  it('can be played with the keyboard', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[]} hint={null} onSubmit={onSubmit} />);
    const board = layoutBoard();
    const cellEl = (cell: number) => board.querySelector<HTMLElement>(`[data-cell="${cell}"]`)!;
    for (const cell of word.cells) fireEvent.keyDown(cellEl(cell), { key: 'Enter' });
    fireEvent.keyDown(cellEl(word.cells[word.cells.length - 1]), { key: ' ' });
    expect(onSubmit).toHaveBeenCalledWith(word.cells);
  });

  it('marks found words and blocks selecting their letters', () => {
    const onSubmit = vi.fn();
    render(<Grid puzzle={puzzle} found={[word.word]} hint={null} onSubmit={onSubmit} />);
    const board = layoutBoard();
    expect(board.querySelectorAll('.cell.is-found')).toHaveLength(word.cells.length);
    drag(board, word.cells);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('outlines hinted letters', () => {
    render(<Grid puzzle={puzzle} found={[]} hint={{ word: word.word, level: 1 }} onSubmit={() => {}} />);
    expect(layoutBoard().querySelectorAll('.cell.is-hinted')).toHaveLength(word.cells.length);
  });
});

describe('<App /> full game', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('links:prefs', JSON.stringify({ seenHelp: true }));
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('plays a whole puzzle to the completion screen and starts another', () => {
    render(<App initialGame={createGame(puzzle)} initialStats={{ ...EMPTY_STATS, gamesPlayed: 1 }} />);
    const board = layoutBoard();
    const total = puzzle.words.length;

    // A wrong guess gives feedback but finds nothing.
    const first = puzzle.words[1];
    drag(board, first.cells.slice().reverse());
    expect(screen.getByText(/theme words found/).textContent).toContain(`0 of ${total}`);

    for (const w of puzzle.words) drag(board, w.cells);
    expect(screen.getByText(/theme words found/).textContent).toContain(`${total} of ${total}`);
    expect(screen.getByText('All found')).toBeTruthy();

    act(() => vi.advanceTimersByTime(1500));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Puzzle complete!')).toBeTruthy();
    expect(within(dialog).getByText(puzzle.words.find((w) => w.isSpangram)!.word)).toBeTruthy();

    const stats = JSON.parse(localStorage.getItem('links:stats')!);
    expect(stats).toMatchObject({ gamesCompleted: 1, wordsFound: total, currentStreak: 1, longestStreak: 1 });

    fireEvent.click(within(dialog).getByRole('button', { name: /next puzzle/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(/theme words found/).textContent).toContain('0 of');
    expect(JSON.parse(localStorage.getItem('links:stats')!).gamesPlayed).toBe(2);
  });

  it('keeps every find when several words are submitted before React re-renders', () => {
    render(<App initialGame={createGame(puzzle)} initialStats={{ ...EMPTY_STATS, gamesPlayed: 1 }} />);
    const board = layoutBoard();
    act(() => {
      for (const w of puzzle.words.slice(0, 3)) drag(board, w.cells);
    });
    expect(screen.getByText(/theme words found/).textContent).toContain('3 of');
  });

  it('counts hints and resets the streak when a puzzle is skipped', () => {
    render(<App initialGame={createGame(puzzle)} initialStats={{ ...EMPTY_STATS, gamesPlayed: 1, currentStreak: 3, longestStreak: 3 }} />);
    fireEvent.click(screen.getByRole('button', { name: /^hint$/i }));
    expect(document.querySelectorAll('.cell.is-hinted').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /show order/i }));
    expect(JSON.parse(localStorage.getItem('links:stats')!).hintsUsed).toBe(2);

    fireEvent.click(screen.getByRole('button', { name: /new puzzle/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /skip puzzle/i }));
    const stats = JSON.parse(localStorage.getItem('links:stats')!);
    expect(stats).toMatchObject({ currentStreak: 0, longestStreak: 3, gamesPlayed: 2 });
  });
});
