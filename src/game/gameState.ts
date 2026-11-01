import { pathsEqual, spell, type Path } from './selection';
import { MIN_WORD_LENGTH, type PlacedWord, type PuzzleInstance } from './types';

export type FeedbackKind = 'found' | 'spangram' | 'already' | 'short' | 'invalid' | 'close';

export interface Feedback {
  kind: FeedbackKind;
  text: string;
  /** Increments on every message so repeated messages re-animate. */
  id: number;
}

export interface Hint {
  word: string;
  /** 1 = the word's letters are outlined, 2 = the letter order is shown too. */
  level: 1 | 2;
}

export interface GameState {
  puzzle: PuzzleInstance;
  /** Found words, in the order they were discovered. */
  found: string[];
  hint: Hint | null;
  hintsUsed: number;
  elapsedMs: number;
  status: 'playing' | 'won';
  feedback: Feedback | null;
}

export function createGame(puzzle: PuzzleInstance): GameState {
  return { puzzle, found: [], hint: null, hintsUsed: 0, elapsedMs: 0, status: 'playing', feedback: null };
}

export function totalWords(state: GameState): number {
  return state.puzzle.words.length;
}

export function foundCells(state: GameState): Set<number> {
  const cells = new Set<number>();
  for (const w of state.puzzle.words) if (state.found.includes(w.word)) w.cells.forEach((c) => cells.add(c));
  return cells;
}

function feedback(state: GameState, kind: FeedbackKind, text: string): Feedback {
  return { kind, text, id: (state.feedback?.id ?? 0) + 1 };
}

const PRAISE = ['Nice!', 'Great find!', 'Lovely!', 'Brilliant!', 'Spot on!', 'Sharp eyes!'];

export function submitPath(state: GameState, path: Path): GameState {
  if (state.status !== 'playing' || path.length === 0) return state;
  const word = spell(path, state.puzzle.letters);

  if (path.length < MIN_WORD_LENGTH) {
    return { ...state, feedback: feedback(state, 'short', 'Too short') };
  }

  const match = state.puzzle.words.find((w) => pathsEqual(w.cells, path));
  if (match) {
    if (state.found.includes(match.word)) {
      return { ...state, feedback: feedback(state, 'already', 'Already found') };
    }
    const found = [...state.found, match.word];
    const won = found.length === state.puzzle.words.length;
    const text = match.isSpangram ? 'SPANGRAM!' : PRAISE[found.length % PRAISE.length];
    return {
      ...state,
      found,
      hint: state.hint?.word === match.word ? null : state.hint,
      status: won ? 'won' : 'playing',
      feedback: feedback(state, match.isSpangram ? 'spangram' : 'found', text),
    };
  }

  const sameWord = state.puzzle.words.find((w) => w.word === word);
  if (sameWord && !state.found.includes(sameWord.word)) {
    return { ...state, feedback: feedback(state, 'close', 'Right word — try another path') };
  }
  if (sameWord) return { ...state, feedback: feedback(state, 'already', 'Already found') };
  return { ...state, feedback: feedback(state, 'invalid', 'Not a theme word') };
}

/** The hint button is available unless the current hint is already fully revealed. */
export function canHint(state: GameState): boolean {
  if (state.status !== 'playing') return false;
  return !(state.hint && state.hint.level === 2 && !state.found.includes(state.hint.word));
}

export function applyHint(state: GameState, rng: () => number = Math.random): GameState {
  if (!canHint(state)) return state;
  const { hint } = state;
  if (hint && !state.found.includes(hint.word)) {
    return { ...state, hint: { word: hint.word, level: 2 }, hintsUsed: state.hintsUsed + 1 };
  }
  const unfound = state.puzzle.words.filter((w) => !state.found.includes(w.word));
  // Save the spangram for last: it gives the whole theme away.
  const candidates = unfound.some((w) => !w.isSpangram) ? unfound.filter((w) => !w.isSpangram) : unfound;
  const target = candidates[Math.floor(rng() * candidates.length)];
  return { ...state, hint: { word: target.word, level: 1 }, hintsUsed: state.hintsUsed + 1 };
}

export function hintedWord(state: GameState): PlacedWord | null {
  if (!state.hint) return null;
  return state.puzzle.words.find((w) => w.word === state.hint!.word && !state.found.includes(w.word)) ?? null;
}

export function tick(state: GameState, ms: number): GameState {
  return state.status === 'playing' ? { ...state, elapsedMs: state.elapsedMs + ms } : state;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
