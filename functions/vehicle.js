let rp = require('request-promise')

exports.handler = function(event, context, callback) {
  let urls = {
    ddot: `http://myddotbus.com/bustime/api/v3/getvehicles?key=${process.env.DDOT_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`,
    smart: `http://bustime.smartbus.org/bustime/api/v3/getvehicles?key=${process.env.SMART_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`,
    "theride": `http://rt.theride.org/bustime/api/v3/getvehicles?key=${process.env.THERIDE_KEY}&format=json&vid=${event.queryStringParameters.vehicleIds}`
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