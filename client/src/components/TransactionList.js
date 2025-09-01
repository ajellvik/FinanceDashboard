import React, { useState } from 'react';
import { Trash2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const TransactionList = ({ transactions, onDelete }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [filterTicker, setFilterTicker] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRows, setExpandedRows] = useState([]);

  const formatCurrency = (amount, currency = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Är du säker på att du vill ta bort denna transaktion?')) {
      onDelete(id);
    }
  };

  // Filter transactions
  let filteredTransactions = transactions;
  
  if (filterType !== 'ALL') {
    filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
  }
  
  if (filterTicker) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.ticker.toLowerCase().includes(filterTicker.toLowerCase())
    );
  }

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'date':
        compareValue = new Date(b.transaction_date) - new Date(a.transaction_date);
        break;
      case 'ticker':
        compareValue = a.ticker.localeCompare(b.ticker);
        break;
      case 'type':
        compareValue = a.type.localeCompare(b.type);
        break;
      case 'amount':
        compareValue = (b.quantity * b.price) - (a.quantity * a.price);
        break;
      default:
        compareValue = 0;
    }
    
    return sortOrder === 'asc' ? -compareValue : compareValue;
  });

  // Get unique tickers for filter
  const uniqueTickers = [...new Set(transactions.map(t => t.ticker))].sort();

  // Calculate statistics
  const totalBought = transactions
    .filter(t => t.type === 'KÖP')
    .reduce((sum, t) => sum + (t.quantity * t.price), 0);
  
  const totalSold = transactions
    .filter(t => t.type === 'SÄLJ')
    .reduce((sum, t) => sum + (t.quantity * t.price), 0);

  return (
    <div className="transaction-list-container">
      <div className="list-header">
        <h2>Transaktionshistorik</h2>
        <div className="list-stats">
          <div className="stat-item">
            <span>Totalt köpt:</span>
            <strong className="positive">{formatCurrency(totalBought)}</strong>
          </div>
          <div className="stat-item">
            <span>Totalt sålt:</span>
            <strong className="negative">{formatCurrency(totalSold)}</strong>
          </div>
          <div className="stat-item">
            <span>Antal transaktioner:</span>
            <strong>{transactions.length}</strong>
          </div>
        </div>
      </div>

      <div className="list-filters">
        <div className="filter-group">
          <label>
            <Filter size={16} />
            Typ:
          </label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Alla</option>
            <option value="KÖP">Köp</option>
            <option value="SÄLJ">Sälj</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Ticker:</label>
          <select 
            value={filterTicker} 
            onChange={(e) => setFilterTicker(e.target.value)}
            className="filter-select"
          >
            <option value="">Alla</option>
            {uniqueTickers.map(ticker => (
              <option key={ticker} value={ticker}>{ticker}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sortera efter:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">Datum</option>
            <option value="ticker">Ticker</option>
            <option value="type">Typ</option>
            <option value="amount">Belopp</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Datum {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} className="sortable">
                Typ {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('ticker')} className="sortable">
                Ticker {sortBy === 'ticker' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Företag</th>
              <th>Antal</th>
              <th>Pris/st</th>
              <th onClick={() => handleSort('amount')} className="sortable">
                Totalt {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-message">
                  Inga transaktioner att visa
                </td>
              </tr>
            ) : (
              sortedTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <tr 
                    className={`transaction-row ${expandedRows.includes(transaction.id) ? 'expanded' : ''}`}
                    onClick={() => toggleRowExpansion(transaction.id)}
                  >
                    <td>
                      {format(new Date(transaction.transaction_date), 'd MMM yyyy', { locale: sv })}
                    </td>
                    <td>
                      <span className={`transaction-type ${transaction.type === 'KÖP' ? 'buy' : 'sell'}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="ticker">{transaction.ticker}</td>
                    <td>{transaction.company_name || '-'}</td>
                    <td>{transaction.quantity}</td>
                    <td>{formatCurrency(transaction.price, transaction.currency)}</td>
                    <td className={transaction.type === 'KÖP' ? 'negative' : 'positive'}>
                      {formatCurrency(transaction.quantity * transaction.price, transaction.currency)}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(transaction.id);
                        }}
                        className="delete-btn"
                        title="Ta bort transaktion"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                  {expandedRows.includes(transaction.id) && (
                    <tr className="expanded-details">
                      <td colSpan="8">
                        <div className="transaction-details">
                          <div className="detail-item">
                            <span>ID:</span>
                            <strong>{transaction.id}</strong>
                          </div>
                          <div className="detail-item">
                            <span>Valuta:</span>
                            <strong>{transaction.currency}</strong>
                          </div>
                          <div className="detail-item">
                            <span>Tillagd:</span>
                            <strong>
                              {format(new Date(transaction.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                            </strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
