let rp = require('request-promise')

exports.handler = function(event, context, callback) {

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
          'Access-Control-Allow-Origin': '*'
        }
      })
    })
}