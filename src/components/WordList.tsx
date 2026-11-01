import type { PlacedWord } from '../game/types';

interface WordListProps {
  words: readonly PlacedWord[];
  found: readonly string[];
}

/** Spangram first, then theme words by length so blanks never jump around. */
function ordered(words: readonly PlacedWord[]): PlacedWord[] {
  return words
    .slice()
    .sort((a, b) => Number(b.isSpangram) - Number(a.isSpangram) || a.word.length - b.word.length || a.word.localeCompare(b.word));
}

export function WordList({ words, found }: WordListProps) {
  const remaining = words.length - found.length;
  return (
    <section className="word-list" aria-label="Theme words">
      <div className="word-list-head">
        <h3>Words</h3>
        <span className="muted">{remaining === 0 ? 'All found' : `${remaining} remaining`}</span>
      </div>
      <ul>
        {ordered(words).map((w) => {
          const isFound = found.includes(w.word);
          const kind = w.isSpangram ? 'chip-spangram' : 'chip-word';
          return (
            <li
              key={w.word}
              className={`chip ${kind} ${isFound ? 'is-found' : 'is-hidden'}`}
              aria-label={isFound ? `${w.isSpangram ? 'Spangram' : 'Word'}: ${w.word}` : `${w.isSpangram ? 'Spangram' : 'Word'}, ${w.word.length} letters, not found`}
            >
              {w.isSpangram && <span className="chip-tag">Spangram</span>}
              {isFound ? (
                <span className="chip-text">{w.word}</span>
              ) : (
                <span className="chip-blanks" aria-hidden="true">
                  {Array.from(w.word, (_, i) => (
                    <i key={i} />
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
