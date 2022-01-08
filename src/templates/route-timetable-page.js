import { graphql, Link } from "gatsby"
import React, { useState } from "react"
import { getServiceDays, getTripsByServiceDay, getTripsByServiceAndDirection, getHeadsignsByDirectionId } from "../util"
import config from "../config"
import DirectionPicker from "../components/DirectionPicker"
import ServicePicker from "../components/ServicePicker"

const RouteTimetable = ({ data, pageContext }) => {

  let { routeShortName, routeLongName, routeColor, feedIndex, trips } = data.postgres.routes[0]

  let { serviceCalendars } = data.postgres.agencies[0].feedInfo

  let style = {
    borderBottomStyle: `solid`,
    borderBottomWidth: 3,
    borderBottomColor: `#${routeColor}`
  }

  let { feedIndexes } = config

  let serviceDays = getServiceDays(serviceCalendars)
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays)
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips)
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(trips, serviceDays, headsignsByDirectionId)

  const [direction, setDirection] = useState(Object.keys(headsignsByDirectionId)[0])
  const [service, setService] = useState(Object.keys(tripsByServiceDay)[0])

  let filteredTrips = tripsByServiceAndDirection[service][direction]

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <Link to={`/${feedIndexes[feedIndex]}/route/${routeShortName}`}>
        <h1 style={style}>
          {routeShortName} -- {routeLongName}
        </h1>
      </Link>
      <DirectionPicker directions={headsignsByDirectionId} {...{direction, setDirection}} />
      <ServicePicker services={tripsByServiceDay} {...{service, setService}} />
      <h3>There are {filteredTrips.length} trips in that direction of travel on that day.</h3>
      {filteredTrips.length > 0 && filteredTrips.map(trip => (
        <div>
          {trip.tripId}
        </div>
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
        }
      }
      agencies: agenciesList(condition: {feedIndex: $feedIndex}) {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
        agencyId
        routes: routesByFeedIndexAndAgencyIdList {
          routeShortName
          routeLongName
        }
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