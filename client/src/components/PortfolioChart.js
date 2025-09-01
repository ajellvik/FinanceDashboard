import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import axios from 'axios';
import { Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { format, subMonths, subDays, startOfYear } from 'date-fns';
import { sv } from 'date-fns/locale';

const API_URL = 'http://localhost:5001/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const PortfolioChart = ({ holdings, transactions, prices }) => {
  const [chartType, setChartType] = useState('allocation');
  const [period, setPeriod] = useState('1M');
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (chartType === 'performance') {
      fetchPerformanceData();
    }
  }, [chartType, period]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Simulera historisk data baserat på transaktioner
      const endDate = new Date();
      let startDate = new Date();
      
      switch(period) {
        case '1W':
          startDate = subDays(endDate, 7);
          break;
        case '1M':
          startDate = subMonths(endDate, 1);
          break;
        case '3M':
          startDate = subMonths(endDate, 3);
          break;
        case '6M':
          startDate = subMonths(endDate, 6);
          break;
        case '1Y':
          startDate = subMonths(endDate, 12);
          break;
        case 'YTD':
          startDate = startOfYear(endDate);
          break;
        default:
          startDate = subMonths(endDate, 1);
      }

      // Generera datapunkter
      const data = [];
      const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      let baseValue = holdings.reduce((sum, h) => sum + (h.quantity * h.average_price), 0);
      
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Simulera värdeförändring
        const change = (Math.random() - 0.48) * 0.02; // -2% till +2% per dag
        baseValue = baseValue * (1 + change);
        
        data.push({
          date: format(date, 'd MMM', { locale: sv }),
          värde: Math.round(baseValue),
          förändring: Math.round(baseValue * change)
        });
      }
      
      setPerformanceData(data);
    } catch (error) {
      console.error('Fel vid hämtning av prestandadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Beräkna data för allokeringsdiagram
  const getAllocationData = () => {
    return holdings.map((holding, index) => {
      const currentPrice = prices[holding.ticker]?.current || holding.average_price;
      const value = holding.quantity * currentPrice;
      const totalValue = holdings.reduce((sum, h) => {
        const price = prices[h.ticker]?.current || h.average_price;
        return sum + (h.quantity * price);
      }, 0);
      
      return {
        name: holding.ticker,
        företag: holding.company_name || holding.ticker,
        värde: value,
        procent: ((value / totalValue) * 100).toFixed(1)
      };
    });
  };

  // Beräkna månadsvis prestation
  const getMonthlyPerformance = () => {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const month = format(new Date(transaction.transaction_date), 'MMM yyyy', { locale: sv });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { köp: 0, sälj: 0, netto: 0 };
      }
      
      const amount = transaction.quantity * transaction.price;
      
      if (transaction.type === 'KÖP') {
        monthlyData[month].köp += amount;
      } else {
        monthlyData[month].sälj += amount;
      }
      
      monthlyData[month].netto = monthlyData[month].sälj - monthlyData[month].köp;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      månad: month,
      ...data
    })).slice(-6); // Visa senaste 6 månaderna
  };

  // Beräkna sektorallokering (simulerad)
  const getSectorAllocation = () => {
    const sectors = {
      'Teknologi': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'],
      'Finans': ['JPM', 'BAC', 'GS', 'WFC', 'MS'],
      'Hälsovård': ['JNJ', 'PFE', 'UNH', 'CVS', 'ABBV'],
      'Konsument': ['AMZN', 'TSLA', 'WMT', 'HD', 'NKE'],
      'Industri': ['BA', 'CAT', 'GE', 'MMM', 'UPS'],
      'Övrigt': []
    };
    
    const sectorData = {};
    let totalValue = 0;
    
    holdings.forEach(holding => {
      const currentPrice = prices[holding.ticker]?.current || holding.average_price;
      const value = holding.quantity * currentPrice;
      totalValue += value;
      
      let sector = 'Övrigt';
      for (const [sectorName, tickers] of Object.entries(sectors)) {
        if (tickers.includes(holding.ticker)) {
          sector = sectorName;
          break;
        }
      }
      
      if (!sectorData[sector]) {
        sectorData[sector] = 0;
      }
      sectorData[sector] += value;
    });
    
    return Object.entries(sectorData).map(([sektor, värde]) => ({
      sektor,
      värde,
      procent: ((värde / totalValue) * 100).toFixed(1)
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'allocation':
        const allocationData = getAllocationData();
        return (
          <div className="chart-container">
            <h3>Portföljallokering</h3>
            <div className="chart-grid">
              <ResponsiveContainer width="50%" height={400}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name} (${entry.procent}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="värde"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="allocation-table">
                <table>
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Företag</th>
                      <th>Värde</th>
                      <th>Andel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <span className="color-indicator" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          {item.name}
                        </td>
                        <td>{item.företag}</td>
                        <td>{formatCurrency(item.värde)}</td>
                        <td>{item.procent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      
      case 'performance':
        return (
          <div className="chart-container">
            <h3>Portföljutveckling</h3>
            <div className="period-selector">
              {['1W', '1M', '3M', '6M', '1Y', 'YTD'].map(p => (
                <button
                  key={p}
                  className={period === p ? 'active' : ''}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="loading">Laddar data...</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="värde" 
                    stroke="#0088FE" 
                    fill="#0088FE" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      
      case 'monthly':
        const monthlyData = getMonthlyPerformance();
        return (
          <div className="chart-container">
            <h3>Månadsvis aktivitet</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="månad" />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="köp" fill="#FF8042" name="Köp" />
                <Bar dataKey="sälj" fill="#00C49F" name="Sälj" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'sector':
        const sectorData = getSectorAllocation();
        return (
          <div className="chart-container">
            <h3>Sektorfördelning</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectorData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${value / 1000}k`} />
                <YAxis dataKey="sektor" type="category" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="värde" fill="#8884d8">
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="portfolio-chart">
      <div className="chart-header">
        <h2>Portföljanalys</h2>
        <div className="chart-tabs">
          <button
            className={chartType === 'allocation' ? 'active' : ''}
            onClick={() => setChartType('allocation')}
          >
            <PieChartIcon size={18} />
            Allokering
          </button>
          <button
            className={chartType === 'performance' ? 'active' : ''}
            onClick={() => setChartType('performance')}
          >
            <TrendingUp size={18} />
            Utveckling
          </button>
          <button
            className={chartType === 'monthly' ? 'active' : ''}
            onClick={() => setChartType('monthly')}
          >
            <BarChart3 size={18} />
            Månadsvis
          </button>
          <button
            className={chartType === 'sector' ? 'active' : ''}
            onClick={() => setChartType('sector')}
          >
            <Calendar size={18} />
            Sektorer
          </button>
        </div>
      </div>
      
      {renderChart()}
    </div>
  );
};

export default PortfolioChart;
