const axios = require("axios");
const fs = require("fs");
const path = require("path"); // Add this line
const { stringify } = require('csv-stringify/sync');

// Load environment variables from root folder
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.TMDB_API_KEY;

// Validate API key
if (!API_KEY) {
  console.error("❌ TMDB_API_KEY not found in environment variables");
  console.log("💡 Make sure you have a .env file in the root folder with TMDB_API_KEY=your_api_key");
  console.log(`📁 Current .env path: ${path.join(__dirname, '..', '.env')}`);
  process.exit(1);
}

console.log("✅ TMDB API Key loaded successfully");

async function fetchMoviesAndExportCSV() {
  try {
    console.log("🎬 Fetching movies from TMDB...");
    
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing`,
      {
        params: {
          api_key: API_KEY,
          language: "en-IN",
          region: "IN",
          page: 1
        }
      }
    );

    // Get detailed information for each movie including genres
    const moviesWithDetails = await Promise.all(
      response.data.results.map(async (movie) => {
        try {
          // Fetch detailed movie info to get genres
          const detailResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${movie.id}`,
            {
              params: {
                api_key: API_KEY,
                language: "en-IN"
              }
            }
          );
          
          return {
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            rating: movie.vote_average,
            vote_count: movie.vote_count,
            overview: movie.overview ? movie.overview.replace(/\n/g, ' ') : '',
            poster_path: movie.poster_path,
            popularity: movie.popularity,
            adult: movie.adult,
            original_language: movie.original_language,
            // Genre information
            genre_ids: movie.genre_ids ? movie.genre_ids.join('|') : '',
            genres: detailResponse.data.genres ? detailResponse.data.genres.map(g => g.name).join('|') : '',
            // Additional features for ML model
            runtime: detailResponse.data.runtime || 0,
            budget: detailResponse.data.budget || 0,
            revenue: detailResponse.data.revenue || 0,
            status: detailResponse.data.status || '',
            tagline: detailResponse.data.tagline ? detailResponse.data.tagline.replace(/\n/g, ' ') : ''
          };
        } catch (error) {
          console.log(`⚠️ Could not fetch details for ${movie.title}`);
          return null;
        }
      })
    );

    // Filter out null values
    const validMovies = moviesWithDetails.filter(movie => movie !== null);

    // Define CSV columns
    const columns = [
      'id',
      'title',
      'release_date',
      'rating',
      'vote_count',
      'overview',
      'poster_path',
      'popularity',
      'adult',
      'original_language',
      'genre_ids',
      'genres',
      'runtime',
      'budget',
      'revenue',
      'status',
      'tagline'
    ];

    // Convert to CSV
    const csvData = stringify(validMovies, {
      header: true,
      columns: columns
    });

    // Write to file (save in tmdbApi folder)
    const csvPath = path.join(__dirname, 'movies_dataset.csv');
    fs.writeFileSync(csvPath, csvData);
    
    console.log(`✅ Successfully exported ${validMovies.length} movies to movies_dataset.csv`);
    console.log(`📊 File saved at: ${csvPath}`);
    
    // Show sample of the data
    console.log("\n📋 Sample of exported data:");
    console.table(validMovies.slice(0, 3).map(movie => ({
      Title: movie.title,
      Genres: movie.genres,
      Rating: movie.rating,
      Release: movie.release_date
    })));

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

fetchMoviesAndExportCSV();