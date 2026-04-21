import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
  blockDuration: 120,
});

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export async function consumeDomainCheckRateLimit(key: string): Promise<RateLimitResult> {
  try {
    const result = await rateLimiter.consume(key);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: result.remainingPoints,
    };
  } catch (error) {
    const details = error as { msBeforeNext?: number; remainingPoints?: number };

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((details.msBeforeNext ?? 0) / 1000),
      remaining: details.remainingPoints ?? 0,
    };
  }
}
