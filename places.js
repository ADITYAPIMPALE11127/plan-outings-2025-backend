const { Client } = require('@googlemaps/google-maps-services-js');

/**
 * Google Places API Service
 * Handles fetching nearby places using Google Places API
 */
class PlacesService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
    }
  }

  /**
   * Search for nearby places based on location and preferences
   * @param {Object} params - Search parameters
   * @param {number} params.latitude - Latitude coordinate
   * @param {number} params.longitude - Longitude coordinate
   * @param {number} params.radius - Search radius in meters (default: 5000)
   * @param {string} params.type - Place type (restaurant, tourist_attraction, etc.)
   * @param {string} params.keyword - Additional search keyword
   * @param {number} params.maxResults - Maximum number of results (default: 20)
   * @returns {Promise<Array>} Array of place objects
   */
  async searchNearbyPlaces({
    latitude,
    longitude,
    radius = 5000,
    type = null,
    keyword = null,
    maxResults = 20
  }) {
    try {
      const request = {
        params: {
          location: `${latitude},${longitude}`,
          radius: radius,
          key: this.apiKey,
        },
      };

      // Add optional parameters
      if (type) {
        request.params.type = type;
      }
      if (keyword) {
        request.params.keyword = keyword;
      }

      const response = await this.client.placesNearby(request);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      let places = response.data.results || [];

      // Limit results
      if (maxResults && places.length > maxResults) {
        places = places.slice(0, maxResults);
      }

      // Enhance place data with additional details
      const enhancedPlaces = await Promise.all(
        places.map(async (place) => {
          const enhancedPlace = await this.enhancePlaceDetails(place);
          return enhancedPlace;
        })
      );

      return enhancedPlaces;
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw new Error(`Failed to search nearby places: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific place
   * @param {string} placeId - Google Places place ID
   * @returns {Promise<Object>} Enhanced place details
   */
  async getPlaceDetails(placeId) {
    try {
      const request = {
        params: {
          place_id: placeId,
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'price_level',
            'photos',
            'opening_hours',
            'types',
            'website',
            'formatted_phone_number',
            'reviews'
          ].join(','),
          key: this.apiKey,
        },
      };

      const response = await this.client.placeDetails(request);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return this.formatPlaceDetails(response.data.result);
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error(`Failed to get place details: ${error.message}`);
    }
  }

  /**
   * Enhance basic place data with additional details
   * @param {Object} place - Basic place object from nearby search
   * @returns {Promise<Object>} Enhanced place object
   */
  async enhancePlaceDetails(place) {
    try {
      // Get additional details if place_id is available
      if (place.place_id) {
        const details = await this.getPlaceDetails(place.place_id);
        return {
          ...place,
          ...details,
          // Keep original data as fallback
          original_rating: place.rating,
          original_user_ratings_total: place.user_ratings_total,
        };
      }

      return this.formatBasicPlace(place);
    } catch (error) {
      console.error('Error enhancing place details:', error);
      // Return basic place data if enhancement fails
      return this.formatBasicPlace(place);
    }
  }

  /**
   * Format basic place data from nearby search
   * @param {Object} place - Basic place object
   * @returns {Object} Formatted place object
   */
  formatBasicPlace(place) {
    return {
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      geometry: place.geometry,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      price_level: place.price_level || null,
      types: place.types || [],
      photos: place.photos || [],
      business_status: place.business_status || 'OPERATIONAL',
      formatted_address: place.vicinity,
    };
  }

  /**
   * Format detailed place data
   * @param {Object} place - Detailed place object
   * @returns {Object} Formatted place object
   */
  formatPlaceDetails(place) {
    return {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      price_level: place.price_level || null,
      types: place.types || [],
      photos: place.photos || [],
      opening_hours: place.opening_hours || null,
      website: place.website || null,
      formatted_phone_number: place.formatted_phone_number || null,
      reviews: place.reviews || [],
      business_status: place.business_status || 'OPERATIONAL',
    };
  }

  /**
   * Search for places by text query
   * @param {string} query - Search query
   * @param {Object} location - Location object with lat/lng
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of place objects
   */
  async searchPlacesByText(query, location = null, radius = 5000) {
    try {
      const request = {
        params: {
          query: query,
          key: this.apiKey,
        },
      };

      if (location) {
        request.params.location = `${location.latitude},${location.longitude}`;
        request.params.radius = radius;
      }

      const response = await this.client.textSearch(request);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      const places = response.data.results || [];
      
      // Enhance place data
      const enhancedPlaces = await Promise.all(
        places.map(async (place) => {
          const enhancedPlace = await this.enhancePlaceDetails(place);
          return enhancedPlace;
        })
      );

      return enhancedPlaces;
    } catch (error) {
      console.error('Error searching places by text:', error);
      throw new Error(`Failed to search places by text: ${error.message}`);
    }
  }

  /**
   * Get photo URL for a place photo
   * @param {Object} photo - Photo object from place
   * @param {number} maxWidth - Maximum width in pixels
   * @param {number} maxHeight - Maximum height in pixels
   * @returns {string} Photo URL
   */
  getPhotoUrl(photo, maxWidth = 400, maxHeight = 400) {
    if (!photo || !photo.photo_reference) {
      return null;
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photo.photo_reference}&key=${this.apiKey}`;
  }
}

module.exports = PlacesService;
