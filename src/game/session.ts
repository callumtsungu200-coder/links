import { createGame, type GameState } from './gameState';
import { validatePuzzle } from './generator';
import { newPuzzle, rememberPlayed } from './picker';
import { normaliseStats, recordGameStarted, type Stats } from './stats';
import { load, save } from './storage';

/*
 * Persistence of the in-progress game, recent puzzles and statistics.
 * Kept outside React so starting a game is recorded exactly once, even under
 * StrictMode's double-invoked renders and effects.
 */

export const loadStats = (): Stats => normaliseStats(load<Partial<Stats> | null>('stats', null));
export const saveStats = (stats: Stats) => save('stats', stats);
export const saveGame = (game: GameState) => save('current', { ...game, feedback: null });

function isResumable(value: unknown): value is GameState {
  const g = value as GameState | null;
  return !!g && g.status === 'playing' && !!g.puzzle && Array.isArray(g.found) && validatePuzzle(g.puzzle).length === 0;
}

/** Start a brand-new game with a fresh puzzle. Callers record it in the stats. */
export function startNewGame(): GameState {
  const recent = load<string[]>('recent', []);
  const puzzle = newPuzzle(recent);
  save('recent', rememberPlayed(recent, puzzle.puzzleId));
  const game = createGame(puzzle);
  saveGame(game);
  return game;
}

/** Resume the saved game if there is one, otherwise start (and record) a new one. */
export function bootstrap(): { game: GameState; stats: Stats } {
  const stats = loadStats();
  const saved = load<unknown>('current', null);
  if (isResumable(saved)) return { game: { ...saved, feedback: null }, stats };
  const fresh = { game: startNewGame(), stats: recordGameStarted(stats) };
  saveStats(fresh.stats);
  return fresh;
}
