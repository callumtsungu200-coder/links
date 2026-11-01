import { formatTime } from '../game/gameState';
import { averageTimeMs, completionRate, type Stats } from '../game/stats';

export function StatsPanel({ stats }: { stats: Stats }) {
  const avg = averageTimeMs(stats);
  const tiles: [string, string][] = [
    ['Played', String(stats.gamesPlayed)],
    ['Completed', String(stats.gamesCompleted)],
    ['Completion', `${completionRate(stats)}%`],
    ['Current streak', String(stats.currentStreak)],
    ['Longest streak', String(stats.longestStreak)],
    ['Best time', stats.bestTimeMs == null ? '—' : formatTime(stats.bestTimeMs)],
    ['Average time', avg == null ? '—' : formatTime(avg)],
    ['Words found', String(stats.wordsFound)],
    ['Hints used', String(stats.hintsUsed)],
  ];
  return (
    <dl className="stats-grid">
      {tiles.map(([label, value]) => (
        <div className="stat" key={label}>
          <dt className="stat-label">{label}</dt>
          <dd className="stat-value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
