import React from "react"

/**
 * A component which displays the table of trips by direction and service day.
 * @param {} param0 
 * @returns 
 */
const RouteDirectionsTable = ({ trips, headsigns }) => {

  let services = Object.keys(trips)
  let directions = Object.keys(headsigns)

  return (
    <section>
      {/* <h3>Route directions</h3> */}
      <table className="w-auto">
        <tbody>
          <tr>
            <th className="bg-gray-100"></th>
            {services.map(s => (<th className="">{s}</th>))}
          </tr>
          {directions.map(d => (
            <tr>
              <th className="text-right">to: {headsigns[d]}</th>
              {services.map(s => (
                <td className="text-center px-6">{trips[s][d].length} trips</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RouteDirectionsTable