export const ROWS = 8;
export const COLS = 6;
export const CELL_COUNT = ROWS * COLS;
export const MIN_WORD_LENGTH = 4;

/** A hand-written puzzle: a theme, its spangram and a pool of theme words. */
export interface PuzzleDefinition {
  id: string;
  /** The clue shown to the player. */
  theme: string;
  /** The word or phrase (no spaces) that describes the theme and spans the board. */
  spangram: string;
  /** Candidate theme words. The generator picks a subset that exactly fills the board. */
  pool: string[];
}

export interface PlacedWord {
  word: string;
  /** Cell indices (row * cols + col) in spelling order. */
  cells: number[];
  isSpangram: boolean;
}

/** A concrete, playable board generated from a PuzzleDefinition. */
export interface PuzzleInstance {
  puzzleId: string;
  theme: string;
  rows: number;
  cols: number;
  /** One uppercase letter per cell. */
  letters: string[];
  words: PlacedWord[];
  seed: number;
}
