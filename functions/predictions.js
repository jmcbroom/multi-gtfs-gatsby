let rp = require('request-promise')

exports.handler = function(event, context, callback) {
  let urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getpredictions?key=${process.env.DDOT_KEY}&format=json&vid=${event.queryStringParameters.vehicleId}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getpredictions?key=${process.env.SMART_KEY}&format=json&vid=${event.queryStringParameters.vehicleId}`
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