import { generatePuzzle } from './generator';
import { PUZZLES } from './puzzles';
import { randomSeed } from './rng';
import type { PuzzleDefinition, PuzzleInstance } from './types';

/** How many recent puzzles to avoid repeating, given the collection size. */
export function recentWindow(total: number): number {
  return Math.max(0, Math.min(12, Math.floor(total / 2)));
}

/** Pick a random puzzle definition, avoiding recently played ones where possible. */
export function pickDefinition(
  recent: readonly string[],
  rng: () => number = Math.random,
  puzzles: readonly PuzzleDefinition[] = PUZZLES,
): PuzzleDefinition {
  const avoid = new Set(recent.slice(-recentWindow(puzzles.length)));
  let candidates = puzzles.filter((p) => !avoid.has(p.id));
  if (candidates.length === 0) candidates = puzzles.filter((p) => p.id !== recent[recent.length - 1]);
  if (candidates.length === 0) candidates = puzzles.slice();
  return candidates[Math.floor(rng() * candidates.length)];
}

export function rememberPlayed(recent: readonly string[], id: string, total = PUZZLES.length): string[] {
  return [...recent.filter((r) => r !== id), id].slice(-Math.max(1, recentWindow(total)));
}

/** Pick and generate a fresh board. Falls back to other puzzles if generation ever fails. */
export function newPuzzle(recent: readonly string[], rng: () => number = Math.random): PuzzleInstance {
  let def = pickDefinition(recent, rng);
  for (let i = 0; i < PUZZLES.length; i++) {
    try {
      return generatePuzzle(def, randomSeed());
    } catch {
      def = PUZZLES[(PUZZLES.indexOf(def) + 1) % PUZZLES.length];
    }
  }
  throw new Error('Unable to generate any puzzle');
}
