const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

exports.handler = async function(event, context) {
  if (!isAllowedOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const corsOrigin = getCorsOrigin(event);

  const urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getvehicles?key=${process.env.DDOT_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getvehicles?key=${process.env.SMART_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`,
    theride: `http://rt.theride.org/bustime/api/v3/getvehicles?key=${process.env.THERIDE_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`,
    umich: `https://mbus.ltp.umich.edu/bustime/api/v3/getvehicles?key=${process.env.UMICH_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`
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
      body: JSON.stringify({ message: 'Error fetching vehicles', error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin
      }
    };
  }
}
