import type { Payload } from "payload";

const RETENTION_SWEEP_INTERVAL_MS = 24 * 60 * 60_000;
let lastRetentionSweepAt = 0;

/**
 * Remove consented analytics events older than 13 months at most once per
 * process-day. Health checks call this even when no new visitor event arrives,
 * so the documented retention window does not depend on continued traffic.
 */
export async function enforceAnalyticsRetention(payload: Payload) {
  const now = Date.now();
  if (now - lastRetentionSweepAt < RETENTION_SWEEP_INTERVAL_MS) return;
  lastRetentionSweepAt = now;

  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 13);
  try {
    await payload.delete({
      collection: "analytics-events",
      overrideAccess: true,
      where: { recordedAt: { less_than: cutoff.toISOString() } },
    });
  } catch (error) {
    // Retention maintenance must not take the public site or health endpoint
    // offline; the next process day will retry.
    console.error("Old analytics events could not be removed", error);
  }
}
