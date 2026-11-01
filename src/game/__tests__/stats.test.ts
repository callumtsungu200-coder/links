import { beforeEach, describe, expect, it } from 'vitest';
import { pickDefinition, recentWindow, rememberPlayed } from '../picker';
import { PUZZLES } from '../puzzles';
import { bootstrap, loadStats, saveGame, startNewGame } from '../session';
import {
  averageTimeMs,
  completionRate,
  EMPTY_STATS,
  normaliseStats,
  recordGameAbandoned,
  recordGameCompleted,
  recordGameStarted,
  recordHintUsed,
  recordWordFound,
} from '../stats';
import { submitPath } from '../gameState';

describe('stats', () => {
  it('tracks completion, times and streaks', () => {
    let s = EMPTY_STATS;
    s = recordGameCompleted(recordGameStarted(s), 120_000);
    s = recordGameCompleted(recordGameStarted(s), 60_000);
    s = recordGameAbandoned(recordGameStarted(s));
    s = recordGameCompleted(recordGameStarted(s), 90_000);

    expect(s.gamesPlayed).toBe(4);
    expect(s.gamesCompleted).toBe(3);
    expect(completionRate(s)).toBe(75);
    expect(s.bestTimeMs).toBe(60_000);
    expect(averageTimeMs(s)).toBe(90_000);
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(2);
  });

  it('counts words and hints', () => {
    const s = recordHintUsed(recordWordFound(recordWordFound(EMPTY_STATS)));
    expect(s.wordsFound).toBe(2);
    expect(s.hintsUsed).toBe(1);
  });

  it('handles empty and partial saved data', () => {
    expect(completionRate(EMPTY_STATS)).toBe(0);
    expect(averageTimeMs(EMPTY_STATS)).toBeNull();
    expect(normaliseStats({ gamesPlayed: 3 })).toEqual({ ...EMPTY_STATS, gamesPlayed: 3 });
    expect(normaliseStats(null)).toEqual(EMPTY_STATS);
  });
});

describe('puzzle picker', () => {
  it('avoids recently played puzzles', () => {
    const recent = PUZZLES.slice(0, recentWindow(PUZZLES.length)).map((p) => p.id);
    for (let i = 0; i < 50; i++) {
      const pick = pickDefinition(recent, Math.random);
      expect(recent).not.toContain(pick.id);
    }
  });

  it('still picks something different from the last game when everything is recent', () => {
    const tiny = PUZZLES.slice(0, 2);
    const pick = pickDefinition([tiny[0].id, tiny[1].id], () => 0, tiny);
    expect(pick.id).toBe(tiny[0].id);
    expect(pickDefinition([tiny[1].id], () => 0.99, tiny).id).toBe(tiny[0].id);
  });

  it('keeps a bounded, de-duplicated recent list', () => {
    let recent: string[] = [];
    for (const p of [...PUZZLES, ...PUZZLES]) recent = rememberPlayed(recent, p.id);
    expect(recent.length).toBe(recentWindow(PUZZLES.length));
    expect(new Set(recent).size).toBe(recent.length);
    expect(recent[recent.length - 1]).toBe(PUZZLES[PUZZLES.length - 1].id);
  });
});

describe('session persistence', () => {
  beforeEach(() => localStorage.clear());

  it('starts and records exactly one game on first load', () => {
    const { game, stats } = bootstrap();
    expect(game.status).toBe('playing');
    expect(stats.gamesPlayed).toBe(1);
    expect(loadStats().gamesPlayed).toBe(1);
  });

  it('resumes an in-progress game instead of starting a new one', () => {
    const first = bootstrap();
    const progressed = submitPath(first.game, first.game.puzzle.words[0].cells);
    saveGame(progressed);
    const again = bootstrap();
    expect(again.game.puzzle).toEqual(first.game.puzzle);
    expect(again.game.found).toEqual(progressed.found);
    expect(again.stats.gamesPlayed).toBe(1);
  });

  it('never repeats the previous puzzle back to back', () => {
    let { game } = bootstrap();
    const seen = new Set([game.puzzle.puzzleId]);
    for (let i = 0; i < 20; i++) {
      const next = startNewGame();
      expect(next.puzzle.puzzleId).not.toBe(game.puzzle.puzzleId);
      seen.add(next.puzzle.puzzleId);
      game = next;
    }
    // The recent-history window guarantees broad variety over 21 games.
    expect(seen.size).toBeGreaterThanOrEqual(13);
  });

  it('ignores corrupted saves', () => {
    localStorage.setItem('wordweave:current', '{"status":"playing","puzzle":{"letters":[]}}');
    localStorage.setItem('wordweave:stats', 'not json');
    const { game, stats } = bootstrap();
    expect(game.puzzle.letters).toHaveLength(48);
    expect(stats.gamesPlayed).toBe(1);
  });
});
