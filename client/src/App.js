import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import config from './config';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import PortfolioChart from './components/PortfolioChart';
import AdvancedCharts from './components/AdvancedCharts';
import { TrendingUp, Plus, List, PieChart, BarChart3, LogOut, Layers } from 'lucide-react';

const API_URL = config.API_URL;

// Configure axios defaults
axios.defaults.withCredentials = true;

// Add request interceptor to include token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('översikt');
  const [useEnhancedDashboard, setUseEnhancedDashboard] = useState(false);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(() => fetchPrices(), 30000); // Uppdatera priser var 30:e sekund
      // Save portfolio history once a day
      savePortfolioHistory();
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    // Check for demo mode first
    if (localStorage.getItem('demoMode') === 'true') {
      setIsDemoMode(true);
      setIsAuthenticated(true);
      setCheckingAuth(false);
      loadDemoData();
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/status`);
      if (response.data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    if (localStorage.getItem('demoMode') === 'true') {
      setIsDemoMode(true);
      loadDemoData();
    }
    setIsAuthenticated(true);
  };

  const loadDemoData = () => {
    // Mock holdings data
    const mockHoldings = [
      { id: 1, ticker: 'AAPL', name: 'Apple Inc.', quantity: 50, average_price: 150 },
      { id: 2, ticker: 'MSFT', name: 'Microsoft Corp.', quantity: 30, average_price: 280 },
      { id: 3, ticker: 'GOOGL', name: 'Alphabet Inc.', quantity: 20, average_price: 2200 },
      { id: 4, ticker: 'AMZN', name: 'Amazon.com Inc.', quantity: 25, average_price: 3100 },
      { id: 5, ticker: 'TSLA', name: 'Tesla Inc.', quantity: 15, average_price: 650 }
    ];

    // Mock transactions data
    const mockTransactions = [
      { id: 1, ticker: 'AAPL', type: 'buy', quantity: 50, price: 150, date: '2024-01-15', total: 7500 },
      { id: 2, ticker: 'MSFT', type: 'buy', quantity: 30, price: 280, date: '2024-02-20', total: 8400 },
      { id: 3, ticker: 'GOOGL', type: 'buy', quantity: 20, price: 2200, date: '2024-03-10', total: 44000 },
      { id: 4, ticker: 'AMZN', type: 'buy', quantity: 25, price: 3100, date: '2024-04-05', total: 77500 },
      { id: 5, ticker: 'TSLA', type: 'buy', quantity: 15, price: 650, date: '2024-05-12', total: 9750 }
    ];

    // Mock prices data
    const mockPrices = {
      'AAPL': { price: 175, change: 2.5, changePercent: 1.45, current: 175 },
      'MSFT': { price: 320, change: 5.2, changePercent: 1.65, current: 320 },
      'GOOGL': { price: 2450, change: 25, changePercent: 1.03, current: 2450 },
      'AMZN': { price: 3350, change: -15, changePercent: -0.45, current: 3350 },
      'TSLA': { price: 720, change: 12, changePercent: 1.69, current: 720 }
    };

    setHoldings(mockHoldings);
    setTransactions(mockTransactions);
    setPrices(mockPrices);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      if (!isDemoMode) {
        await axios.post(`${API_URL}/logout`);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('demoMode');
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setHoldings([]);
      setTransactions([]);
      setPrices({});
    } catch (error) {
      console.error('Fel vid utloggning:', error);
    }
  };

  const savePortfolioHistory = async () => {
    try {
      await axios.post(`${API_URL}/portfolio-history/save`);
      console.log('Portfolio historik sparad');
    } catch (error) {
      console.error('Fel vid sparande av portfolio historik:', error);
    }
  };

  const fetchData = async () => {
    if (isDemoMode) {
      loadDemoData();
      return;
    }

    try {
      const [holdingsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/holdings`),
        axios.get(`${API_URL}/transactions`)
      ]);
      setHoldings(holdingsRes.data);
      setTransactions(transactionsRes.data);
      
      if (holdingsRes.data.length > 0) {
        await fetchPrices(holdingsRes.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Fel vid hämtning av data:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }
  };

  const fetchPrices = async (holdingsData = holdings) => {
    if (holdingsData.length === 0) return;
    
    try {
      const tickers = holdingsData.map(h => h.ticker).join(',');
      const response = await axios.get(`${API_URL}/prices/${tickers}`);
      setPrices(response.data);
    } catch (error) {
      console.error('Fel vid hämtning av priser:', error);
    }
  };

  const handleTransactionAdded = () => {
    fetchData();
  };

  const handleTransactionDeleted = async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Fel vid borttagning av transaktion:', error);
    }
  };

  if (checkingAuth) {
    return (
      <div className="App">
        <div className="loading">Kontrollerar autentisering...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <TrendingUp size={32} />
            <h1>Min Investeringsportfölj</h1>
          </div>
          <nav className="nav-tabs">
            <button 
              className={activeTab === 'översikt' ? 'active' : ''}
              onClick={() => setActiveTab('översikt')}
            >
              <PieChart size={18} />
              Översikt
            </button>
            <button 
              className={activeTab === 'transaktioner' ? 'active' : ''}
              onClick={() => setActiveTab('transaktioner')}
            >
              <List size={18} />
              Transaktioner
            </button>
            <button 
              className={activeTab === 'ny-transaktion' ? 'active' : ''}
              onClick={() => setActiveTab('ny-transaktion')}
            >
              <Plus size={18} />
              Ny Transaktion
            </button>
            <button 
              className={activeTab === 'diagram' ? 'active' : ''}
              onClick={() => setActiveTab('diagram')}
            >
            <BarChart3 size={18} />
            Diagram
          </button>
          <button 
            className={activeTab === 'avancerad' ? 'active' : ''}
            onClick={() => setActiveTab('avancerad')}
          >
            <Layers size={18} />
            Avancerad
          </button>
          </nav>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logga ut"
          >
            <LogOut size={18} />
            Logga ut
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Laddar portföljdata...</div>
        ) : (
          <>
            {activeTab === 'översikt' && (
              <>
                <div className="dashboard-toggle">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={useEnhancedDashboard}
                      onChange={(e) => setUseEnhancedDashboard(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">
                      {useEnhancedDashboard ? 'Avancerad vy' : 'Standard vy'}
                    </span>
                  </label>
                </div>
                {useEnhancedDashboard ? (
                  <EnhancedDashboard 
                    holdings={holdings} 
                    transactions={transactions}
                    prices={prices}
                  />
                ) : (
                  <Dashboard 
                    holdings={holdings} 
                    transactions={transactions}
                    prices={prices}
                  />
                )}
              </>
            )}
            {activeTab === 'transaktioner' && (
              <TransactionList 
                transactions={transactions}
                onDelete={handleTransactionDeleted}
              />
            )}
            {activeTab === 'ny-transaktion' && (
              <TransactionForm onTransactionAdded={handleTransactionAdded} />
            )}
            {activeTab === 'diagram' && (
              <PortfolioChart 
                holdings={holdings}
                transactions={transactions}
                prices={prices}
              />
            )}
            {activeTab === 'avancerad' && (
              <AdvancedCharts 
                holdings={holdings}
                transactions={transactions}
                prices={prices}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
