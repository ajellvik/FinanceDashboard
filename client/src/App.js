import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import PortfolioChart from './components/PortfolioChart';
import { TrendingUp, Plus, List, PieChart, BarChart3 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

function App() {
  const [activeTab, setActiveTab] = useState('översikt');
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchPrices, 30000); // Uppdatera priser var 30:e sekund
    return () => clearInterval(interval);
  }, []);

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
          </nav>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading">Laddar portföljdata...</div>
        ) : (
          <>
            {activeTab === 'översikt' && (
              <Dashboard 
                holdings={holdings} 
                transactions={transactions}
                prices={prices}
              />
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;
