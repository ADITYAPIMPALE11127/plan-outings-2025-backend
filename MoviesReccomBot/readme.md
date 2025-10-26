# 🎬 Plan Outings 2025 - Backend

## Current API Endpoints

### TMDB Movie API Integration

#### 🔹 Get Now Playing Movies in India
- **Endpoint**: `GET /api/movies/now-playing`
- **Description**: Fetches currently playing movies in Indian theaters
- **Source**: `tmdbApi/tmdb_latest_movies.js`
- **Features**:
  - Real-time movie data from TMDB
  - Indian region-specific results
  - Complete movie details including genres, ratings, and posters
  - Export to CSV for ML model training

#### 🔹 Movie Data Export
- **Endpoint**: Internal script execution
- **Description**: Generates `movies_dataset.csv` for ML training
- **Data Includes**:
  - Movie ID, title, release date
  - Rating, vote count, popularity
  - Genres (pipe-separated for ML processing)
  - Overview, runtime, budget, revenue
  - Poster paths and additional metadata