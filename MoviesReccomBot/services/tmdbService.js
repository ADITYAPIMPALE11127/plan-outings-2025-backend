const axios = require('axios');
require('dotenv').config();

class TMDbService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = 'https://api.themoviedb.org/3';
  }

  // Get latest movies (fallback to local data if API fails)
  async getLatestMovies() {
    try {
      console.log("Fetching from TMDB API...");
      const response = await axios.get(`${this.baseURL}/movie/now_playing`, {
        params: {
          api_key: this.apiKey,
          region: 'IN',
          page: 1
        }
      });
      
      const movies = response.data.results.slice(0, 10); // Get top 10
      console.log(`Found ${movies.length} movies from TMDB`);
      return movies;
      
    } catch (error) {
      console.log('TMDB API failed, using local data...');
      return this.getLocalMovies();
    }
  }

  // Get local movies from your dataset
  async getLocalMovies() {
    try {
      // For now, return sample movies - we'll enhance this later
      return [
        {
          id: 1,
          title: "Sample Action Movie",
          overview: "An exciting action adventure",
          genre_ids: [28, 12],
          release_date: "2024-01-01",
          vote_average: 7.5,
          poster_path: "/sample-poster.jpg"
        },
        {
          id: 2, 
          title: "Sample Comedy Film",
          overview: "A hilarious comedy for everyone",
          genre_ids: [35, 10749],
          release_date: "2024-01-02",
          vote_average: 8.0,
          poster_path: "/comedy-poster.jpg"
        }
      ];
    } catch (error) {
      console.error('Error getting local movies:', error);
      return [];
    }
  }

  // Filter movies based on preferences
  async getMoviesByPreferences(preferences, limit = 5) {
    const allMovies = await this.getLatestMovies();
    
    // Simple matching logic for now
    const filteredMovies = allMovies.filter(movie => {
      const genreMatch = preferences.genres && preferences.genres.length > 0;
      const themeMatch = preferences.themes && preferences.themes.some(theme => 
        movie.overview.toLowerCase().includes(theme.toLowerCase())
      );
      
      return genreMatch || themeMatch;
    });

    return filteredMovies.slice(0, limit).length > 0 
      ? filteredMovies.slice(0, limit) 
      : allMovies.slice(0, limit); // Fallback to all movies if no matches
  }
}

module.exports = new TMDbService();