const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const PASSWORD = process.env.APP_PASSWORD || 'Fika175';

function verifyToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

function generateToken() {
  return jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '24h' });
}

function checkPassword(password) {
  return password === PASSWORD;
}

module.exports = { verifyToken, generateToken, checkPassword };
