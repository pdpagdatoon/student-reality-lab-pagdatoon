export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { eventName, payload } = body;

  if (typeof eventName !== 'string' || eventName.length === 0 || eventName.length > 80) {
    return res.status(400).json({ error: 'Invalid eventName' });
  }

  console.log('[analytics]', eventName, payload ?? {});
  return res.status(200).json({ ok: true });
}
