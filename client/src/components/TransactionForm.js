import React, { useState } from 'react';
import axios from 'axios';
import { Save, X } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

const TransactionForm = ({ onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    ticker: '',
    company_name: '',
    type: 'KÖP',
    quantity: '',
    price: '',
    currency: 'SEK',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker krävs';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Antal måste vara större än 0';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Pris måste vara större än 0';
    }
    
    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Datum krävs';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/transactions`, {
        ...formData,
        ticker: formData.ticker.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price)
      });
      
      setSuccessMessage('Transaktion tillagd!');
      
      // Reset form
      setFormData({
        ticker: '',
        company_name: '',
        type: 'KÖP',
        quantity: '',
        price: '',
        currency: 'SEK',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      
      // Notify parent component
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Fel vid tillägg av transaktion:', error);
      setErrors({ general: 'Ett fel uppstod vid tillägg av transaktion' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ticker: '',
      company_name: '',
      type: 'KÖP',
      quantity: '',
      price: '',
      currency: 'SEK',
      transaction_date: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setSuccessMessage('');
  };

  return (
    <div className="transaction-form-container">
      <div className="form-header">
        <h2>Lägg till ny transaktion</h2>
        <p>Registrera köp eller försäljning av aktier</p>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="error-message">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Transaktionstyp *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="KÖP">Köp</option>
              <option value="SÄLJ">Sälj</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ticker">Ticker *</label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="T.ex. AAPL, MSFT"
              className={`form-control ${errors.ticker ? 'error' : ''}`}
            />
            {errors.ticker && <span className="error-text">{errors.ticker}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="company_name">Företagsnamn</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="T.ex. Apple Inc."
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Antal aktier *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              className={`form-control ${errors.quantity ? 'error' : ''}`}
            />
            {errors.quantity && <span className="error-text">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Pris per aktie *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className={`form-control ${errors.price ? 'error' : ''}`}
            />
            {errors.price && <span className="error-text">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currency">Valuta</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="form-control"
            >
              <option value="SEK">SEK</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NOK">NOK</option>
              <option value="DKK">DKK</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="transaction_date">Transaktionsdatum *</label>
            <input
              type="date"
              id="transaction_date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              className={`form-control ${errors.transaction_date ? 'error' : ''}`}
            />
            {errors.transaction_date && <span className="error-text">{errors.transaction_date}</span>}
          </div>
        </div>

        <div className="form-summary">
          <div className="summary-item">
            <span>Total kostnad:</span>
            <strong>
              {formData.quantity && formData.price 
                ? new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: formData.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(formData.quantity * formData.price)
                : '-'
              }
            </strong>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={loading}
          >
            <X size={18} />
            Rensa
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Sparar...' : 'Spara transaktion'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
