const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/suggestions', require('./routes/suggestions'));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Movie Suggestor is running!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      test: '/test',
      suggestions: '/api/suggestions/:chatId',
      testSuggestions: '/api/suggestions'
    }
  });
});

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 Movie suggestion server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Test suggestions: http://localhost:${PORT}/api/suggestions`);
});