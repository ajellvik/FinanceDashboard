// API Configuration
const config = {
  // Use relative URLs in production (Vercel), localhost for development
  API_URL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api'),
  
  // Set to true when running with a backend server
  // Set to false for demo mode (limited functionality)
  HAS_BACKEND: process.env.REACT_APP_HAS_BACKEND !== 'false'
};

export default config;
