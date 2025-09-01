import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import PortfolioChart from './components/PortfolioChart';
import AdvancedCharts from './components/AdvancedCharts';
import { TrendingUp, Plus, List, PieChart, BarChart3, LogOut, Layers } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

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
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
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
