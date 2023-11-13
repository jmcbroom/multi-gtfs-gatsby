let rp = require('request-promise')

exports.handler = function(event, context, callback) {

  let urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getpatterns?key=${process.env.DDOT_KEY}&format=json&rt=${event.queryStringParameters.routeId}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getpatterns?key=${process.env.SMART_KEY}&format=json&rt=${event.queryStringParameters.routeId}`,
    "theride": `http://rt.theride.org/bustime/api/v3/getpatterns?key=${process.env.THERIDE_KEY}&format=json&rt=${event.queryStringParameters.routeId}`
  }

  let url = urls[event.queryStringParameters.agency]

  rp(url)
    .then(body => {
      callback(null, {
        statusCode: 200,
        body: body,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    })
}