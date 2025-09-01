// Simple in-memory storage for Vercel deployment
// In production, use a real database like PostgreSQL or MongoDB

let transactions = [];
let transactionIdCounter = 1;

const db = {
  prepare: (query) => {
    // Mock SQLite interface for compatibility
    if (query.includes('SELECT * FROM transactions')) {
      return {
        all: () => transactions,
        get: (id) => transactions.find(t => t.id === id)
      };
    }
    
    if (query.includes('INSERT INTO transactions')) {
      return {
        run: (ticker, type, quantity, price, date) => {
          const newTransaction = {
            id: transactionIdCounter++,
            ticker,
            type,
            quantity,
            price,
            date,
            created_at: new Date().toISOString()
          };
          transactions.push(newTransaction);
          return { lastInsertRowid: newTransaction.id };
        }
      };
    }
    
    if (query.includes('DELETE FROM transactions')) {
      return {
        run: (id) => {
          transactions = transactions.filter(t => t.id !== parseInt(id));
          return { changes: 1 };
        }
      };
    }
    
    if (query.includes('GROUP BY ticker')) {
      return {
        all: () => {
          const holdings = {};
          transactions.forEach(t => {
            if (!holdings[t.ticker]) {
              holdings[t.ticker] = { 
                ticker: t.ticker, 
                quantity: 0, 
                totalBuyPrice: 0,
                buyCount: 0
              };
            }
            if (t.type === 'buy') {
              holdings[t.ticker].quantity += t.quantity;
              holdings[t.ticker].totalBuyPrice += t.price * t.quantity;
              holdings[t.ticker].buyCount += t.quantity;
            } else {
              holdings[t.ticker].quantity -= t.quantity;
            }
          });
          
          return Object.values(holdings)
            .filter(h => h.quantity > 0)
            .map(h => ({
              ticker: h.ticker,
              quantity: h.quantity,
              average_price: h.buyCount > 0 ? h.totalBuyPrice / h.buyCount : 0
            }));
        }
      };
    }
    
    return { all: () => [], run: () => ({ lastInsertRowid: 0 }) };
  },
  
  exec: () => {}
};

function getDb() {
  return db;
}

module.exports = { getDb };
