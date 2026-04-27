export default function handler(_req, res) {
  res.status(200).json({
    status: 'ok',
    updated: '2026-03-23',
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  });
}
