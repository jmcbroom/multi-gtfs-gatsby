const rp = require('request-promise');
const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

const OTP_GRAPHQL_ENDPOINT = 'https://otp.det.city/otp/gtfs/v1';

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

exports.handler = async function (event, context, callback) {
  if (!isAllowedOrigin(event)) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const corsOrigin = getCorsOrigin(event);

  if (event.httpMethod === 'OPTIONS') {
    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    });
  }

  try {
    const { lat, lon, maxResults = 10, maxDistance = 1000 } = event.queryStringParameters || {};

    if (!lat || !lon) {
      return callback(null, {
        statusCode: 400,
        body: JSON.stringify({ message: 'lat and lon parameters required' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      });
    }

    const variables = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      maxResults: parseInt(maxResults),
      maxDistance: parseInt(maxDistance)
    };

    const response = await rp({
      uri: OTP_GRAPHQL_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: NEARBY_STOPS_QUERY,
        variables: variables
      })
    });

    callback(null, {
      statusCode: 200,
      body: response,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    });
  } catch (error) {
    console.error('OTP nearby stops error:', error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error fetching nearby stops',
        error: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    });
  }
};
