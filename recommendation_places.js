const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Recommendation Service
 * Uses Google's Gemini AI to analyze chat conversations and recommend places
 */
class RecommendationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Analyze chat messages to extract location preferences and interests
   * @param {Array} messages - Array of chat messages
   * @param {string} userLocation - User's current location (city, state)
   * @returns {Promise<Object>} Extracted preferences and interests
   */
  async analyzeChatMessages(messages, userLocation = '') {
    try {
      const chatText = messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const prompt = `
Analyze the following group chat conversation and extract information about:
1. Types of places they want to visit (restaurants, attractions, activities, etc.)
2. Preferences (budget, atmosphere, cuisine type, etc.)
3. Specific interests mentioned
4. Any constraints or requirements
5. Group size and demographics if mentioned

Chat conversation:
${chatText}

User location: ${userLocation}

Please respond with a JSON object containing:
{
  "interests": ["interest1", "interest2"],
  "placeTypes": ["restaurant", "tourist_attraction"],
  "preferences": {
    "budget": "low/medium/high",
    "atmosphere": "casual/formal/family-friendly",
    "cuisine": ["cuisine1", "cuisine2"],
    "activities": ["activity1", "activity2"]
  },
  "constraints": ["constraint1", "constraint2"],
  "groupInfo": {
    "size": "estimated group size",
    "demographics": "age group or type"
  },
  "keywords": ["keyword1", "keyword2"],
  "summary": "Brief summary of what the group is looking for"
}

Only respond with valid JSON, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = JSON.parse(text);
      return analysis;
    } catch (error) {
      console.error('Error analyzing chat messages:', error);
      
      // Fallback analysis if AI fails
      return this.fallbackAnalysis(messages);
    }
  }

  /**
   * Generate place recommendations based on analysis and location
   * @param {Object} analysis - Analysis result from analyzeChatMessages
   * @param {Object} location - Location object with latitude and longitude
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Recommendation strategy and search parameters
   */
  async generateRecommendations(analysis, location, radius = 5000) {
    try {
      const prompt = `
Based on the following analysis of a group chat conversation, generate specific place recommendations:

Analysis:
${JSON.stringify(analysis, null, 2)}

Location: ${location.latitude}, ${location.longitude}
Search radius: ${radius} meters

Please provide a JSON response with:
{
  "searchStrategies": [
    {
      "type": "place_type",
      "value": "restaurant",
      "priority": 1,
      "reason": "why this type is recommended"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "filters": {
    "priceLevel": "1-3",
    "rating": "4.0+",
    "openNow": true
  },
  "recommendationReason": "Why these places are recommended for this group",
  "alternativeOptions": ["alternative1", "alternative2"],
  "tips": ["tip1", "tip2"]
}

Only respond with valid JSON, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const recommendations = JSON.parse(text);
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Fallback recommendations
      return this.fallbackRecommendations(analysis);
    }
  }

  /**
   * Generate personalized descriptions for places
   * @param {Array} places - Array of place objects
   * @param {Object} analysis - Analysis result from analyzeChatMessages
   * @returns {Promise<Array>} Places with personalized descriptions
   */
  async personalizePlaceDescriptions(places, analysis) {
    try {
      const prompt = `
Based on the group's preferences and interests, create personalized descriptions for these places:

Group Analysis:
${JSON.stringify(analysis, null, 2)}

Places:
${JSON.stringify(places.slice(0, 5), null, 2)}

For each place, provide:
{
  "place_id": "place_id",
  "personalizedDescription": "Why this place is perfect for this group",
  "matchScore": 0.95,
  "highlights": ["highlight1", "highlight2"],
  "groupAppeal": "What makes this place appealing to this specific group"
}

Only respond with valid JSON array, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const personalizedPlaces = JSON.parse(text);
      
      // Merge personalized data with original place data
      return places.map(place => {
        const personalized = personalizedPlaces.find(p => p.place_id === place.place_id);
        return {
          ...place,
          personalizedDescription: personalized?.personalizedDescription || place.name,
          matchScore: personalized?.matchScore || 0.5,
          highlights: personalized?.highlights || [],
          groupAppeal: personalized?.groupAppeal || 'Good option for groups'
        };
      });
    } catch (error) {
      console.error('Error personalizing place descriptions:', error);
      
      // Return places with basic descriptions
      return places.map(place => ({
        ...place,
        personalizedDescription: place.name,
        matchScore: 0.5,
        highlights: [],
        groupAppeal: 'Good option for groups'
      }));
    }
  }

  /**
   * Generate activity suggestions based on chat analysis
   * @param {Object} analysis - Analysis result from analyzeChatMessages
   * @param {string} location - Location string
   * @returns {Promise<Array>} Array of activity suggestions
   */
  async generateActivitySuggestions(analysis, location) {
    try {
      const prompt = `
Based on the group's interests and preferences, suggest specific activities for ${location}:

Group Analysis:
${JSON.stringify(analysis, null, 2)}

Provide a JSON array of activity suggestions:
[
  {
    "activity": "Activity name",
    "description": "What this activity involves",
    "duration": "estimated time",
    "cost": "estimated cost range",
    "groupSize": "ideal group size",
    "whyRecommended": "Why this fits the group",
    "tips": ["tip1", "tip2"]
  }
]

Only respond with valid JSON array, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const activities = JSON.parse(text);
      return activities;
    } catch (error) {
      console.error('Error generating activity suggestions:', error);
      
      // Fallback activities
      return this.fallbackActivities(analysis);
    }
  }

  /**
   * Fallback analysis when AI fails - tries to extract info from chat messages
   * @param {Array} messages - Array of chat messages
   * @returns {Object} Basic analysis based on chat content
   */
  fallbackAnalysis(messages) {
    // Extract keywords from chat messages
    const chatText = messages.map(msg => msg.content.toLowerCase()).join(' ');
    
    // Simple keyword extraction
    const foodKeywords = ['food', 'eat', 'restaurant', 'dinner', 'lunch', 'breakfast', 'cafe', 'bar', 'drink', 'pizza', 'burger', 'sushi', 'italian', 'chinese', 'mexican', 'thai', 'indian'];
    const activityKeywords = ['fun', 'activity', 'entertainment', 'movie', 'theater', 'museum', 'park', 'beach', 'hiking', 'shopping', 'mall', 'game', 'sports', 'concert', 'show'];
    const attractionKeywords = ['visit', 'see', 'tourist', 'attraction', 'landmark', 'monument', 'gallery', 'exhibition', 'zoo', 'aquarium', 'theme park'];
    const budgetKeywords = ['cheap', 'expensive', 'budget', 'affordable', 'luxury', 'fancy', 'casual', 'formal'];
    
    // Count keyword matches
    const foodMatches = foodKeywords.filter(keyword => chatText.includes(keyword));
    const activityMatches = activityKeywords.filter(keyword => chatText.includes(keyword));
    const attractionMatches = attractionKeywords.filter(keyword => chatText.includes(keyword));
    const budgetMatches = budgetKeywords.filter(keyword => chatText.includes(keyword));
    
    // Determine interests based on matches
    const interests = [];
    const placeTypes = [];
    const keywords = [];
    
    if (foodMatches.length > 0) {
      interests.push('food', 'dining');
      placeTypes.push('restaurant', 'food');
      keywords.push(...foodMatches);
    }
    
    if (activityMatches.length > 0) {
      interests.push('activities', 'entertainment');
      placeTypes.push('amusement_park', 'entertainment');
      keywords.push(...activityMatches);
    }
    
    if (attractionMatches.length > 0) {
      interests.push('sightseeing', 'attractions');
      placeTypes.push('tourist_attraction', 'museum');
      keywords.push(...attractionMatches);
    }
    
    // Determine budget preference
    let budget = 'medium';
    if (budgetMatches.includes('cheap') || budgetMatches.includes('affordable')) {
      budget = 'low';
    } else if (budgetMatches.includes('expensive') || budgetMatches.includes('luxury') || budgetMatches.includes('fancy')) {
      budget = 'high';
    }
    
    // Determine atmosphere
    let atmosphere = 'casual';
    if (budgetMatches.includes('formal') || budgetMatches.includes('fancy')) {
      atmosphere = 'formal';
    }
    
    // If no specific interests found, use defaults
    if (interests.length === 0) {
      interests.push('food', 'entertainment');
      placeTypes.push('restaurant', 'tourist_attraction');
      keywords.push('fun', 'good food');
    }
    
    return {
      interests: interests.length > 0 ? interests : ['food', 'entertainment'],
      placeTypes: placeTypes.length > 0 ? placeTypes : ['restaurant', 'tourist_attraction'],
      preferences: {
        budget: budget,
        atmosphere: atmosphere,
        cuisine: foodMatches.length > 0 ? foodMatches.slice(0, 3) : ['any'],
        activities: activityMatches.length > 0 ? activityMatches.slice(0, 3) : ['general']
      },
      constraints: [],
      groupInfo: {
        size: 'small group',
        demographics: 'mixed ages'
      },
      keywords: keywords.length > 0 ? keywords.slice(0, 5) : ['fun', 'good food', 'interesting'],
      summary: `Group looking for ${interests.join(' and ')} based on chat conversation`
    };
  }

  /**
   * Fallback recommendations when AI fails
   * @param {Object} analysis - Analysis result
   * @returns {Object} Basic recommendations
   */
  fallbackRecommendations(analysis) {
    const searchStrategies = [];
    
    // Add strategies based on place types found in analysis
    analysis.placeTypes.forEach((placeType, index) => {
      searchStrategies.push({
        type: 'place_type',
        value: placeType,
        priority: index + 1,
        reason: `Based on chat analysis: ${analysis.summary}`
      });
    });
    
    // Add keyword-based search if we have keywords
    if (analysis.keywords && analysis.keywords.length > 0) {
      searchStrategies.push({
        type: 'keyword',
        value: analysis.keywords[0],
        priority: analysis.placeTypes.length + 1,
        reason: `Keyword from chat: ${analysis.keywords[0]}`
      });
    }
    
    // If no strategies, add default
    if (searchStrategies.length === 0) {
      searchStrategies.push({
        type: 'place_type',
        value: 'restaurant',
        priority: 1,
        reason: 'Default recommendation for group dining'
      });
    }
    
    return {
      searchStrategies: searchStrategies,
      keywords: analysis.keywords || ['fun', 'good food'],
      filters: {
        priceLevel: analysis.preferences.budget === 'low' ? '1-2' : 
                   analysis.preferences.budget === 'high' ? '4-5' : 
                   '1-3', // medium budget
        rating: '3.5+',
        openNow: true
      },
      recommendationReason: analysis.summary || 'General recommendations based on chat conversation',
      alternativeOptions: analysis.interests || ['parks', 'museums', 'shopping'],
      tips: ['Check opening hours', 'Make reservations if needed']
    };
  }

  /**
   * Fallback activities when AI fails
   * @param {Object} analysis - Analysis result
   * @returns {Array} Basic activities
   */
  fallbackActivities(analysis) {
    return [
      {
        activity: 'Group Dining',
        description: 'Find a restaurant that can accommodate your group size',
        duration: '1-2 hours',
        cost: '$$',
        groupSize: '2-8 people',
        whyRecommended: 'Essential for group outings',
        tips: ['Make reservations', 'Check group discounts']
      },
      {
        activity: 'Local Attractions',
        description: 'Visit popular local attractions and landmarks',
        duration: '2-4 hours',
        cost: '$$$',
        groupSize: '2-10 people',
        whyRecommended: 'Great for group photos and memories',
        tips: ['Check group rates', 'Plan for crowds']
      }
    ];
  }
}

module.exports = RecommendationService;
