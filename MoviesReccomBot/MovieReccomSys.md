# 🎬 MoviesReccomBot - AI Movie Suggestion System

## 📖 Overview
MoviesReccomBot is an AI-powered movie suggestion system that analyzes group chat conversations and provides personalized movie recommendations using OpenAI and TMDB.

## 🚀 Features
- AI-driven analysis of chat conversations to identify movie preferences
- Real-time movie suggestions powered by TMDB
- Firebase Realtime Database integration for seamless chat data access
- RESTful API for easy integration with frontend applications

## 🔌 API Endpoints

### Health Check
GET https://moviesreccombot.onrender.com/health


### Get Movie Suggestions
GET https://moviesreccombot.onrender.com/api/suggestions/:chatId


**Example:**
```javascript
// Get suggestions for any chat ID
const response = await fetch('https://moviesreccombot.onrender.com/api/suggestions/-0cPStdCj11vcx2ZLW61');
const data = await response.json();
// Returns: { success, suggestions[], analysis, message }

🛠️ Quick Setup
1. Environment Variables
Create a .env file with the following:

OPENAI_API_KEY=your_openai_key
TMDB_API_KEY=your_tmdb_key
PORT=3000

2. Installation
npm install
npm start

🚀 Deployment

Live URL: https://moviesreccombot.onrender.com
Deployed on Render.com with auto-deploys from the GitHub main branch

🎯 How It Works

Fetches chat messages from Firebase Realtime Database
Analyzes conversations using OpenAI to determine preferences
Matches preferences with the latest movies from TMDB
Returns personalized movie suggestions with posters and details

🔗 Links

Live API: https://moviesreccombot.onrender.com
Health Check: https://moviesreccombot.onrender.com/health
Example: https://moviesreccombot.onrender.com/api/suggestions/chat123

Works with any Firebase chat ID, automatically handling new and existing chats! 🎬