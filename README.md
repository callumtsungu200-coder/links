# Wordweave

An unlimited, themed word-search game inspired by the *Strands* format, built with **React** and **TypeScript**.
Each round gives you a theme and a 6 × 8 grid of letters. Find every theme word, plus the **spangram**: a word or
phrase that sums up the theme and stretches from one side of the board to the other.

No accounts, no backend, no daily limit. A fresh board is generated every game.

---

## Features

**Gameplay**
- 6 × 8 letter grid where every letter belongs to exactly one word
- Select letters horizontally, vertically or diagonally
- **Drag** with a mouse or finger and release to submit. Slide back over the previous letter to undo it.
- **Tap** letters one at a time, then tap the last letter again to submit
- **Keyboard**: arrow keys move between letters, Enter/Space selects, Esc clears
- Found words stay highlighted and connected: blue for theme words, gold for the spangram
- Lists found words and placeholders (letter counts) for the words still to find
- Two-step hints: the first outlines a word's letters, the second shows the order
- Completion screen with your time, hints and streak

**Unlimited play**
- 28 original themed puzzles, each with a pool of 12–14 candidate words
- Every game builds a **new board**: a random subset of the theme words is laid out on a random tiling, so a theme
  plays differently each time it comes up
- Puzzles are picked at random, and the last 12 played are skipped while others are available
- An in-progress game survives page reloads

**Statistics** (saved in `localStorage`)
- Games played and completed, completion percentage
- Average and best completion time
- Total words discovered and hints used
- Current and longest winning streak. Skipping an unfinished puzzle resets the current streak.

**Design**
- Clean, minimal interface with animated selection, line drawing, word pops, toasts and a completion celebration
- Light and dark mode. It follows the system setting until you choose one, and your choice is remembered.
- Responsive layout: two columns on desktop, one column on phones, with the grid sized to fit the screen
- Honours `prefers-reduced-motion`

---

## Getting started

Requirements: **Node.js 18+** and npm.

```bash
npm install
npm run dev        # start the dev server at http://localhost:5173
```

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload      |
| `npm run build`     | Type-check and build for production (`dist/`)  |
| `npm run preview`   | Serve the production build locally             |
| `npm test`          | Run the test suite once                        |
| `npm run test:watch`| Run tests in watch mode                        |
| `npm run typecheck` | Type-check without emitting                    |

---

## How puzzles are generated

Puzzles are stored as **definitions** (`src/game/puzzles.ts`): a theme clue, a spangram and a pool of theme words.
A playable board is generated from a definition with a seeded random number generator (`src/game/generator.ts`):

1. **Pick words.** Choose a random subset of the pool whose letter counts exactly fill the 48 cells left after the
   spangram.
2. **Place the spangram.** A random path from one edge to the opposite edge (left to right, or top to bottom when the
   spangram is long enough).
3. **Tile the rest by backtracking.** Repeatedly take the empty cell with the fewest free neighbours and grow a random
   path from it for one of the remaining words. After each placement, every empty region must still be fillable by
   the words that are left (a subset-sum check). If it isn't, the search backs up.
4. **Validate.** Each board is checked before it is used: every cell is covered exactly once, every word is a
   connected path matching the grid letters, no two diagonal moves cross, and the spangram spans the board. A board
   that fails is regenerated.

Generation takes about 2 ms per board. The test suite generates 700 boards (25 seeds × 28 puzzles) and validates
every one.

### Adding a puzzle

Add an entry to `PUZZLES` in `src/game/puzzles.ts`:

```ts
{
  id: 'my-theme',            // unique
  theme: 'Clue shown to players',
  spangram: 'SPANGRAM',      // A–Z only, at least 6 letters (8+ can also run top to bottom)
  pool: ['WORD', 'ANOTHER', /* … aim for 12+ words of 4–10 letters */],
}
```

Run `npm test`. The tests check that the new puzzle is well-formed, that some word subset exactly fills the board,
and that boards generate reliably across many seeds.

---

## Project structure

```
src/
├── App.tsx                 Game screen, dialogs, timer and stats wiring
├── main.tsx                Entry point; loads or starts a game before rendering
├── styles.css              Design tokens (light/dark), layout and animations
├── components/
│   ├── Grid.tsx            Letter grid: pointer, touch and keyboard selection, SVG word lines
│   ├── WordList.tsx        Found and remaining words
│   ├── StatsPanel.tsx      Statistics tiles
│   ├── Modal.tsx           Accessible dialog
│   └── Icons.tsx           Inline SVG icons
├── hooks/
│   └── useTheme.ts         Light/dark mode and saved preferences
├── game/
│   ├── puzzles.ts          The original puzzle collection
│   ├── generator.ts        Board generation and validation
│   ├── selection.ts        Pure drag/tap selection rules
│   ├── gameState.ts        Submitting words, hints, win detection
│   ├── stats.ts            Statistics model
│   ├── picker.ts           Random puzzle selection with recent-history avoidance
│   ├── session.ts          Saving and resuming games and stats
│   ├── storage.ts          Safe localStorage wrapper
│   ├── grid.ts             Grid geometry helpers
│   └── rng.ts              Seeded PRNG and shuffle
└── test/setup.ts           Test environment polyfills
```

Game rules live in plain TypeScript modules under `src/game/`, separate from React, so they are easy to test.

---

## Testing

```bash
npm test
```

There are 83 tests (Vitest + Testing Library + jsdom). They cover:

- **Selection mechanics**: adjacency in all eight directions, no wrapping across rows, drag extend and retract,
  no revisiting cells, found cells blocked, tap to extend, trim and submit, filling in letters skipped by a fast
  swipe, dead zones at cell corners so diagonal drags don't clip neighbours, keyboard play, and a drag that starts
  on the last tapped letter
- **Generator**: every puzzle produces valid, fully covered, crossing-free boards across many seeds. Generation is
  deterministic for a given seed. The validator rejects broken boards.
- **Game logic**: word and spangram recognition, words traced backwards, short and invalid words, duplicate finds,
  winning, hint escalation and the spangram being hinted last
- **Stats and persistence**: streaks, averages and best times, resuming saved games, recovering from corrupted
  storage, and recent-puzzle avoidance
- **Full game**: an integration test plays a whole puzzle through the UI to the completion screen and the next
  puzzle. Others check hints, skipping, and several finds submitted before React re-renders.

---

## Deployment

### Netlify

The repository includes `netlify.toml`, so no setup is needed:

1. Push the project to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and pick the repository.
3. Netlify reads the build settings from `netlify.toml` (`npm run build`, publish `dist`) and deploys.

Or deploy from the command line:

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/wordweave.git
git push -u origin main
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the tests and the production build on every push to
`main` and on every pull request.

---

## Data and privacy

Everything stays in your browser's `localStorage` under keys starting with `wordweave:`:

| Key                 | Contents                                    |
| ------------------- | ------------------------------------------- |
| `wordweave:stats`   | Statistics                                  |
| `wordweave:current` | The game in progress (so reloads resume it) |
| `wordweave:recent`  | Recently played puzzle IDs                  |
| `wordweave:prefs`   | Colour scheme and whether help was seen     |

There are no network requests, analytics or cookies. You can clear statistics from the Statistics dialog.

---

## Credits and licence

Wordweave is an original, independent project. It is inspired by the themed word-search format but is not affiliated
with, or endorsed by, any other publisher. All puzzles, code and visuals are original.

Released under the [MIT License](LICENSE).
