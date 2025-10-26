const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
require('dotenv').config();

const PlacesService = require('./places');
const RecommendationService = require('./recommendation_places');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Initialize services
let placesService, recommendationService;

try {
  placesService = new PlacesService();
  recommendationService = new RecommendationService();
} catch (error) {
  console.error('Failed to initialize services:', error.message);
  process.exit(1);
}

// Validation schemas
const chatAnalysisSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      sender: Joi.string().required(),
      content: Joi.string().required(),
      timestamp: Joi.date().optional()
    })
  ).min(1).required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    city: Joi.string().optional()
  }).required(),
  radius: Joi.number().min(100).max(50000).default(5000)
});

const placeSearchSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  radius: Joi.number().min(100).max(50000).default(5000),
  type: Joi.string().optional(),
  keyword: Joi.string().optional(),
  maxResults: Joi.number().min(1).max(50).default(20)
});

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      places: 'active',
      recommendations: 'active'
    }
  });
});

/**
 * Analyze chat messages and get place recommendations
 * POST /api/recommendations
 */
app.post('/api/recommendations', async (req, res) => {
  try {
    // Validate request
    const { error, value } = chatAnalysisSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { messages, location, radius } = value;

    // Step 1: Analyze chat messages
    console.log('Analyzing chat messages...');
    const analysis = await recommendationService.analyzeChatMessages(
      messages, 
      location.city || 'Unknown location'
    );

    // Step 2: Generate recommendations based on analysis
    console.log('Generating recommendations...');
    const recommendations = await recommendationService.generateRecommendations(
      analysis, 
      location, 
      radius
    );

    // Step 3: Search for places using Google Places API
    console.log('Searching for places...');
    const searchResults = [];
    
    for (const strategy of recommendations.searchStrategies) {
      try {
        const places = await placesService.searchNearbyPlaces({
          latitude: location.latitude,
          longitude: location.longitude,
          radius: radius,
          type: strategy.value,
          keyword: recommendations.keywords.join(' '),
          maxResults: Math.floor(20 / recommendations.searchStrategies.length)
        });
        
        searchResults.push(...places);
      } catch (error) {
        console.error(`Error searching for ${strategy.value}:`, error.message);
      }
    }

    // Step 4: Personalize place descriptions
    console.log('Personalizing place descriptions...');
    const personalizedPlaces = await recommendationService.personalizePlaceDescriptions(
      searchResults, 
      analysis
    );

    // Step 5: Generate activity suggestions
    console.log('Generating activity suggestions...');
    const activities = await recommendationService.generateActivitySuggestions(
      analysis, 
      location.city || 'this location'
    );

    // Response
    res.json({
      success: true,
      data: {
        analysis,
        recommendations,
        places: personalizedPlaces,
        activities,
        metadata: {
          totalPlaces: personalizedPlaces.length,
          searchRadius: radius,
          location: location,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in recommendations endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Search for places directly
 * POST /api/places/search
 */
app.post('/api/places/search', async (req, res) => {
  try {
    // Validate request
    const { error, value } = placeSearchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const { location, radius, type, keyword, maxResults } = value;

    const places = await placesService.searchNearbyPlaces({
      latitude: location.latitude,
      longitude: location.longitude,
      radius,
      type,
      keyword,
      maxResults
    });

    res.json({
      success: true,
      data: {
        places,
        metadata: {
          totalResults: places.length,
          searchRadius: radius,
          location: location,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in places search endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get place details by ID
 * GET /api/places/:placeId
 */
app.get('/api/places/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        error: 'Place ID is required'
      });
    }

    const placeDetails = await placesService.getPlaceDetails(placeId);

    res.json({
      success: true,
      data: {
        place: placeDetails,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Search places by text query
 * POST /api/places/text-search
 */
app.post('/api/places/text-search', async (req, res) => {
  try {
    const { query, location, radius } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    const places = await placesService.searchPlacesByText(query, location, radius);

    res.json({
      success: true,
      data: {
        places,
        metadata: {
          query,
          totalResults: places.length,
          location: location,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in text search endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Place Suggestion Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API endpoints:`);
  console.log(`   POST /api/recommendations - Get AI-powered place recommendations`);
  console.log(`   POST /api/places/search - Search places by location`);
  console.log(`   GET  /api/places/:placeId - Get place details`);
  console.log(`   POST /api/places/text-search - Search places by text`);
});

module.exports = app;
