// Simple in-memory rate limiter
const rateLimit = {
  // Store IP addresses and their request timestamps
  store: new Map<string, number[]>(),

  // Check if an IP has exceeded the rate limit
  check: (ip: string, limit: number, timeWindowMs: number): boolean => {
    const now = Date.now()

    // Get existing timestamps for this IP
    const timestamps = rateLimit.store.get(ip) || []

    // Filter out timestamps outside the time window
    const recentTimestamps = timestamps.filter((timestamp) => now - timestamp < timeWindowMs)

    // Update the store with recent timestamps
    rateLimit.store.set(ip, recentTimestamps)

    // Check if the number of recent requests exceeds the limit
    if (recentTimestamps.length >= limit) {
      return false // Rate limit exceeded
    }

    // Add current timestamp and return true
    recentTimestamps.push(now)
    rateLimit.store.set(ip, recentTimestamps)
    return true
  },

  // Reset the store (useful for testing)
  reset: () => {
    rateLimit.store.clear()
  },
}

export default rateLimit

