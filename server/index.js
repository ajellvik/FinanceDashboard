const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Hardcoded password (hashed)
const PASSWORD = 'Fika175';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Initialize SQLite database
const db = new sqlite3.Database('./portfolio.db');

// Create tables if they don't exist
db.serialize(() => {
  // Transaktioner tabell
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      company_name TEXT,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'SEK',
      transaction_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Aktuella innehav tabell
  db.run(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT UNIQUE NOT NULL,
      company_name TEXT,
      quantity REAL NOT NULL,
      average_price REAL NOT NULL,
      currency TEXT DEFAULT 'SEK',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Prishistorik tabell
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'SEK',
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Portfolio värde historik tabell
  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_value REAL NOT NULL,
      total_cost REAL NOT NULL,
      profit_loss REAL NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    )
  `);
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'Ingen åtkomst - logga in först' });
  }
  
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ogiltig token' });
  }
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Lösenord krävs' });
  }
  
  if (!bcrypt.compareSync(password, PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Fel lösenord' });
  }
  
  const token = jwt.sign({ userId: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({ success: true, token });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', verifyToken, (req, res) => {
  res.json({ authenticated: true });
});

// API Routes

// Hämta alla transaktioner (protected)
app.get('/api/transactions', verifyToken, (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY transaction_date DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Lägg till ny transaktion (protected)
app.post('/api/transactions', verifyToken, (req, res) => {
  const { ticker, company_name, type, quantity, price, currency, transaction_date } = req.body;
  
  db.run(
    `INSERT INTO transactions (ticker, company_name, type, quantity, price, currency, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticker, company_name, type, quantity, price, currency || 'SEK', transaction_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Uppdatera holdings
      updateHoldings(ticker, () => {
        res.json({ id: this.lastID, message: 'Transaktion tillagd' });
      });
    }
  );
});

// Ta bort transaktion (protected)
app.delete('/api/transactions/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT ticker FROM transactions WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const ticker = row?.ticker;
    
    db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (ticker) {
        updateHoldings(ticker, () => {
          res.json({ message: 'Transaktion borttagen' });
        });
      } else {
        res.json({ message: 'Transaktion borttagen' });
      }
    });
  });
});

// Hämta alla innehav (protected)
app.get('/api/holdings', verifyToken, (req, res) => {
  db.all('SELECT * FROM holdings ORDER BY ticker', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Hämta aktuella priser från Yahoo Finance (protected)
app.get('/api/prices/:tickers', verifyToken, async (req, res) => {
  const tickers = req.params.tickers.split(',');
  const prices = {};
  
  // Hämta aktuell valutakurs för USD till SEK
  let usdToSek = 10.5; // Fallback värde
  try {
    const sekQuote = await yahooFinance.quote('SEK=X');
    if (sekQuote && sekQuote.regularMarketPrice) {
      usdToSek = sekQuote.regularMarketPrice;
    }
  } catch (error) {
    console.log('Kunde inte hämta USD/SEK kurs, använder fallback:', usdToSek);
  }
  
  try {
    for (const ticker of tickers) {
      try {
        // För svenska aktier, lägg till .ST för Stockholm
        let yahooTicker = ticker;
        
        // Kolla om det är en svensk aktie (kan utökas med fler)
        const swedishStocks = ['VOLV-B', 'ERIC-B', 'HM-B', 'SEB-A', 'SWED-A', 'ABB', 'ASSA-B', 'ATCO-A', 'ATCO-B'];
        if (swedishStocks.some(s => ticker.toUpperCase().includes(s))) {
          yahooTicker = ticker.replace('-', '') + '.ST';
        }
        // Annars kolla om det redan har en börsändelse
        else if (!ticker.includes('.')) {
          // Anta att det är en US-aktie om ingen ändelse finns
          yahooTicker = ticker;
        }
        
        const quote = await yahooFinance.quote(yahooTicker);
        
        if (quote) {
          // Konvertera till SEK om det är USD
          let priceInSek = quote.regularMarketPrice || 0;
          let currency = quote.currency || 'USD';
          
          if (currency === 'USD') {
            priceInSek = priceInSek * usdToSek;
          }
          
          prices[ticker] = {
            current: priceInSek,
            change: (quote.regularMarketChange || 0) * (currency === 'USD' ? usdToSek : 1),
            changePercent: quote.regularMarketChangePercent || 0,
            currency: 'SEK',
            originalCurrency: currency,
            marketPrice: quote.regularMarketPrice,
            dayHigh: quote.regularMarketDayHigh * (currency === 'USD' ? usdToSek : 1),
            dayLow: quote.regularMarketDayLow * (currency === 'USD' ? usdToSek : 1),
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            name: quote.longName || quote.shortName || ticker
          };
        }
      } catch (tickerError) {
        console.error(`Fel vid hämtning av pris för ${ticker}:`, tickerError.message);
        // Använd fallback för denna ticker
        prices[ticker] = {
          current: Math.random() * 1000 + 100,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 5,
          currency: 'SEK',
          error: true
        };
      }
    }
    
    res.json(prices);
  } catch (error) {
    console.error('Fel vid hämtning av priser:', error);
    res.status(500).json({ error: 'Kunde inte hämta priser' });
  }
});

// Hämta historisk data
app.get('/api/history/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { period = '1M' } = req.query;
  
  // För demo-syften, generera dummy-data
  const endDate = new Date();
  let startDate = new Date();
  
  switch(period) {
    case '1W':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1Y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'YTD':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      break;
  }
  
  const history = [];
  const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  let basePrice = Math.random() * 500 + 100;
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    basePrice += (Math.random() - 0.5) * 10;
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.max(basePrice, 10)
    });
  }
  
  res.json(history);
});

// Spara portfolio historik
app.post('/api/portfolio-history/save', verifyToken, async (req, res) => {
  try {
    // Hämta alla innehav
    db.all('SELECT * FROM holdings', async (err, holdings) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (holdings.length === 0) {
        return res.json({ message: 'Inga innehav att spara' });
      }
      
      // Beräkna totalt värde och kostnad
      let totalValue = 0;
      let totalCost = 0;
      
      for (const holding of holdings) {
        const currentPrice = holding.average_price; // Use real price in production
        totalValue += holding.quantity * currentPrice;
        totalCost += holding.quantity * holding.average_price;
      }
      
      const profitLoss = totalValue - totalCost;
      const today = new Date().toISOString().split('T')[0];
      
      // Spara eller uppdatera dagens värde
      db.run(
        `INSERT OR REPLACE INTO portfolio_history (total_value, total_cost, profit_loss, date)
         VALUES (?, ?, ?, ?)`,
        [totalValue, totalCost, profitLoss, today],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ 
            message: 'Portfolio historik sparad',
            data: { totalValue, totalCost, profitLoss, date: today }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte spara portfolio historik' });
  }
});

// Hämta portfolio historik
app.get('/api/portfolio-history', verifyToken, (req, res) => {
  const { days = 30 } = req.query;
  
  const query = `
    SELECT * FROM portfolio_history 
    WHERE date >= date('now', '-${days} days')
    ORDER BY date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Hämta valutakurser
app.get('/api/exchange-rates', async (req, res) => {
  try {
    // För demo-syften, använd statiska kurser
    // I produktion skulle du använda en riktig valuta-API
    const rates = {
      'USD': 10.5,
      'EUR': 11.5,
      'GBP': 13.2,
      'NOK': 1.0,
      'DKK': 1.55
    };
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Kunde inte hämta valutakurser' });
  }
});

// Helper function to update holdings
function updateHoldings(ticker, callback) {
  db.all(
    'SELECT * FROM transactions WHERE ticker = ?',
    [ticker],
    (err, transactions) => {
      if (err) {
        console.error(err);
        callback();
        return;
      }
      
      let totalQuantity = 0;
      let totalCost = 0;
      let companyName = '';
      
      transactions.forEach(t => {
        if (t.type === 'KÖP') {
          totalQuantity += t.quantity;
          totalCost += t.quantity * t.price;
        } else if (t.type === 'SÄLJ') {
          totalQuantity -= t.quantity;
          totalCost -= t.quantity * t.price;
        }
        if (t.company_name) companyName = t.company_name;
      });
      
      if (totalQuantity > 0) {
        const avgPrice = totalCost / totalQuantity;
        
        db.run(
          `INSERT OR REPLACE INTO holdings (ticker, company_name, quantity, average_price, currency, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [ticker, companyName, totalQuantity, avgPrice, 'SEK'],
          callback
        );
      } else {
        db.run('DELETE FROM holdings WHERE ticker = ?', [ticker], callback);
      }
    }
  );
}

app.listen(PORT, () => {
  console.log(`Server körs på port ${PORT}`);
});
