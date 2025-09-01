// API Configuration
const config = {
  // For GitHub Pages deployment - users need to run their own backend
  // Update this to your backend URL when running locally or on your own server
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  
  // Set to true when running with a backend server
  // Set to false for demo mode (limited functionality)
  HAS_BACKEND: process.env.REACT_APP_HAS_BACKEND !== 'false'
};

export default config;
