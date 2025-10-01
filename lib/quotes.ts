const QUOTES = [
  { id: "smallSteps", text: "Small steps make long journeys possible.", author: "GS" },
  { id: "consistencyBeatsIntensity", text: "Consistency beats intensity when it comes to progress.", author: "James Clear" },
  { id: "systemsOverGoals", text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { id: "disciplineBridge", text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { id: "sumOfEfforts", text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { id: "futureToday", text: "Your future is created by what you do today, not tomorrow.", author: "GS" },
  { id: "stayFocused", text: "Stay focused and never give up.", author: "GS" },
] as const;

export type Quote = (typeof QUOTES)[number];
export type QuoteId = Quote["id"];

export function getDailyQuote(seed: string): Quote {
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
