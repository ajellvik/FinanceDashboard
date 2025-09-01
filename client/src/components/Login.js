import React, { useState } from 'react';
import axios from 'axios';
import { Lock, LogIn } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5001/api/login',
        { password },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Store token in localStorage as backup
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        onLoginSuccess();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Fel lösenord. Försök igen.');
      } else {
        setError('Ett fel uppstod. Försök igen senare.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Lock size={48} className="login-icon" />
          <h1>Min Investeringsportfölj</h1>
          <p>Ange lösenord för att fortsätta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord"
              className="login-input"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !password}
          >
            <LogIn size={20} />
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        <div className="login-footer">
          <p className="hint">💡 Tips: Lösenordet börjar med "Fika"</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
