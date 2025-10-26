# Plan Outings 2025 Backend

A comprehensive backend system for AI-powered group outing planning, featuring both place recommendations and movie suggestions.

## 🎯 Place Suggestion Service

A backend service that analyzes group chat conversations using Google's Gemini AI and fetches nearby places using Google Places API to provide personalized recommendations.

### Features

- 🤖 **AI-Powered Analysis**: Uses Gemini AI to analyze chat messages and extract preferences
- 📍 **Location-Based Search**: Integrates with Google Places API for accurate place data
- 🎯 **Personalized Recommendations**: Provides tailored suggestions based on group preferences
- 🛡️ **Rate Limiting & Security**: Built-in rate limiting and security middleware
- 📊 **Comprehensive API**: Multiple endpoints for different use cases

### Tech Stack

- **Node.js** with Express.js
- **Google Gemini AI** for chat analysis and recommendations
- **Google Places API** for place data
- **Joi** for request validation
- **Helmet** for security
- **CORS** for cross-origin requests

## 🎬 Movie Suggestion System

### [MoviesReccomBot Documentation](https://github.com/ADITYAPIMPALE11127/plan-outings-2025-backend/blob/main/MoviesReccomBot/MovieReccomSys.md)

AI-powered movie suggestions based on group chat conversations.

**Live API**: https://moviesreccombot.onrender.com

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```env
# Google Places API Key
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Get API Keys

#### Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Places API
4. Create credentials (API Key)
5. Restrict the key to Places API for security

#### Gemini AI API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### 4. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and service health.

### Get AI-Powered Recommendations
```
POST /api/recommendations
```

Analyzes chat messages and returns personalized place recommendations.

**Request Body:**
```json
{
  "messages": [
    {
      "sender": "Alice",
      "content": "I'm craving Italian food!",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "sender": "Bob", 
      "content": "Me too! Something fancy but not too expensive",
      "timestamp": "2024-01-15T10:31:00Z"
    }
  ],
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York"
  },
  "radius": 5000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "interests": ["Italian food", "fancy dining"],
      "placeTypes": ["restaurant"],
      "preferences": {
        "budget": "medium",
        "atmosphere": "fancy",
        "cuisine": ["Italian"]
      }
    },
    "recommendations": {
      "searchStrategies": [...],
      "keywords": ["Italian", "fancy", "restaurant"]
    },
    "places": [
      {
        "place_id": "ChIJ...",
        "name": "Bella Vista Restaurant",
        "rating": 4.5,
        "personalizedDescription": "Perfect for your Italian craving with elegant atmosphere",
        "matchScore": 0.95,
        "highlights": ["Authentic Italian", "Elegant ambiance"]
      }
    ],
    "activities": [...],
    "metadata": {
      "totalPlaces": 15,
      "searchRadius": 5000
    }
  }
}
```

### Search Places by Location
```
POST /api/places/search
```

Direct search for places near a location.

**Request Body:**
```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "radius": 5000,
  "type": "restaurant",
  "keyword": "Italian",
  "maxResults": 20
}
```

### Get Place Details
```
GET /api/places/:placeId
```

Get detailed information about a specific place.

### Search Places by Text
```
POST /api/places/text-search
```

Search for places using text queries.

**Request Body:**
```json
{
  "query": "best Italian restaurants in Manhattan",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "radius": 10000
}
```

## Usage Examples

### Basic Integration

```javascript
// Frontend integration example
const getRecommendations = async (messages, location) => {
  const response = await fetch('http://localhost:3001/api/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      location,
      radius: 5000
    })
  });
  
  const data = await response.json();
  return data.data.places;
};
```

### Error Handling

The API returns structured error responses:

```json
{
  "error": "Validation error",
  "details": ["latitude must be a number"]
}
```

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Configurable** via environment variables
- **Headers**: Rate limit info included in response headers

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Joi schema validation
- **Rate Limiting**: Prevents abuse
- **Error Handling**: Secure error messages

## Development

### Project Structure

```
plan-outings-2025-backend/
├── MoviesReccomBot/              # Movie recommendation system
│   ├── app.js                    # Main movie service
│   ├── routes/suggestions.js     # Movie suggestion routes
│   ├── services/                 # Movie service modules
│   └── MovieReccomSys.md        # Movie system documentation
├── places.js                     # Google Places API service
├── recommendation_places.js     # Gemini AI recommendation service
├── index.js                      # Main server file
├── package.json                  # Dependencies and scripts
├── env.example                   # Environment variables template
└── README.md                     # This file
```

### Adding New Features

1. **New API Endpoints**: Add routes in `index.js`
2. **New Place Types**: Extend `PlacesService` class
3. **New Analysis Types**: Extend `RecommendationService` class
4. **Validation**: Add Joi schemas for new endpoints

### Testing

```bash
# Run tests (when implemented)
npm test
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API keys are valid and have proper permissions
2. **Rate Limiting**: Check if you've hit API rate limits
3. **CORS Issues**: Configure CORS_ORIGIN in your environment
4. **Memory Issues**: Large chat histories may cause memory issues

### Debug Mode

Set `NODE_ENV=development` for detailed error logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
