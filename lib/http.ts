export async function fetchJson<T>(
  input: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request to ${input} failed with ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}