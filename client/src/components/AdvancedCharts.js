import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, ComposedChart
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, Activity, Zap, Target } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const AdvancedCharts = ({ holdings, transactions, prices, historicalData }) => {
  const [selectedChart, setSelectedChart] = useState('performance');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState('SPX');

  // Generate Monte Carlo simulation data
  const generateMonteCarloData = () => {
    const simulations = 1000;
    const years = 10;
    const results = [];
    
    for (let sim = 0; sim < simulations; sim++) {
      let value = 100000; // Starting value
      const path = [{ year: 0, value }];
      
      for (let year = 1; year <= years; year++) {
        // Random annual return between -20% and +30%
        const annualReturn = (Math.random() - 0.3) * 0.5;
        value = value * (1 + annualReturn);
        path.push({ year, value });
      }
      
      results.push(path);
    }
    
    // Calculate percentiles
    const percentiles = [];
    for (let year = 0; year <= years; year++) {
      const values = results.map(sim => sim[year].value).sort((a, b) => a - b);
      percentiles.push({
        year,
        p10: values[Math.floor(simulations * 0.1)],
        p25: values[Math.floor(simulations * 0.25)],
        p50: values[Math.floor(simulations * 0.5)],
        p75: values[Math.floor(simulations * 0.75)],
        p90: values[Math.floor(simulations * 0.9)],
      });
    }
    
    return percentiles;
  };

  // Generate correlation matrix data
  const generateCorrelationData = () => {
    const assets = holdings.map(h => h.ticker);
    const matrix = [];
    
    assets.forEach((asset1, i) => {
      assets.forEach((asset2, j) => {
        // Generate realistic correlation values
        let correlation;
        if (i === j) {
          correlation = 1;
        } else {
          correlation = Math.random() * 0.8 - 0.2; // Between -0.2 and 0.6
        }
        
        matrix.push({
          x: asset1,
          y: asset2,
          value: correlation
        });
      });
    });
    
    return matrix;
  };

  // Generate risk-return scatter data
  const generateRiskReturnData = () => {
    return holdings.map(holding => {
      const expectedReturn = 5 + Math.random() * 20; // 5-25% return
      const volatility = 10 + Math.random() * 30; // 10-40% volatility
      const value = holding.quantity * (prices[holding.ticker]?.current || holding.average_price);
      
      return {
        ticker: holding.ticker,
        return: expectedReturn,
        risk: volatility,
        value: value,
        sharpe: expectedReturn / volatility
      };
    });
  };

  // Generate candlestick data
  const generateCandlestickData = () => {
    const data = [];
    let basePrice = 100;
    
    for (let i = 0; i < 30; i++) {
      const open = basePrice;
      const close = basePrice + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      data.push({
        date: `Day ${i + 1}`,
        open,
        close,
        high,
        low,
        volume: Math.floor(Math.random() * 1000000)
      });
      
      basePrice = close;
    }
    
    return data;
  };

  // Generate drawdown data
  const generateDrawdownData = () => {
    const data = [];
    let peak = 100;
    let current = 100;
    
    for (let i = 0; i < 365; i++) {
      current = current * (1 + (Math.random() - 0.48) * 0.02);
      if (current > peak) peak = current;
      
      const drawdown = ((peak - current) / peak) * 100;
      
      data.push({
        day: i,
        value: current,
        drawdown: -drawdown
      });
    }
    
    return data;
  };

  // Custom tooltip for various charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'performance':
        const performanceData = generateDrawdownData();
        return (
          <div className="chart-container">
            <h3>Portföljutveckling & Drawdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0088FE" 
                  fill="#0088FE"
                  fillOpacity={0.3}
                  name="Portföljvärde"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="drawdown" 
                  fill="#FF8042"
                  name="Drawdown %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'montecarlo':
        const monteCarloData = generateMonteCarloData();
        return (
          <div className="chart-container">
            <h3>Monte Carlo Simulering (10 år)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monteCarloData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'År', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="p90" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.2} name="90:e percentilen" />
                <Area type="monotone" dataKey="p75" stackId="2" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} name="75:e percentilen" />
                <Area type="monotone" dataKey="p50" stackId="3" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.4} name="Median" />
                <Area type="monotone" dataKey="p25" stackId="4" stroke="#FF8042" fill="#FF8042" fillOpacity={0.3} name="25:e percentilen" />
                <Area type="monotone" dataKey="p10" stackId="5" stroke="#8884D8" fill="#8884D8" fillOpacity={0.2} name="10:e percentilen" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'riskreturn':
        const riskReturnData = generateRiskReturnData();
        return (
          <div className="chart-container">
            <h3>Risk vs Avkastning</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="risk" 
                  name="Risk" 
                  unit="%" 
                  label={{ value: 'Volatilitet (%)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="return" 
                  name="Avkastning" 
                  unit="%" 
                  label={{ value: 'Förväntad Avkastning (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter 
                  name="Tillgångar" 
                  data={riskReturnData} 
                  fill="#0088FE"
                >
                  {riskReturnData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );

      case 'correlation':
        const correlationData = generateCorrelationData();
        return (
          <div className="chart-container">
            <h3>Korrelationsmatris</h3>
            <div className="correlation-matrix">
              {holdings.map((h1, i) => (
                <div key={i} className="correlation-row">
                  <div className="correlation-label">{h1.ticker}</div>
                  {holdings.map((h2, j) => {
                    const correlation = correlationData.find(
                      d => d.x === h1.ticker && d.y === h2.ticker
                    )?.value || 0;
                    const color = correlation > 0 
                      ? `rgba(0, 196, 159, ${Math.abs(correlation)})` 
                      : `rgba(255, 128, 66, ${Math.abs(correlation)})`;
                    return (
                      <div 
                        key={j} 
                        className="correlation-cell"
                        style={{ backgroundColor: color }}
                        title={`${h1.ticker} vs ${h2.ticker}: ${correlation.toFixed(2)}`}
                      >
                        {correlation.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );

      case 'candlestick':
        const candlestickData = generateCandlestickData();
        return (
          <div className="chart-container">
            <h3>Prisrörelse (Candlestick)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={candlestickData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="price" />
                <YAxis yAxisId="volume" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="volume" dataKey="volume" fill="#8884d8" opacity={0.3} />
                {candlestickData.map((item, index) => {
                  const isGreen = item.close >= item.open;
                  return (
                    <rect
                      key={index}
                      x={index * 20}
                      y={Math.min(item.open, item.close)}
                      width={10}
                      height={Math.abs(item.close - item.open)}
                      fill={isGreen ? '#00C49F' : '#FF8042'}
                    />
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'treemap':
        const treemapData = holdings.map(h => ({
          name: h.ticker,
          size: h.quantity * (prices[h.ticker]?.current || h.average_price),
          change: prices[h.ticker]?.changePercent || 0
        }));
        return (
          <div className="chart-container">
            <h3>Portföljvikt (Treemap)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={treemapData}
                dataKey="size"
                ratio={4/3}
                stroke="#fff"
                fill="#0088FE"
              >
                {treemapData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.change >= 0 ? '#00C49F' : '#FF8042'} 
                  />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="advanced-charts">
      <div className="chart-selector">
        <button 
          className={selectedChart === 'performance' ? 'active' : ''}
          onClick={() => setSelectedChart('performance')}
        >
          <TrendingUp size={18} />
          Utveckling & Drawdown
        </button>
        <button 
          className={selectedChart === 'montecarlo' ? 'active' : ''}
          onClick={() => setSelectedChart('montecarlo')}
        >
          <Zap size={18} />
          Monte Carlo
        </button>
        <button 
          className={selectedChart === 'riskreturn' ? 'active' : ''}
          onClick={() => setSelectedChart('riskreturn')}
        >
          <Activity size={18} />
          Risk vs Avkastning
        </button>
        <button 
          className={selectedChart === 'correlation' ? 'active' : ''}
          onClick={() => setSelectedChart('correlation')}
        >
          <BarChart3 size={18} />
          Korrelation
        </button>
        <button 
          className={selectedChart === 'candlestick' ? 'active' : ''}
          onClick={() => setSelectedChart('candlestick')}
        >
          <Calendar size={18} />
          Candlestick
        </button>
        <button 
          className={selectedChart === 'treemap' ? 'active' : ''}
          onClick={() => setSelectedChart('treemap')}
        >
          <Target size={18} />
          Treemap
        </button>
      </div>

      {renderChart()}

      {/* Advanced Metrics Summary */}
      <div className="advanced-metrics-summary">
        <div className="metric-group">
          <h4>Risk-Justerade Mått</h4>
          <div className="metric-row">
            <span>Sortino Ratio:</span>
            <strong>1.45</strong>
          </div>
          <div className="metric-row">
            <span>Treynor Ratio:</span>
            <strong>0.12</strong>
          </div>
          <div className="metric-row">
            <span>Information Ratio:</span>
            <strong>0.89</strong>
          </div>
        </div>

        <div className="metric-group">
          <h4>Volatilitetsmått</h4>
          <div className="metric-row">
            <span>Årlig Volatilitet:</span>
            <strong>18.5%</strong>
          </div>
          <div className="metric-row">
            <span>Skewness:</span>
            <strong>-0.23</strong>
          </div>
          <div className="metric-row">
            <span>Kurtosis:</span>
            <strong>3.12</strong>
          </div>
        </div>

        <div className="metric-group">
          <h4>Performance Attribution</h4>
          <div className="metric-row">
            <span>Asset Selection:</span>
            <strong className="positive">+3.2%</strong>
          </div>
          <div className="metric-row">
            <span>Timing:</span>
            <strong className="negative">-1.1%</strong>
          </div>
          <div className="metric-row">
            <span>Currency Effect:</span>
            <strong className="positive">+0.8%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCharts;
