const rp = require('request-promise');

const OTP_GRAPHQL_ENDPOINT = 'https://otp.det.city/otp/gtfs/v1';

// Allowed origins for the API
const ALLOWED_ORIGINS = [
  'https://transit.det.city',
  'http://localhost:8888',
  'http://localhost:8000',
];

// Check if request is from allowed origin
function isAllowedOrigin(event) {
  const origin = event.headers.origin || event.headers.Origin;
  const referer = event.headers.referer || event.headers.Referer;

  // Check origin header
  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return true;
  }

  // Check referer header as fallback
  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) {
    return true;
  }

  return false;
}

// Using the 'plan' query which supports arriveBy
const PLAN_QUERY = `
query plan($from: InputCoordinates!, $to: InputCoordinates!, $date: String, $time: String, $arriveBy: Boolean, $numItineraries: Int) {
  plan(from: $from, to: $to, date: $date, time: $time, arriveBy: $arriveBy, numItineraries: $numItineraries) {
    itineraries {
      start
      end
      duration
      walkDistance
      numberOfTransfers
      legs {
        mode
        start { scheduledTime }
        end { scheduledTime }
        from { name lat lon stop { gtfsId code } }
        to { name lat lon stop { gtfsId code } }
        route { shortName longName color agency { gtfsId name } }
        trip { directionId }
        headsign
        legGeometry { points }
        distance
        duration
      }
    }
    routingErrors {
      code
      description
    }
  }
}
`;

exports.handler = async function (event, context, callback) {
  // Check origin/referer
  if (!isAllowedOrigin(event)) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Get the origin for CORS response
  const origin = event.headers.origin || event.headers.Origin || 'https://transit.det.city';
  const corsOrigin = ALLOWED_ORIGINS.find(allowed => origin.startsWith(allowed)) || ALLOWED_ORIGINS[0];

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    });
  }

  if (event.httpMethod !== 'POST') {
    return callback(null, {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    });
  }

  try {
    const { originLat, originLon, destLat, destLon, date, time, arriveBy } = JSON.parse(event.body);

    // Build the variables for the GraphQL query
    const variables = {
      from: {
        lat: parseFloat(originLat),
        lon: parseFloat(originLon)
      },
      to: {
        lat: parseFloat(destLat),
        lon: parseFloat(destLon)
      },
      numItineraries: 5
    };

    // Add date/time if provided
    if (date) {
      variables.date = date;
    }
    if (time) {
      variables.time = time;
    }

    // Add arriveBy parameter
    if (arriveBy !== undefined) {
      variables.arriveBy = !!arriveBy;
    }

    const response = await rp({
      uri: OTP_GRAPHQL_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: PLAN_QUERY,
        variables: variables
      })
    });

    // Parse the response to transform it for frontend compatibility
    const parsed = JSON.parse(response);

    // Transform the plan response to match the planConnection structure the frontend expects
    if (parsed.data && parsed.data.plan) {
      const plan = parsed.data.plan;
      const transformed = {
        data: {
          planConnection: {
            edges: (plan.itineraries || []).map(itin => ({
              node: {
                start: itin.start,
                end: itin.end,
                duration: itin.duration,
                walkDistance: itin.walkDistance,
                numberOfTransfers: itin.numberOfTransfers,
                legs: (itin.legs || []).map(leg => ({
                  mode: leg.mode,
                  startTime: leg.start?.scheduledTime ? new Date(leg.start.scheduledTime).getTime() : null,
                  endTime: leg.end?.scheduledTime ? new Date(leg.end.scheduledTime).getTime() : null,
                  from: leg.from,
                  to: leg.to,
                  route: leg.route,
                  trip: leg.trip,
                  headsign: leg.headsign,
                  legGeometry: leg.legGeometry,
                  distance: leg.distance,
                  duration: leg.duration
                }))
              }
            })),
            routingErrors: plan.routingErrors || []
          }
        }
      };

      callback(null, {
        statusCode: 200,
        body: JSON.stringify(transformed),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      });
    } else {
      // Return original response if no plan data
      callback(null, {
        statusCode: 200,
        body: response,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      });
    }
  } catch (error) {
    console.error('OTP request error:', error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error fetching trip plan',
        error: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    });
  }
};
