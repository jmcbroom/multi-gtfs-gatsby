const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

exports.handler = async function(event) {
  if (!isAllowedOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const corsOrigin = getCorsOrigin(event);

  const urls = {
    'transit-windsor': `https://windsor.mytransitride.com/api/Stop/GetByStopNumbers?stopNums[]=${event.queryStringParameters.stopId}&logDuplicates=false`
  };

  const url = urls[event.queryStringParameters.agency];

  try {
    const response = await fetch(url);
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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching stoplist', error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
}
