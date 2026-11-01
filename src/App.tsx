import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid } from './components/Grid';
import { BulbIcon, ClockIcon, HelpIcon, MoonIcon, ShuffleIcon, StatsIcon, SunIcon } from './components/Icons';
import { Modal } from './components/Modal';
import { StatsPanel } from './components/StatsPanel';
import { WordList } from './components/WordList';
import { applyHint, canHint, formatTime, submitPath, tick, type GameState } from './game/gameState';
import type { Path } from './game/selection';
import { spell } from './game/selection';
import { saveGame, saveStats, startNewGame } from './game/session';
import {
  EMPTY_STATS,
  recordGameAbandoned,
  recordGameCompleted,
  recordGameStarted,
  recordHintUsed,
  recordWordFound,
  type Stats,
} from './game/stats';
import { loadPrefs, updatePrefs, useTheme } from './hooks/useTheme';

type Dialog = 'help' | 'stats' | 'complete' | 'skip' | 'reset' | null;

interface AppProps {
  initialGame: GameState;
  initialStats: Stats;
}

const FEEDBACK_MS = 1600;
const COMPLETE_DELAY_MS = 1100;

export default function App({ initialGame, initialStats }: AppProps) {
  const [game, setGameState] = useState(initialGame);
  const [stats, setStats] = useState(initialStats);
  // The latest game state, updated synchronously so rapid inputs never act on a stale render.
  const gameRef = useRef(initialGame);
  const setGame = useCallback((next: GameState) => {
    gameRef.current = next;
    setGameState(next);
  }, []);
  const [selection, setSelection] = useState<Path>([]);
  const [dialog, setDialog] = useState<Dialog>(() => (loadPrefs().seenHelp ? null : 'help'));
  const [showFeedback, setShowFeedback] = useState(false);
  const { scheme, toggle } = useTheme();

  useEffect(() => saveGame(game), [game]);
  useEffect(() => saveStats(stats), [stats]);

  // Timer: counts only while the game is visible, in progress and unobstructed.
  const timerRunning = game.status === 'playing' && dialog === null;
  useEffect(() => {
    if (!timerRunning) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      if (!document.hidden) setGame(tick(gameRef.current, Math.min(delta, 2000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, setGame]);

  // Briefly show each feedback message.
  useEffect(() => {
    if (!game.feedback) return;
    setShowFeedback(true);
    const t = window.setTimeout(() => setShowFeedback(false), FEEDBACK_MS);
    return () => window.clearTimeout(t);
  }, [game.feedback]);

  const completeTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(completeTimer.current), []);

  const handleSubmit = useCallback(
    (path: Path) => {
      const prev = gameRef.current;
      const next = submitPath(prev, path);
      setGame(next);
      if (next.found.length > prev.found.length) setStats(recordWordFound);
      if (next.status === 'won' && prev.status === 'playing') {
        setStats((s) => recordGameCompleted(s, next.elapsedMs));
        completeTimer.current = window.setTimeout(() => setDialog('complete'), COMPLETE_DELAY_MS);
      }
    },
    [setGame],
  );

  const handleHint = () => {
    const prev = gameRef.current;
    const next = applyHint(prev);
    if (next.hintsUsed > prev.hintsUsed) {
      setGame(next);
      setStats(recordHintUsed);
    }
  };

  const beginNewGame = (abandon: boolean) => {
    window.clearTimeout(completeTimer.current);
    setStats((s) => recordGameStarted(abandon ? recordGameAbandoned(s) : s));
    setGame(startNewGame());
    setSelection([]);
    setDialog(null);
  };

  const requestNewGame = () => {
    if (game.status === 'won') beginNewGame(false);
    else setDialog('skip');
  };

  const closeDialog = () => {
    if (dialog === 'help') updatePrefs({ seenHelp: true });
    setDialog(null);
  };

  const { puzzle } = game;
  const won = game.status === 'won';
  const total = puzzle.words.length;
  const spangram = puzzle.words.find((w) => w.isSpangram)!;
  const selectedWord = spell(selection, puzzle.letters);
  const hintLabel = game.hint && !game.found.includes(game.hint.word) ? (game.hint.level === 1 ? 'Show order' : 'Hint used') : 'Hint';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Links</h1>
        </div>
        <nav className="topbar-actions" aria-label="Game menu">
          <button className="icon-button" onClick={() => setDialog('help')} aria-label="How to play">
            <HelpIcon />
          </button>
          <button className="icon-button" onClick={() => setDialog('stats')} aria-label="Statistics">
            <StatsIcon />
          </button>
          <button
            className="icon-button"
            onClick={toggle}
            aria-label={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {scheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </header>

      <main className="layout">
        <section className="theme-card area-theme" aria-label="Theme">
          <span className="eyebrow">Theme</span>
          <p className="theme-text" key={puzzle.seed}>
            {puzzle.theme}
          </p>
        </section>

        <section className="progress area-progress" aria-live="polite">
          <p>
            <strong>{game.found.length}</strong> of <strong>{total}</strong> theme words found
          </p>
          <span className="timer" aria-label={`Time ${formatTime(game.elapsedMs)}`}>
            <ClockIcon width={16} height={16} />
            {formatTime(game.elapsedMs)}
          </span>
          <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={game.found.length}>
            <span style={{ width: `${(game.found.length / total) * 100}%` }} />
          </div>
        </section>

        <section className="area-board">
          <div className="preview" aria-live="polite">
            {selection.length > 0 ? (
              <span className="preview-word">{selectedWord}</span>
            ) : showFeedback && game.feedback ? (
              <span key={game.feedback.id} className={`preview-feedback fb-${game.feedback.kind}`}>
                {game.feedback.text}
              </span>
            ) : won ? (
              <span className="preview-feedback fb-found">Puzzle complete</span>
            ) : null}
          </div>
          <Grid
            puzzle={puzzle}
            found={game.found}
            hint={game.hint}
            disabled={won}
            onSubmit={handleSubmit}
            onSelectionChange={setSelection}
          />
        </section>

        <section className="controls area-controls">
          {won ? (
            <button className="button button-primary" onClick={() => beginNewGame(false)}>
              <ShuffleIcon width={18} height={18} /> Next puzzle
            </button>
          ) : (
            <>
              <button className="button" onClick={handleHint} disabled={!canHint(game)}>
                <BulbIcon width={18} height={18} /> {hintLabel}
              </button>
              <button className="button button-ghost" onClick={requestNewGame}>
                <ShuffleIcon width={18} height={18} /> New puzzle
              </button>
            </>
          )}
        </section>

        <div className="area-words">
          <WordList words={puzzle.words} found={game.found} />
        </div>
      </main>

      {dialog === 'help' && (
        <Modal title="How to play" onClose={closeDialog}>
          <HowToPlay />
          <button className="button button-primary button-block" onClick={closeDialog}>
            Let&rsquo;s play
          </button>
        </Modal>
      )}

      {dialog === 'stats' && (
        <Modal title="Statistics" onClose={closeDialog}>
          <StatsPanel stats={stats} />
          <button className="button button-ghost button-block" onClick={() => setDialog('reset')}>
            Reset statistics
          </button>
        </Modal>
      )}

      {dialog === 'reset' && (
        <Modal title="Reset statistics?" onClose={() => setDialog('stats')}>
          <p className="modal-text">This permanently clears every statistic on this device.</p>
          <div className="button-row">
            <button className="button button-ghost" onClick={() => setDialog('stats')}>
              Cancel
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                setStats({ ...EMPTY_STATS, gamesPlayed: won ? 0 : 1 });
                setDialog('stats');
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}

      {dialog === 'skip' && (
        <Modal title="Skip this puzzle?" onClose={closeDialog}>
          <p className="modal-text">
            You&rsquo;ve found {game.found.length} of {total} words. Skipping counts as an unfinished game and resets your
            winning streak{stats.currentStreak > 0 ? ` of ${stats.currentStreak}` : ''}.
          </p>
          <div className="button-row">
            <button className="button button-ghost" onClick={closeDialog}>
              Keep playing
            </button>
            <button className="button button-primary" onClick={() => beginNewGame(true)}>
              Skip puzzle
            </button>
          </div>
        </Modal>
      )}

      {dialog === 'complete' && (
        <Modal title="Puzzle complete!" onClose={closeDialog} className="modal-complete">
          <Confetti />
          <p className="complete-theme">
            <span className="eyebrow">{puzzle.theme}</span>
            <span className="complete-spangram">{spangram.word}</span>
          </p>
          <div className="complete-stats">
            <div>
              <strong>{formatTime(game.elapsedMs)}</strong>
              <span>Time</span>
            </div>
            <div>
              <strong>{game.hintsUsed}</strong>
              <span>{game.hintsUsed === 1 ? 'Hint' : 'Hints'}</span>
            </div>
            <div>
              <strong>{stats.currentStreak}</strong>
              <span>Streak</span>
            </div>
          </div>
          {stats.bestTimeMs === game.elapsedMs && stats.gamesCompleted > 1 && <p className="badge">New best time!</p>}
          <div className="button-row">
            <button className="button button-ghost" onClick={() => setDialog('stats')}>
              <StatsIcon width={18} height={18} /> Stats
            </button>
            <button className="button button-primary" onClick={() => beginNewGame(false)} autoFocus>
              <ShuffleIcon width={18} height={18} /> Next puzzle
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="help">
      <p>Find every theme word hidden in the grid. Every letter belongs to exactly one word.</p>
      <ul>
        <li>
          <strong>Drag</strong> across neighbouring letters &mdash; up, down, sideways or diagonally &mdash; and let go to
          submit. Slide back to undo a letter.
        </li>
        <li>
          Or <strong>tap</strong> letters one by one, then tap the last letter again to submit.
        </li>
        <li>
          Theme words turn <span className="swatch swatch-word">blue</span>. The{' '}
          <span className="swatch swatch-span">spangram</span> describes the theme and stretches from one side of the
          board to the other.
        </li>
        <li>
          Stuck? A <strong>hint</strong> outlines a word&rsquo;s letters. Use it again to reveal the order.
        </li>
      </ul>
      <p className="muted">Puzzles are unlimited &mdash; a fresh board is generated every game.</p>
    </div>
  );
}

const CONFETTI_COLORS = ['var(--word-strong)', 'var(--span-strong)', 'var(--word)', 'var(--span)'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 7) * 0.08}s`,
        duration: `${1.4 + ((i * 13) % 10) / 10}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: `${(i * 47) % 360}deg`,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.color,
            ['--r' as string]: p.rotate,
          }}
        />
      ))}
    </div>
  );
}
