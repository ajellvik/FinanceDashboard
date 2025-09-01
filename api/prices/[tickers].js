const axios = require('axios');
const { verifyToken } = require('../auth');

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

  // Verify authentication
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { tickers } = req.query;
  
  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter required' });
  }

  const tickerList = tickers.split(',');
  const prices = {};

  try {
    // For demo purposes, return mock prices
    // In production, you would fetch real prices from Yahoo Finance API
    for (const ticker of tickerList) {
      // Generate mock price data
      const basePrice = {
        'AAPL': 175,
        'MSFT': 320,
        'GOOGL': 2450,
        'AMZN': 3350,
        'TSLA': 720,
        'NVDA': 450,
        'META': 350
      }[ticker] || 100;

      const change = (Math.random() - 0.5) * 10;
      const changePercent = (change / basePrice) * 100;

      prices[ticker] = {
        price: basePrice + change,
        current: basePrice + change,
        change: change,
        changePercent: changePercent
      };
    }

    return res.status(200).json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
};
