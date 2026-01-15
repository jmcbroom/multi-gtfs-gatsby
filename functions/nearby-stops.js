const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

const OTP_GRAPHQL_ENDPOINT = process.env.OTP_GRAPHQL_ENDPOINT || 'https://otp.det.city/otp/gtfs/v1';

const NEARBY_STOPS_QUERY = `
query nearest($lat: Float!, $lon: Float!, $maxResults: Int, $maxDistance: Int) {
  nearest(lat: $lat, lon: $lon, maxResults: $maxResults, maxDistance: $maxDistance, filterByPlaceTypes: [STOP]) {
    edges {
      node {
        place {
          ... on Stop {
            gtfsId
            name
            lat
            lon
            code
            patterns {
              headsign
              directionId
              route {
                gtfsId
                shortName
                longName
                color
                textColor
                agency {
                  gtfsId
                  name
                }
              }
            }
          }
        }
        distance
      }
    }
  }
}
`;

exports.handler = async function (event) {
  if (!isAllowedOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const corsOrigin = getCorsOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { lat, lon, maxResults = 10, maxDistance = 1000 } = event.queryStringParameters || {};

    if (!lat || !lon) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'lat and lon parameters required' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      };
    }

    const variables = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      maxResults: parseInt(maxResults),
      maxDistance: parseInt(maxDistance)
    };

    const response = await fetch(OTP_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: NEARBY_STOPS_QUERY,
        variables: variables
      })
    });

    const body = await response.text();

    return {
      statusCode: 200,
      body: body,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  } catch (error) {
    console.error('OTP nearby stops error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error fetching nearby stops',
        error: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
};
