module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token && token !== 'undefined' && token !== 'null') {
      // For simplicity, just check if token exists
      // In production, verify with JWT
      return res.status(200).json({ authenticated: true });
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
  
  return res.status(200).json({ authenticated: false });
};
