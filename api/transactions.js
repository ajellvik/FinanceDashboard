const { getDb } = require('./db');
const { verifyToken } = require('./auth');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verify authentication
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();

  if (req.method === 'GET') {
    try {
      const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
      return res.status(200).json(transactions);
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    const { ticker, type, quantity, price, date } = req.body;
    
    if (!ticker || !type || !quantity || !price || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const stmt = db.prepare('INSERT INTO transactions (ticker, type, quantity, price, date) VALUES (?, ?, ?, ?, ?)');
      const result = stmt.run(ticker, type, quantity, price, date);
      
      const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(newTransaction);
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    
    if (!id) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    try {
      const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
      stmt.run(id);
      return res.status(200).json({ message: 'Transaction deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
