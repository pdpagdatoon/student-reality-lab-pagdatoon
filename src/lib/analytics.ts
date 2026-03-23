export const trackEvent = async (eventName: string, payload: Record<string, unknown> = {}) => {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, payload }),
    });
  } catch {
    // Analytics should never interrupt user flows.
  }
};
