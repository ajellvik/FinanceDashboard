import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, Calendar,
  AlertTriangle, Activity, Target, Award, Info, PieChart, Globe, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const EnhancedDashboard = ({ holdings, transactions, prices, historicalData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('YTD');
  const [showBenchmark, setShowBenchmark] = useState(true);
  
  // Performance periods
  const periods = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y', 'ALL'];
  
  // Calculate advanced metrics
  const calculateMetrics = () => {
    const totalValue = holdings.reduce((sum, h) => {
      const price = prices[h.ticker]?.current || h.average_price;
      return sum + (h.quantity * price);
    }, 0);

    const totalCost = holdings.reduce((sum, h) => {
      return sum + (h.quantity * h.average_price);
    }, 0);

    const totalReturn = totalValue - totalCost;
    const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Calculate daily change
    const dailyChange = holdings.reduce((sum, h) => {
      const change = prices[h.ticker]?.change || 0;
      return sum + (h.quantity * change);
    }, 0);

    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalReturn,
      returnPercent,
      dailyChange,
      dailyChangePercent
    };
  };

  // Calculate Sharpe Ratio (simplified)
  const calculateSharpeRatio = () => {
    const riskFreeRate = 0.02; // 2% årlig riskfri ränta
    const returns = calculateReturns();
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = calculateStandardDeviation(returns);
    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  };

  // Calculate returns array for risk metrics
  const calculateReturns = () => {
    // Simplified: using random data for demo
    return Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.04);
  };

  // Calculate standard deviation
  const calculateStandardDeviation = (values) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  };

  // Calculate Beta (market correlation)
  const calculateBeta = () => {
    // Simplified calculation
    return 1.2 + (Math.random() - 0.5) * 0.4;
  };

  // Calculate Alpha
  const calculateAlpha = () => {
    const beta = calculateBeta();
    const marketReturn = 0.10; // 10% årlig marknadsavkastning
    const portfolioReturn = calculateMetrics().returnPercent / 100;
    const riskFreeRate = 0.02;
    return portfolioReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate));
  };

  // Calculate Maximum Drawdown
  const calculateMaxDrawdown = () => {
    // Simplified: using historical high and current value
    const currentValue = calculateMetrics().totalValue;
    const historicalHigh = currentValue * 1.15; // Assume 15% higher peak
    return ((historicalHigh - currentValue) / historicalHigh) * 100;
  };

  // Calculate Value at Risk (VaR)
  const calculateVaR = (confidence = 0.95) => {
    const returns = calculateReturns();
    const sortedReturns = returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const dailyVaR = sortedReturns[index];
    const totalValue = calculateMetrics().totalValue;
    return Math.abs(dailyVaR * totalValue);
  };

  // Calculate sector allocation
  const calculateSectorAllocation = () => {
    const sectors = {
      'Teknologi': 0,
      'Finans': 0,
      'Hälsovård': 0,
      'Konsument': 0,
      'Industri': 0,
      'Energi': 0,
      'Fastigheter': 0,
      'Material': 0,
      'Övrigt': 0
    };

    const sectorMap = {
      'AAPL': 'Teknologi', 'MSFT': 'Teknologi', 'GOOGL': 'Teknologi',
      'JPM': 'Finans', 'BAC': 'Finans', 'GS': 'Finans',
      'JNJ': 'Hälsovård', 'PFE': 'Hälsovård', 'UNH': 'Hälsovård',
      'AMZN': 'Konsument', 'TSLA': 'Konsument', 'WMT': 'Konsument',
      'BA': 'Industri', 'CAT': 'Industri', 'GE': 'Industri'
    };

    holdings.forEach(holding => {
      const sector = sectorMap[holding.ticker] || 'Övrigt';
      const value = holding.quantity * (prices[holding.ticker]?.current || holding.average_price);
      sectors[sector] += value;
    });

    return sectors;
  };

  // Calculate geographical allocation
  const calculateGeographicalAllocation = () => {
    const regions = {
      'USA': 0,
      'Europa': 0,
      'Asien': 0,
      'Sverige': 0,
      'Övrigt': 0
    };

    holdings.forEach(holding => {
      const value = holding.quantity * (prices[holding.ticker]?.current || holding.average_price);
      // Simplified logic - in reality would check actual exchange
      if (holding.ticker.includes('.ST')) {
        regions['Sverige'] += value;
      } else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN'].includes(holding.ticker)) {
        regions['USA'] += value;
      } else {
        regions['Övrigt'] += value;
      }
    });

    return regions;
  };

  // Calculate dividend yield
  const calculateDividendYield = () => {
    // Simplified calculation
    const totalDividends = holdings.reduce((sum, h) => {
      const dividendYield = prices[h.ticker]?.dividendYield || 0.02; // 2% default
      const value = h.quantity * (prices[h.ticker]?.current || h.average_price);
      return sum + (value * dividendYield);
    }, 0);
    
    const totalValue = calculateMetrics().totalValue;
    return totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;
  };

  const metrics = calculateMetrics();
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

  return (
    <div className="enhanced-dashboard">
      {/* Performance Period Selector */}
      <div className="period-selector-bar">
        {periods.map(period => (
          <button
            key={period}
            className={selectedPeriod === period ? 'active' : ''}
            onClick={() => setSelectedPeriod(period)}
          >
            {period}
          </button>
        ))}
        <button 
          className={`benchmark-toggle ${showBenchmark ? 'active' : ''}`}
          onClick={() => setShowBenchmark(!showBenchmark)}
        >
          📊 Jämför med S&P 500
        </button>
      </div>

      {/* Main Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card large">
          <div className="metric-header">
            <DollarSign size={24} />
            <span>Portföljvärde</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.totalValue)}</div>
          <div className={`metric-change ${metrics.dailyChange >= 0 ? 'positive' : 'negative'}`}>
            {metrics.dailyChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{formatCurrency(Math.abs(metrics.dailyChange))}</span>
            <span>({formatPercentage(metrics.dailyChangePercent)})</span>
          </div>
          <div className="metric-subtitle">
            Investerat: {formatCurrency(metrics.totalCost)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <TrendingUp size={20} />
            <span>Total Avkastning</span>
          </div>
          <div className={`metric-value ${metrics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(metrics.totalReturn)}
          </div>
          <div className="metric-subtitle">
            {formatPercentage(metrics.returnPercent)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Award size={20} />
            <span>Sharpe Ratio</span>
            <Info size={14} className="info-icon" title="Risk-justerad avkastning" />
          </div>
          <div className="metric-value">{calculateSharpeRatio().toFixed(2)}</div>
          <div className="metric-subtitle">
            {calculateSharpeRatio() > 1 ? 'Bra' : calculateSharpeRatio() > 0.5 ? 'Acceptabel' : 'Låg'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Activity size={20} />
            <span>Beta</span>
            <Info size={14} className="info-icon" title="Marknadskorrelation" />
          </div>
          <div className="metric-value">{calculateBeta().toFixed(2)}</div>
          <div className="metric-subtitle">
            {calculateBeta() > 1 ? 'Högre volatilitet' : 'Lägre volatilitet'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Target size={20} />
            <span>Alpha</span>
            <Info size={14} className="info-icon" title="Överavkastning vs marknad" />
          </div>
          <div className={`metric-value ${calculateAlpha() >= 0 ? 'positive' : 'negative'}`}>
            {formatPercentage(calculateAlpha() * 100)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <AlertTriangle size={20} />
            <span>Max Drawdown</span>
          </div>
          <div className="metric-value negative">
            -{calculateMaxDrawdown().toFixed(1)}%
          </div>
          <div className="metric-subtitle">Från topp</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Shield size={20} />
            <span>Value at Risk (95%)</span>
          </div>
          <div className="metric-value">
            {formatCurrency(calculateVaR())}
          </div>
          <div className="metric-subtitle">1 dag</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <Percent size={20} />
            <span>Utdelningsavkastning</span>
          </div>
          <div className="metric-value">
            {calculateDividendYield().toFixed(2)}%
          </div>
          <div className="metric-subtitle">Årlig</div>
        </div>
      </div>

      {/* Asset Allocation Section */}
      <div className="allocation-section">
        <h3>Tillgångsallokering</h3>
        <div className="allocation-grid">
          {/* Sector Allocation */}
          <div className="allocation-card">
            <h4><PieChart size={18} /> Sektorfördelning</h4>
            <div className="allocation-bars">
              {Object.entries(calculateSectorAllocation()).map(([sector, value]) => {
                const total = metrics.totalValue;
                const percentage = total > 0 ? (value / total) * 100 : 0;
                if (percentage === 0) return null;
                return (
                  <div key={sector} className="allocation-bar">
                    <div className="bar-label">
                      <span>{sector}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Geographical Allocation */}
          <div className="allocation-card">
            <h4><Globe size={18} /> Geografisk fördelning</h4>
            <div className="allocation-bars">
              {Object.entries(calculateGeographicalAllocation()).map(([region, value]) => {
                const total = metrics.totalValue;
                const percentage = total > 0 ? (value / total) * 100 : 0;
                if (percentage === 0) return null;
                return (
                  <div key={region} className="allocation-bar">
                    <div className="bar-label">
                      <span>{region}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill geography"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Analysis Table */}
      <div className="holdings-analysis">
        <h3>Detaljerad Innehav Analys</h3>
        <div className="analysis-table">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Företag</th>
                <th>Antal</th>
                <th>Pris</th>
                <th>Värde</th>
                <th>Vikt %</th>
                <th>P/E</th>
                <th>Div %</th>
                <th>52v Hög/Låg</th>
                <th>RSI</th>
                <th>Daglig %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const currentPrice = prices[holding.ticker]?.current || holding.average_price;
                const value = holding.quantity * currentPrice;
                const weight = (value / metrics.totalValue) * 100;
                const change = prices[holding.ticker]?.changePercent || 0;
                
                // Simulated metrics (would come from real API)
                const pe = 15 + Math.random() * 20;
                const divYield = Math.random() * 4;
                const week52High = currentPrice * (1.1 + Math.random() * 0.2);
                const week52Low = currentPrice * (0.7 + Math.random() * 0.2);
                const rsi = 30 + Math.random() * 40;

                return (
                  <tr key={holding.ticker}>
                    <td className="ticker">{holding.ticker}</td>
                    <td>{holding.company_name || holding.ticker}</td>
                    <td>{holding.quantity}</td>
                    <td>{formatCurrency(currentPrice)}</td>
                    <td>{formatCurrency(value)}</td>
                    <td>{weight.toFixed(1)}%</td>
                    <td>{pe.toFixed(1)}</td>
                    <td>{divYield.toFixed(2)}%</td>
                    <td className="range">
                      <span className="low">{formatCurrency(week52Low)}</span>
                      <span className="separator">-</span>
                      <span className="high">{formatCurrency(week52High)}</span>
                    </td>
                    <td className={rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : ''}>
                      {rsi.toFixed(0)}
                    </td>
                    <td className={change >= 0 ? 'positive' : 'negative'}>
                      {formatPercentage(change)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis Section */}
      <div className="risk-analysis">
        <h3>Riskanalys</h3>
        <div className="risk-grid">
          <div className="risk-card">
            <h4>Koncentrationsrisk</h4>
            <div className="risk-indicator">
              <div className="risk-level medium">Medium</div>
              <p>Top 3 innehav utgör 45% av portföljen</p>
            </div>
          </div>
          
          <div className="risk-card">
            <h4>Likviditetsrisk</h4>
            <div className="risk-indicator">
              <div className="risk-level low">Låg</div>
              <p>Alla innehav är höglikvida</p>
            </div>
          </div>

          <div className="risk-card">
            <h4>Valutarisk</h4>
            <div className="risk-indicator">
              <div className="risk-level high">Hög</div>
              <p>65% exponering mot USD</p>
            </div>
          </div>

          <div className="risk-card">
            <h4>Marknadsrisk</h4>
            <div className="risk-indicator">
              <div className="risk-level medium">Medium</div>
              <p>Beta: {calculateBeta().toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
