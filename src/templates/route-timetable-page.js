import { graphql } from "gatsby"
import React, { useState } from "react"
import { getServiceDays, getTripsByServiceDay, getTripsByServiceAndDirection, getHeadsignsByDirectionId, formatArrivalTime, sortTripsByFrequentTimepoint } from "../util"
import DirectionPicker from "../components/DirectionPicker"
import ServicePicker from "../components/ServicePicker"
import RouteHeader from "../components/RouteHeader"
import AgencyHeader from "../components/AgencyHeader"

/**
 * Tiny testing component for a new route
 * @param {Object} trip: trip element from GraphQL response 
 */
const RouteTimetableTrip = ({ trip }) => {
  return (
    <div style={{ padding: 10, margin: 10, background: '#eee' }}>
    <h4 style={{}}>
      Trip #{trip.tripId}: {trip.tripHeadsign}
    </h4>
      <table>
        <tbody>
          {trip.stopTimes.map(st => (
            <tr key={st.stop.stopId}>
              <td>{st.stop.stopName}</td>
              <td>{formatArrivalTime(st.arrivalTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}

const RouteTimetable = ({ data, pageContext }) => {

  let route = data.postgres.routes[0]

  let { trips } = route

  let { serviceCalendars } = data.postgres.agencies[0].feedInfo

  let serviceDays = getServiceDays(serviceCalendars)
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays)
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips)
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(trips, serviceDays, headsignsByDirectionId)

  const [direction, setDirection] = useState(Object.keys(headsignsByDirectionId)[0])
  const [service, setService] = useState(Object.keys(tripsByServiceDay)[0])

  let selectedTrips = tripsByServiceAndDirection[service][direction]
  let sortedTrips = []
  if (selectedTrips !== undefined && selectedTrips.length > 0) {
    sortedTrips = sortTripsByFrequentTimepoint(selectedTrips)
  }


  return (
    <div className="mt-4">
      <AgencyHeader agency={data.postgres.agencies[0]} />
      <RouteHeader {...route} />
      <DirectionPicker directions={headsignsByDirectionId} {...{ direction, setDirection }} />
      <ServicePicker services={tripsByServiceDay} {...{ service, setService }} />
      {sortedTrips && <h3>There are {sortedTrips.length} trips in that direction of travel on that day.</h3>}
      {sortedTrips.length > 0 && sortedTrips.map(trip => (
        <RouteTimetableTrip trip={trip} key={trip.tripId} />
      ))}
    </div>
  )
}

export const query = graphql`
  query RouteTimetableQuery($feedIndex: Int, $routeNo: String) {
    postgres {
      routes: routesList(condition: {feedIndex: $feedIndex, routeShortName: $routeNo}) {
        agencyId
        routeShortName
        routeLongName
        routeDesc
        routeType
        routeUrl
        routeColor
        routeTextColor
        routeSortOrder
        feedIndex
        trips: tripsByFeedIndexAndRouteIdList {
          serviceId
          directionId
          tripId
          tripHeadsign
          stopTimes: stopTimesByFeedIndexAndTripIdList(
            orderBy: STOP_SEQUENCE_ASC
            condition: {timepoint: 1}
          ) {
            stop: stopByFeedIndexAndStopId {
              stopName
              stopId
              stopCode
            }
            arrivalTime {
              hours
              minutes
              seconds
            }
          }
        }
      }
      agencies: agenciesList(condition: {feedIndex: $feedIndex}) {
        feedIndex
        agencyName
        feedInfo: feedInfoByFeedIndex {
          serviceCalendars: calendarsByFeedIndexList {
            sunday
            thursday
            tuesday
            wednesday
            monday
            friday
            saturday
            serviceId
          }
        }
      }
    }
  }
`

export default RouteTimetable;