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

  const { agency, routeId, patterns } = event.queryStringParameters;

  const urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getvehicles?key=${process.env.DDOT_KEY}&format=json&rt=${routeId}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getvehicles?key=${process.env.SMART_KEY}&format=json&rt=${routeId}`,
    theride: `http://rt.theride.org/bustime/api/v3/getvehicles?key=${process.env.THERIDE_KEY}&format=json&rt=${routeId}`,
    'transit-windsor': `https://windsor.mytransitride.com/api/VehicleStatuses?patternIds=${patterns},`
  };

  const url = urls[agency];

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
      body: JSON.stringify({ message: 'Error fetching route', error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
}
