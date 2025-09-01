import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const Dashboard = ({ holdings, transactions, prices }) => {
  // Beräkna total portföljvärde
  const calculatePortfolioValue = () => {
    return holdings.reduce((total, holding) => {
      const currentPrice = prices[holding.ticker]?.current || holding.average_price;
      return total + (holding.quantity * currentPrice);
    }, 0);
  };

  // Beräkna total kostnad
  const calculateTotalCost = () => {
    return holdings.reduce((total, holding) => {
      return total + (holding.quantity * holding.average_price);
    }, 0);
  };

  // Beräkna total vinst/förlust
  const calculateTotalProfitLoss = () => {
    const currentValue = calculatePortfolioValue();
    const totalCost = calculateTotalCost();
    return currentValue - totalCost;
  };

  // Beräkna procentuell förändring
  const calculatePercentageChange = () => {
    const totalCost = calculateTotalCost();
    if (totalCost === 0) return 0;
    const profitLoss = calculateTotalProfitLoss();
    return (profitLoss / totalCost) * 100;
  };

  // Hämta dagens förändring
  const calculateDailyChange = () => {
    return holdings.reduce((total, holding) => {
      const change = prices[holding.ticker]?.change || 0;
      return total + (holding.quantity * change);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const portfolioValue = calculatePortfolioValue();
  const totalCost = calculateTotalCost();
  const totalProfitLoss = calculateTotalProfitLoss();
  const percentageChange = calculatePercentageChange();
  const dailyChange = calculateDailyChange();

  // Hämta senaste transaktioner
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <DollarSign size={20} />
            <span>Totalt värde</span>
          </div>
          <div className="card-value">{formatCurrency(portfolioValue)}</div>
          <div className={`card-change ${dailyChange >= 0 ? 'positive' : 'negative'}`}>
            {dailyChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{formatCurrency(Math.abs(dailyChange))} idag</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <BarChart3 size={20} />
            <span>Total vinst/förlust</span>
          </div>
          <div className={`card-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalProfitLoss)}
          </div>
          <div className={`card-change ${percentageChange >= 0 ? 'positive' : 'negative'}`}>
            <Percent size={16} />
            <span>{formatPercentage(percentageChange)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <DollarSign size={20} />
            <span>Investerat belopp</span>
          </div>
          <div className="card-value">{formatCurrency(totalCost)}</div>
          <div className="card-subtitle">Genomsnittlig kostnad</div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <Calendar size={20} />
            <span>Antal innehav</span>
          </div>
          <div className="card-value">{holdings.length}</div>
          <div className="card-subtitle">Aktiva positioner</div>
        </div>
      </div>

      <div className="holdings-section">
        <h2>Aktuella innehav</h2>
        <div className="holdings-table">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Företag</th>
                <th>Antal</th>
                <th>Snittpris</th>
                <th>Aktuellt pris</th>
                <th>Värde</th>
                <th>Vinst/Förlust</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const currentPrice = prices[holding.ticker]?.current || holding.average_price;
                const value = holding.quantity * currentPrice;
                const cost = holding.quantity * holding.average_price;
                const profitLoss = value - cost;
                const profitLossPercent = ((value - cost) / cost) * 100;

                return (
                  <tr key={holding.ticker}>
                    <td className="ticker">{holding.ticker}</td>
                    <td>{holding.company_name || holding.ticker}</td>
                    <td>{holding.quantity}</td>
                    <td>{formatCurrency(holding.average_price)}</td>
                    <td>{formatCurrency(currentPrice)}</td>
                    <td>{formatCurrency(value)}</td>
                    <td className={profitLoss >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(profitLoss)}
                    </td>
                    <td className={profitLossPercent >= 0 ? 'positive' : 'negative'}>
                      {formatPercentage(profitLossPercent)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="recent-transactions">
        <h2>Senaste transaktioner</h2>
        <div className="transaction-list">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-info">
                <span className={`transaction-type ${transaction.type === 'KÖP' ? 'buy' : 'sell'}`}>
                  {transaction.type}
                </span>
                <span className="transaction-ticker">{transaction.ticker}</span>
                <span className="transaction-quantity">{transaction.quantity} st</span>
              </div>
              <div className="transaction-details">
                <span className="transaction-price">{formatCurrency(transaction.price)}/st</span>
                <span className="transaction-date">
                  {format(new Date(transaction.transaction_date), 'd MMM yyyy', { locale: sv })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
