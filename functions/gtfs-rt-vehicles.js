const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

exports.handler = async function(event, context) {
  // Check origin/referer
  if (!isAllowedOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const corsOrigin = getCorsOrigin(event);

  const feedUrl = event.queryStringParameters?.url;

  if (!feedUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }

  try {
    const response = await fetch(feedUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

    // Extract vehicle positions
    const vehicles = feed.entity
      .filter(entity => entity.vehicle)
      .map(entity => {
        const v = entity.vehicle;
        return {
          id: entity.id,
          tripId: v.trip?.tripId || null,
          routeId: v.trip?.routeId || null,
          directionId: v.trip?.directionId ?? null,
          headsign: v.trip?.tripHeadsign || v.vehicle?.label || null,
          latitude: v.position?.latitude || null,
          longitude: v.position?.longitude || null,
          bearing: v.position?.bearing || null,
          speed: v.position?.speed || null,
          timestamp: v.timestamp ? Number(v.timestamp) : null,
          vehicleId: v.vehicle?.id || null,
          vehicleLabel: v.vehicle?.label || null,
          currentStopSequence: v.currentStopSequence || null,
          stopId: v.stopId || null,
          currentStatus: v.currentStatus || null,
          congestionLevel: v.congestionLevel || null,
          occupancyStatus: v.occupancyStatus || null,
        };
      })
      .filter(v => v.latitude && v.longitude); // Only include vehicles with positions

    return {
      statusCode: 200,
      body: JSON.stringify({
        timestamp: feed.header?.timestamp ? Number(feed.header.timestamp) : null,
        vehicleCount: vehicles.length,
        vehicles
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Cache-Control': 'public, max-age=10' // Cache for 10 seconds
      }
    };
  } catch (error) {
    console.error('Error fetching GTFS-RT feed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
};
