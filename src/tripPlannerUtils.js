import nearestPointOnLine from "@turf/nearest-point-on-line";
import lineSlice from "@turf/line-slice";

/**
 * Decode a Google encoded polyline string into an array of [lng, lat] coordinates
 * @param {string} encoded - The encoded polyline string
 * @returns {Array} Array of [longitude, latitude] pairs
 */
export function decodePolyline(encoded) {
  if (!encoded) return [];

  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // Return as [lng, lat] for GeoJSON compatibility
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration like "25 min" or "1 hr 15 min"
 */
export function formatDuration(seconds) {
  if (!seconds) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${minutes} min`;
  }
}

/**
 * Format an ISO datetime string to a compact time display
 * @param {string} isoString - ISO 8601 datetime string
 * @returns {string} Formatted time like "3:45p" or "11:30a"
 */
export function formatTime(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'p' : 'a';
  const hour12 = hours % 12 || 12;
  const minuteStr = minutes.toString().padStart(2, '0');

  return `${hour12}:${minuteStr}${period}`;
}

/**
 * Format walking distance in meters to human-readable string
 * For distances < 0.25 mi, shows feet rounded to nearest 50
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance like "0.3 mi" or "200 ft"
 */
export function formatDistance(meters) {
  if (!meters) return '';

  const miles = meters * 0.000621371;

  // For short distances (< 0.25 mi), show in feet rounded to nearest 50
  if (miles < 0.25) {
    const feet = meters * 3.28084;
    const roundedFeet = Math.round(feet / 50) * 50;
    return `${roundedFeet} ft`;
  }

  return `${miles.toFixed(1)} mi`;
}

/**
 * Get display text for a transit mode
 * @param {string} mode - OTP mode string (WALK, BUS, TRAM, etc.)
 * @returns {string} Display text
 */
export function getModeDisplay(mode) {
  const modes = {
    WALK: 'Walk',
    BUS: 'Bus',
    TRAM: 'Streetcar',
    RAIL: 'Rail',
    SUBWAY: 'Subway',
    FERRY: 'Ferry',
    CABLE_CAR: 'Cable Car',
    GONDOLA: 'Gondola',
    FUNICULAR: 'Funicular',
    BICYCLE: 'Bike',
    CAR: 'Car'
  };
  return modes[mode] || mode;
}

/**
 * Clip a LineString geometry between two points
 * @param {Object} geometry - GeoJSON LineString geometry
 * @param {Object} fromPoint - Start point {lat, lon}
 * @param {Object} toPoint - End point {lat, lon}
 * @returns {Object} Clipped GeoJSON geometry
 */
function clipGeometry(geometry, fromPoint, toPoint) {
  if (!geometry || !fromPoint || !toPoint) return geometry;
  if (geometry.type !== 'LineString') return geometry;

  try {
    const line = { type: 'Feature', geometry };
    const startPt = [fromPoint.lon, fromPoint.lat];
    const endPt = [toPoint.lon, toPoint.lat];

    // Find nearest points on the line to start and end
    const nearStart = nearestPointOnLine(line, startPt);
    const nearEnd = nearestPointOnLine(line, endPt);

    // Slice the line between the two points
    const sliced = lineSlice(nearStart, nearEnd, line);

    return sliced.geometry;
  } catch (e) {
    console.warn('Failed to clip geometry:', e);
    return geometry;
  }
}

/**
 * Get geometry from Sanity direction shape (JSON string) or fall back to OTP polyline
 * Clips Sanity geometry to the segment between boarding and alighting stops
 * @param {Object} leg - Leg object with optional sanityGeometry, legGeometry, from, to
 * @returns {Object} GeoJSON geometry object
 */
function getLegGeometry(leg) {
  // Try Sanity geometry first (stored as JSON string)
  if (leg.sanityGeometry) {
    try {
      const parsed = JSON.parse(leg.sanityGeometry);
      let geometry = null;

      // Sanity stores as array of features, get the first one's geometry
      if (Array.isArray(parsed) && parsed[0]?.geometry) {
        geometry = parsed[0].geometry;
      }
      // Or it might be a direct geometry object
      else if (parsed.type === 'LineString' || parsed.type === 'MultiLineString') {
        geometry = parsed;
      }
      // Or a Feature
      else if (parsed.type === 'Feature' && parsed.geometry) {
        geometry = parsed.geometry;
      }

      // Clip geometry to the leg segment if we have from/to points
      if (geometry && leg.from && leg.to) {
        geometry = clipGeometry(geometry, leg.from, leg.to);
      }

      if (geometry) {
        return geometry;
      }
    } catch (e) {
      console.warn('Failed to parse Sanity geometry:', e);
    }
  }

  // Fall back to OTP polyline
  const coordinates = decodePolyline(leg.legGeometry?.points);
  return {
    type: 'LineString',
    coordinates: coordinates
  };
}

/**
 * Convert itinerary legs to GeoJSON FeatureCollection for map display
 * Uses Sanity route geometry when available, falls back to OTP polyline
 * @param {Array} legs - Array of leg objects from OTP (enriched with sanityGeometry)
 * @returns {Object} GeoJSON FeatureCollection
 */
export function legsToGeoJSON(legs) {
  if (!legs || legs.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features = legs.map((leg, index) => {
    const geometry = getLegGeometry(leg);

    return {
      type: 'Feature',
      id: index,
      properties: {
        mode: leg.mode,
        routeShortName: leg.route?.shortName || '',
        routeLongName: leg.route?.longName || '',
        routeColor: leg.route?.color ? `#${leg.route.color}` : '#666666',
        isTransit: leg.mode !== 'WALK',
        legIndex: index,
        usingSanityGeometry: !!leg.sanityGeometry
      },
      geometry: geometry
    };
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Create GeoJSON points for origin and destination
 * @param {Object} itinerary - Itinerary object from OTP
 * @returns {Object} GeoJSON FeatureCollection with origin and destination points
 */
export function createEndpointMarkers(itinerary) {
  if (!itinerary?.legs || itinerary.legs.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const firstLeg = itinerary.legs[0];
  const lastLeg = itinerary.legs[itinerary.legs.length - 1];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          type: 'origin',
          name: firstLeg.from?.name || 'Origin'
        },
        geometry: {
          type: 'Point',
          coordinates: [firstLeg.from?.lon, firstLeg.from?.lat]
        }
      },
      {
        type: 'Feature',
        properties: {
          type: 'destination',
          name: lastLeg.to?.name || 'Destination'
        },
        geometry: {
          type: 'Point',
          coordinates: [lastLeg.to?.lon, lastLeg.to?.lat]
        }
      }
    ]
  };
}

/**
 * Create GeoJSON markers for all transit stops used in the trip
 * @param {Object} itinerary - OTP itinerary object
 * @returns {Object} GeoJSON FeatureCollection with stop point markers
 */
export function createStopMarkers(itinerary) {
  if (!itinerary?.legs || itinerary.legs.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const stops = [];
  const seenCoords = new Set();

  itinerary.legs.forEach((leg) => {
    // Only process transit legs
    if (leg.mode === 'WALK') return;

    // Add boarding stop
    if (leg.from?.stop && leg.from?.lat && leg.from?.lon) {
      const coordKey = `${leg.from.lon},${leg.from.lat}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        stops.push({
          type: 'Feature',
          properties: {
            name: leg.from.name || 'Stop',
            type: 'boarding',
            routeColor: leg.route?.color ? `#${leg.route.color}` : '#666666'
          },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(leg.from.lon), parseFloat(leg.from.lat)]
          }
        });
      }
    }

    // Add alighting stop
    if (leg.to?.stop && leg.to?.lat && leg.to?.lon) {
      const coordKey = `${leg.to.lon},${leg.to.lat}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        stops.push({
          type: 'Feature',
          properties: {
            name: leg.to.name || 'Stop',
            type: 'alighting',
            routeColor: leg.route?.color ? `#${leg.route.color}` : '#666666'
          },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(leg.to.lon), parseFloat(leg.to.lat)]
          }
        });
      }
    }
  });

  return { type: 'FeatureCollection', features: stops };
}

/**
 * Parse ISO 8601 duration string to seconds
 * @param {string} duration - ISO 8601 duration string like "PT120S"
 * @returns {number} Duration in seconds, or 0 if invalid
 */
function parseIsoDuration(duration) {
  if (!duration || typeof duration !== 'string') return 0;

  // Match PT[hours]H[minutes]M[seconds]S pattern, with optional negative sign
  const regex = /^(-)?PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/;
  const match = duration.match(regex);

  if (!match) return 0;

  const negative = match[1] === '-';
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseFloat(match[4] || '0');

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return negative ? -totalSeconds : totalSeconds;
}

/**
 * Format delay in seconds to human-readable text
 * @param {number|string} delay - Delay in seconds or ISO 8601 duration (negative = early)
 * @returns {string|null} Formatted delay like "2 min late", "1 min early", or null if on-time
 */
export function formatDelay(delay) {
  if (!delay) return null;

  // Convert ISO 8601 duration to seconds if needed
  let delaySeconds = typeof delay === 'string' ? parseIsoDuration(delay) : delay;

  if (Math.abs(delaySeconds) < 30) {
    return null;  // Don't show anything for on-time
  }

  const absMinutes = Math.round(Math.abs(delaySeconds) / 60);
  const isLate = delaySeconds > 0;
  return `${absMinutes}m ${isLate ? 'late' : 'early'}`;
}

/**
 * Check if a leg should show real-time indicator
 * @param {Object} leg - Leg object with realTime and mode properties
 * @returns {boolean} Whether to show real-time indicator (green dot)
 */
export function shouldShowRealtimeBadge(leg) {
  return leg.realTime === true && leg.mode !== 'WALK';
}
