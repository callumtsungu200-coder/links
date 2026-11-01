import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { dragTo, tapCell, type Path } from '../game/selection';
import { toRowCol } from '../game/grid';
import type { Hint } from '../game/gameState';
import type { PuzzleInstance } from '../game/types';

interface GridProps {
  puzzle: PuzzleInstance;
  found: readonly string[];
  hint: Hint | null;
  disabled?: boolean;
  onSubmit: (path: Path) => void;
  onSelectionChange?: (path: Path) => void;
}

/** Fraction of a cell (from its centre) that registers a drag; keeps diagonals easy to hit. */
const HIT_RADIUS = 0.42;
const CELEBRATE_MS = 1100;
const IDLE = { active: false, moved: false, pendingSubmit: false };

export function Grid({ puzzle, found, hint, disabled = false, onSubmit, onSelectionChange }: GridProps) {
  const { rows, cols, letters, words } = puzzle;
  const boardRef = useRef<HTMLDivElement>(null);
  const [path, setPathState] = useState<Path>([]);
  const pathRef = useRef<Path>([]);
  const drag = useRef(IDLE);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [celebrating, setCelebrating] = useState<{ word: string; key: number } | null>(null);

  const foundWords = useMemo(() => words.filter((w) => found.includes(w.word)), [words, found]);
  const cellInfo = useMemo(() => {
    const info = new Map<number, { spangram: boolean; word: string; index: number }>();
    for (const w of foundWords) w.cells.forEach((c, index) => info.set(c, { spangram: w.isSpangram, word: w.word, index }));
    return info;
  }, [foundWords]);
  const blocked = useMemo(() => new Set(cellInfo.keys()), [cellInfo]);
  const hinted = hint && !found.includes(hint.word) ? words.find((w) => w.word === hint.word) ?? null : null;

  // Keep callbacks in refs so parents can pass inline functions without resetting selection.
  const callbacks = useRef({ onSubmit, onSelectionChange });
  callbacks.current = { onSubmit, onSelectionChange };

  const setPath = useCallback((next: Path) => {
    pathRef.current = next;
    setPathState(next);
    callbacks.current.onSelectionChange?.(next);
  }, []);

  // Celebrate the most recently found word with a staggered pop.
  const prevFound = useRef(found.length);
  useEffect(() => {
    if (found.length > prevFound.current) {
      setCelebrating({ word: found[found.length - 1], key: Date.now() });
      const t = window.setTimeout(() => setCelebrating(null), CELEBRATE_MS);
      prevFound.current = found.length;
      return () => window.clearTimeout(t);
    }
    prevFound.current = found.length;
  }, [found]);

  // A new board or a locked board clears any selection in progress.
  useEffect(() => {
    setPath([]);
    drag.current = IDLE;
  }, [puzzle, disabled, setPath]);

  const submit = useCallback(
    (p: Path) => {
      setPath([]);
      callbacks.current.onSubmit(p);
    },
    [setPath],
  );

  const cellFromPoint = (clientX: number, clientY: number, strict: boolean): number | null => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = ((clientX - rect.left) / rect.width) * cols;
    const y = ((clientY - rect.top) / rect.height) * rows;
    const col = Math.floor(x);
    const row = Math.floor(y);
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    if (strict && Math.hypot(x - col - 0.5, y - row - 0.5) > HIT_RADIUS) return null;
    return row * cols + col;
  };

  const tap = (cell: number) => {
    const result = tapCell(pathRef.current, cell, cols, blocked);
    if (result.submit) {
      submit(pathRef.current);
      return false;
    }
    setPath(result.path);
    return true;
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const cell = cellFromPoint(e.clientX, e.clientY, false);
    if (cell == null) return;
    e.preventDefault();
    if (blocked.has(cell)) return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Capture is a nicety; selection still works without it.
    }
    const result = tapCell(pathRef.current, cell, cols, blocked);
    // Pressing the last selected letter submits only if released without moving;
    // dragging away from it continues the word instead.
    if (!result.submit) setPath(result.path);
    drag.current = { active: true, moved: false, pendingSubmit: result.submit };
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const board = boardRef.current;
    const from = lastPoint.current;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    // Sample along the movement so fast swipes (or dropped frames) never skip a letter.
    const step = board ? board.getBoundingClientRect().width / cols / 6 : 0;
    const dist = from ? Math.hypot(e.clientX - from.x, e.clientY - from.y) : 0;
    const samples = step > 0 ? Math.min(60, Math.ceil(dist / step)) : 1;
    let next = pathRef.current;
    for (let i = 1; i <= Math.max(1, samples); i++) {
      const t = samples > 0 ? i / samples : 1;
      const x = from ? from.x + (e.clientX - from.x) * t : e.clientX;
      const y = from ? from.y + (e.clientY - from.y) * t : e.clientY;
      const cell = cellFromPoint(x, y, true);
      if (cell != null) next = dragTo(next, cell, cols, blocked);
    }
    if (next !== pathRef.current) {
      drag.current.moved = true;
      setPath(next);
    }
  };

  const handlePointerUp = () => {
    if (!drag.current.active) return;
    const { moved, pendingSubmit } = drag.current;
    drag.current = IDLE;
    // A drag submits on release; a plain tap keeps building the word.
    if ((moved && pathRef.current.length > 1) || (pendingSubmit && !moved)) submit(pathRef.current);
  };

  const handlePointerCancel = () => {
    drag.current = IDLE;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setPath([]);
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (!target || disabled) return;
    const cell = Number(target.dataset.cell);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tap(cell);
      return;
    }
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      const [r, c] = toRowCol(cell, cols);
      const nr = Math.min(rows - 1, Math.max(0, r + move[0]));
      const nc = Math.min(cols - 1, Math.max(0, c + move[1]));
      boardRef.current?.querySelector<HTMLElement>(`[data-cell="${nr * cols + nc}"]`)?.focus();
    }
  };

  const centre = (cell: number) => {
    const [r, c] = toRowCol(cell, cols);
    return `${c * 100 + 50},${r * 100 + 50}`;
  };
  const selected = new Set(path);

  return (
    <div
      ref={boardRef}
      className={`board${disabled ? ' is-disabled' : ''}`}
      style={{ ['--cols' as string]: cols, ['--rows' as string]: rows }}
      role="grid"
      aria-label="Letter grid"
      aria-rowcount={rows}
      aria-colcount={cols}
      data-testid="board"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerUp}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg className="board-lines" viewBox={`0 0 ${cols * 100} ${rows * 100}`} aria-hidden="true">
        {foundWords.map((w) => (
          <polyline
            key={w.word}
            pathLength={1}
            className={`line ${w.isSpangram ? 'line-spangram' : 'line-word'}`}
            points={w.cells.map(centre).join(' ')}
          />
        ))}
        {hinted && hint?.level === 2 && <polyline className="line line-hint" points={hinted.cells.map(centre).join(' ')} />}
        {path.length > 1 && <polyline className="line line-select" points={path.map(centre).join(' ')} />}
      </svg>

      {letters.map((letter, cell) => {
        const info = cellInfo.get(cell);
        const isHinted = hinted?.cells.includes(cell) ?? false;
        const isHintStart = isHinted && hint?.level === 2 && hinted!.cells[0] === cell;
        const pop = info && celebrating?.word === info.word;
        const classes = [
          'cell',
          selected.has(cell) && 'is-selected',
          path[path.length - 1] === cell && 'is-head',
          info && (info.spangram ? 'is-spangram' : 'is-found'),
          isHinted && 'is-hinted',
          isHintStart && 'is-hint-start',
          pop && 'is-pop',
        ]
          .filter(Boolean)
          .join(' ');
        const [r, c] = toRowCol(cell, cols);
        return (
          <div
            key={cell}
            className={classes}
            data-cell={cell}
            role="gridcell"
            tabIndex={cell === 0 ? 0 : -1}
            aria-rowindex={r + 1}
            aria-colindex={c + 1}
            aria-selected={selected.has(cell)}
            aria-label={`${letter}${info ? ', found' : ''}${isHinted ? ', hinted' : ''}`}
            style={pop ? { ['--i' as string]: info!.index } : undefined}
          >
            <span className="cell-letter">{letter}</span>
          </div>
        );
      })}
    </div>
  );
}
