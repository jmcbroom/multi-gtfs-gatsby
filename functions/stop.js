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
    ddot: `http://myddotbus.com/bustime/api/v3/getpredictions?key=${process.env.DDOT_KEY}&format=json&stpid=${event.queryStringParameters.stopId}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getpredictions?key=${process.env.SMART_KEY}&format=json&stpid=${event.queryStringParameters.stopId}`,
    theride: `http://rt.theride.org/bustime/api/v3/getpredictions?key=${process.env.THERIDE_KEY}&format=json&stpid=${event.queryStringParameters.stopId}`,
    umich: `https://mbus.ltp.umich.edu/bustime/api/v3/getpredictions?key=${process.env.UMICH_KEY}&format=json&stpid=${event.queryStringParameters.stopId}`,
    'transit-windsor': `https://windsor.mytransitride.com/api/PredictionData?stopid=${event.queryStringParameters.stopId}&shouldLog=true`
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
      body: JSON.stringify({ message: 'Error fetching stop', error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
}
