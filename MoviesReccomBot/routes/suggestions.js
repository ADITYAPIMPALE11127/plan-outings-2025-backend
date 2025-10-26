const express = require('express');
const router = express.Router();
const openAIService = require('../services/openAIService');
const tmdbService = require('../services/tmdbService');
const firebaseService = require('../services/firebaseService');

// GET /api/suggestions/:chatId - MAIN ENDPOINT
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log(`🎯 Getting movie suggestions for chat: ${chatId}`);
    
    // Step 1: Get real chat messages from Firebase
    const chatMessages = await firebaseService.getChatMessages(chatId);
    console.log(`💬 Found ${chatMessages.length} chat messages`);
    
    // Step 2: Analyze chat with OpenAI
    const preferences = await openAIService.analyzeChatForMoviePreferences(chatMessages);
    console.log(`🤖 Analysis:`, preferences);
    
    // Step 3: Get matching movies from TMDB
    const suggestedMovies = await tmdbService.getMoviesByPreferences(preferences, 4);
    console.log(`🎬 Found ${suggestedMovies.length} movie suggestions`);
    
    // Step 4: Format the perfect response
    const response = {
      success: true,
      chatId: chatId,
      suggestions: suggestedMovies,
      analysis: preferences,
      message: generateSuggestionMessage(suggestedMovies.length, preferences.summary),
      chatPreview: chatMessages.slice(0, 3).map(msg => `${msg.sender}: ${msg.text}`)
    };

    console.log(`✅ Sent ${suggestedMovies.length} suggestions for chat ${chatId}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating suggestions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate suggestions',
      message: 'Please try again later'
    });
  }
});

// Test route without specific chat
router.get('/', async (req, res) => {
  try {
    // Use sample chat data for testing
    const sampleMessages = [
      { sender: 'TestUser1', text: 'I love action and comedy movies!' },
      { sender: 'TestUser2', text: 'Something with adventure would be great' }
    ];
    
    const preferences = await openAIService.analyzeChatForMoviePreferences(sampleMessages);
    const suggestedMovies = await tmdbService.getMoviesByPreferences(preferences, 3);
    
    res.json({
      success: true,
      suggestions: suggestedMovies,
      analysis: preferences,
      message: "Test suggestions with sample chat data!",
      note: "Use /api/suggestions/chat1 for specific chat analysis"
    });
  } catch (error) {
    res.status(500).json({ error: 'Test failed' });
  }
});

// Helper function for suggestion messages
function generateSuggestionMessage(movieCount, summary) {
  const messages = [
    `We found ${movieCount} perfect movies for your group! Based on your chat about "${summary}"`,
    `These ${movieCount} movies match your group's vibe perfectly! You were discussing "${summary}"`,
    `Great news! We've picked ${movieCount} movies that align with your conversation about "${summary}"`
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = router;