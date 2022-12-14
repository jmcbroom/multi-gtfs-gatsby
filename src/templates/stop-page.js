import { graphql } from "gatsby";
import React from "react";

const Stop = ({ data, pageContext }) => {

  console.log(data, pageContext)

  const s = data.postgres.stop[0]

  let { stopLon, stopLat, stopName, stopCode, stopId, routes, times } = s;

  return (
    <div>
        <h1 className="">{stopName}</h1>
        <h2 className="">#{pageContext.agencySlug === 'ddot' ? stopCode : stopId}</h2>
    </div>
  )
}

export const query = graphql`
  query StopQuery($feedIndex: Int, $stopId: String) {
    allSanityRoute
    postgres {
      stop: stopsList(filter: {feedIndex: {equalTo: $feedIndex}, stopId: {equalTo: $stopId}}) {
        stopId
        stopCode
        stopName
        stopLat
        stopLon
        routes: routesList {
          short: routeShortName
          long: routeLongName
          color: routeColor
        }
        nearby: nearbyStopsList {
          stopId
          stopName
          stopLat
          stopLon
          routes: routesList {
            routeShortName
            routeLongName
            routeColor
          }
        }
        times: stopTimesByFeedIndexAndStopIdList(orderBy: ARRIVAL_TIME_ASC) {
          trip: tripByFeedIndexAndTripId {
            tripId
            route: routeByFeedIndexAndRouteId {
              routeColor
              routeTextColor
              routeShortName
              routeLongName
              agencyId
            }
            directionId
            serviceId
            tripHeadsign
            stopTimesByFeedIndexAndTripId {
              totalCount
            }
          }
          stopSequence
          arrivalTime {
            hours
            minutes
            seconds
          }
        }
      }
    }
  }
`

export default Stop;