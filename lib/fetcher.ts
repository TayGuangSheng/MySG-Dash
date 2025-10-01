export async function jsonFetcher<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return (await response.json()) as T;
}