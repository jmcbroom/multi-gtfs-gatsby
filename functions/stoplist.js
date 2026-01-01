let rp = require('request-promise')
const { isAllowedOrigin, getCorsOrigin } = require('./lib/cors');

exports.handler = function(event, context, callback) {
  if (!isAllowedOrigin(event)) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({ message: 'Forbidden' }),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const corsOrigin = getCorsOrigin(event);

  let urls = {
    "transit-windsor": `https://windsor.mytransitride.com/api/Stop/GetByStopNumbers?stopNums[]=${event.queryStringParameters.stopId}&logDuplicates=false`
  }

  let url = urls[event.queryStringParameters.agency]

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
