// Shared in-memory cache for GET /api/data
// Invalidated by any write operation (POST /api/data or PUT /api/admin/update)

let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5000; // 5 seconds

export function getCachedData<T>(): { data: T; hit: boolean } | null {
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return { data: cachedData.data as T, hit: true };
  }
  return null;
}

export function setCachedData<T>(data: T): void {
  cachedData = { data, timestamp: Date.now() };
}

export function clearDataCache(): void {
  cachedData = null;
}
