import React from "react"
import { formatArrivalTime } from "../util"

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
      <h3>When does this route run?</h3>
      <table className="w-auto border-collapse">
        <tbody>
          <tr className="">
            <th className="bg-gray-100"></th>
            {services.map(s => (<th className="">{s}</th>))}
          </tr>
          {directions.map(d => (
            <tr className="pl-4">
              <th className="text-right"><ul className="ml-4">{headsigns[d].map(h => <li className="">{h}</li>)}</ul></th>
              {services.map(s => {

                let sortedTrips = trips[s][d]

                if (sortedTrips.length > 0) {
                  let firstTrip = sortedTrips[0]
                  let lastTrip = sortedTrips[sortedTrips.length - 1]
                  let firstTripStartTime = firstTrip.stopTimes[0].arrivalTime
                  let lastTripEndTime = lastTrip.stopTimes[lastTrip.stopTimes.length - 1].arrivalTime

                  return (
                    <td className="text-center px-6">
                      <p>{formatArrivalTime(firstTripStartTime)} to {formatArrivalTime(lastTripEndTime)}</p>
                      <p className="text-xs text-center mt-1 text-gray-500">{trips[s][d].length} trips</p>
                    </td>
                  )
                }
                else {
                  return (
                    <td className="text-center px-6 text-gray-600">no service</td>
                  )
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RouteDirectionsTable