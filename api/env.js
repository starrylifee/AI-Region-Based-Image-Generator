module.exports = (req, res) => {
  const allowedMethods = ['GET', 'HEAD'];
  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    '';
  const apiUrl =
    process.env.GEMINI_API_URL ||
    process.env.GEMINI_API_ENDPOINT ||
    process.env.API_URL ||
    '';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  return res.status(200).json({
    API_KEY: apiKey || '',
    API_URL: apiUrl || ''
  });
};

