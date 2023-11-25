let rp = require('request-promise')

exports.handler = function(event, context, callback) {

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
          'Access-Control-Allow-Origin': '*'
        }
      })
    })
}