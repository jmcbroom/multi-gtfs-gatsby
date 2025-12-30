let rp = require('request-promise')

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

  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return true;
  }

  if (referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))) {
    return true;
  }

  return false;
}

exports.handler = function(event, context, callback) {
  // Check origin/referer
  if (!isAllowedOrigin(event)) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const origin = event.headers.origin || event.headers.Origin || 'https://transit.det.city';
  const corsOrigin = ALLOWED_ORIGINS.find(allowed => origin.startsWith(allowed)) || ALLOWED_ORIGINS[0];

  let { agency, routeId, patterns } = event.queryStringParameters

  let urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getvehicles?key=${process.env.DDOT_KEY}&format=json&rt=${routeId}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getvehicles?key=${process.env.SMART_KEY}&format=json&rt=${routeId}`,
    "theride": `http://rt.theride.org/bustime/api/v3/getvehicles?key=${process.env.THERIDE_KEY}&format=json&rt=${routeId}`,
    'transit-windsor': `https://windsor.mytransitride.com/api/VehicleStatuses?patternIds=${patterns},`
  }

  let url = urls[agency]

  rp(url)
    .then(body => {
      callback(null, {
        statusCode: 200,
        body: body,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': corsOrigin
        }
      })
    })
}
