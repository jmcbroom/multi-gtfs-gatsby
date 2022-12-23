import { graphql } from "gatsby";
import React, { useState } from "react";
import AgencySlimHeader from "../components/AgencySlimHeader";
import StopMap from "../components/StopMap";
import StopRoutePicker from "../components/StopRoutePicker";

const Stop = ({ data, pageContext }) => {

  let agency = data.agency.edges[0].node

  let { stopLon, stopLat, stopName, stopCode, stopId, routes, times } = data.postgres.stop[0]

  let [currentRoute, setCurrentRoute] = useState(routes[0])

  let stopFc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [stopLon, stopLat]
        },
        properties: {
          name: stopName,
          code: pageContext.agencySlug === 'ddot' ? stopCode : stopId,
        }
      }
    ]
  }

  return (
    <div>
        <AgencySlimHeader agency={agency} />
        <div className="mb-4 bg-gray-200 p-2">
          <h1 className="text-xl -mb-1">{stopName}</h1>
          <span className="text-sm text-gray-500 m-0">stop #{pageContext.agencySlug === 'ddot' ? stopCode : stopId}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <StopRoutePicker {...{routes, currentRoute, setCurrentRoute, agency}} />
          <StopMap stopFc={stopFc} routes={routes} times={times} />
        </div>
    </div>
  )
}

export const query = graphql`
  query StopQuery($feedIndex: Int, $sanityFeedIndex: Float, $stopId: String) {
    agency: allSanityAgency(filter: {currentFeedIndex: {eq: $sanityFeedIndex}}) {
      edges {
        node {
          name
          fullName
          id
          color {
            hex
          }
          textColor {
            hex
          }
          slug {
            current
          }
        }
      }
    }
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
          textColor: routeTextColor
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