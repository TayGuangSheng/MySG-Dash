const QUOTES: Array<{ text: string; author: string }> = [
  { text: "Small steps make long journeys possible.", author: "GS" },
  { text: "Consistency beats intensity when it comes to progress.", author: "James Clear" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "GS" },
  { text: "Stay focused and never give up.", author: "GS" },
];

export function getDailyQuote(seed: string) {
  const index = hashString(seed) % QUOTES.length;
  return QUOTES[index];
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}