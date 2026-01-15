const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

const OTP_GRAPHQL_ENDPOINT = process.env.OTP_GRAPHQL_ENDPOINT || 'https://otp.det.city/otp/gtfs/v1';

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
        realTime
        start {
          scheduledTime
          estimated {
            time
            delay
          }
        }
        end {
          scheduledTime
          estimated {
            time
            delay
          }
        }
        from { name lat lon stop { gtfsId code } }
        to { name lat lon stop { gtfsId code } }
        intermediateStops { name gtfsId }
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

exports.handler = async function (event) {
  // Check origin/referer
  if (!isAllowedOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const corsOrigin = getCorsOrigin(event);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
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

    const response = await fetch(OTP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PLAN_QUERY,
        variables: variables
      })
    });

    const responseText = await response.text();

    // Parse the response to transform it for frontend compatibility
    const parsed = JSON.parse(responseText);

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
                  realTime: leg.realTime || false,
                  startTime: leg.start?.estimated?.time
                    ? new Date(leg.start.estimated.time).getTime()
                    : (leg.start?.scheduledTime ? new Date(leg.start.scheduledTime).getTime() : null),
                  endTime: leg.end?.estimated?.time
                    ? new Date(leg.end.estimated.time).getTime()
                    : (leg.end?.scheduledTime ? new Date(leg.end.scheduledTime).getTime() : null),
                  startDelay: leg.start?.estimated?.delay || null,
                  endDelay: leg.end?.estimated?.delay || null,
                  from: leg.from,
                  to: leg.to,
                  intermediateStops: leg.intermediateStops || [],
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

      return {
        statusCode: 200,
        body: JSON.stringify(transformed),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      };
    } else {
      // Return original response if no plan data
      return {
        statusCode: 200,
        body: responseText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      };
    }
  } catch (error) {
    console.error('OTP request error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error fetching trip plan',
        error: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
};
