export interface Stats {
  gamesPlayed: number;
  gamesCompleted: number;
  /** Sum of completion times for completed games, in ms. */
  totalTimeMs: number;
  bestTimeMs: number | null;
  wordsFound: number;
  hintsUsed: number;
  currentStreak: number;
  longestStreak: number;
}

export const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gamesCompleted: 0,
  totalTimeMs: 0,
  bestTimeMs: null,
  wordsFound: 0,
  hintsUsed: 0,
  currentStreak: 0,
  longestStreak: 0,
};

/** Merge stored data over defaults so older or partial saves stay readable. */
export function normaliseStats(raw: Partial<Stats> | null | undefined): Stats {
  return { ...EMPTY_STATS, ...(raw ?? {}) };
}

export const recordGameStarted = (s: Stats): Stats => ({ ...s, gamesPlayed: s.gamesPlayed + 1 });

export const recordWordFound = (s: Stats): Stats => ({ ...s, wordsFound: s.wordsFound + 1 });

export const recordHintUsed = (s: Stats): Stats => ({ ...s, hintsUsed: s.hintsUsed + 1 });

export function recordGameCompleted(s: Stats, timeMs: number): Stats {
  const currentStreak = s.currentStreak + 1;
  return {
    ...s,
    gamesCompleted: s.gamesCompleted + 1,
    totalTimeMs: s.totalTimeMs + timeMs,
    bestTimeMs: s.bestTimeMs == null ? timeMs : Math.min(s.bestTimeMs, timeMs),
    currentStreak,
    longestStreak: Math.max(s.longestStreak, currentStreak),
  };
}

/** Skipping an unfinished puzzle ends the winning streak. */
export const recordGameAbandoned = (s: Stats): Stats => ({ ...s, currentStreak: 0 });

export function completionRate(s: Stats): number {
  return s.gamesPlayed === 0 ? 0 : Math.round((s.gamesCompleted / s.gamesPlayed) * 100);
}

export function averageTimeMs(s: Stats): number | null {
  return s.gamesCompleted === 0 ? null : s.totalTimeMs / s.gamesCompleted;
}
