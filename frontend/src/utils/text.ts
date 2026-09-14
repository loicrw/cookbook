/** Small wording helpers, so counts read correctly wherever they are shown. */

/** "1 step", "2 steps". Only handles nouns that pluralise with an "s". */
export function plural(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

/** "never", "once", "3 times". */
export function timesCooked(count: number): string {
  if (count === 0) return "never";
  return count === 1 ? "once" : `${count} times`;
}

/** "not cooked yet", "cooked once", "cooked 3 times". */
export function cookedSummary(count: number): string {
  return count === 0 ? "not cooked yet" : `cooked ${timesCooked(count)}`;
}
