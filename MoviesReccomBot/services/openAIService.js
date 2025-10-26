const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  async analyzeChatForMoviePreferences(chatMessages) {
    try {
      const conversationText = chatMessages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

      console.log("Analyzing chat:", conversationText);

      const prompt = `
      Analyze this group chat conversation and understand what types of movies these people would enjoy together.
      Look for: genre preferences, mood, themes, mentioned actors/directors, and overall vibe.
      
      Conversation:
      ${conversationText}
      
      Respond with this exact JSON format:
      {
        "genres": ["action", "comedy", "drama"],
        "themes": ["friendship", "adventure"],
        "mood": "light-hearted",
        "mentioned_movies": [],
        "summary": "brief summary of what the group wants"
      }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a movie expert analyzing group chats to suggest perfect movies. Always respond with valid JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      console.log("OpenAI Analysis Result:", content);
      
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback analysis
      return {
        genres: ["action", "comedy", "drama"],
        themes: ["adventure", "friendship"],
        mood: "entertaining",
        mentioned_movies: [],
        summary: "Group looking for enjoyable movies together"
      };
    }
  }
}

module.exports = new OpenAIService();