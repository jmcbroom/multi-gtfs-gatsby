import { graphql, Link } from "gatsby"
import React from "react"
import { getServiceDays, getTripsByServiceDay } from "../util"

const Route = ({ data, pageContext }) => {

  let { routeShortName, routeLongName, routeColor, feedIndex, trips } = data.postgres.routes[0]

  let { serviceCalendars } = data.postgres.agencies[0].feedInfo
  
  let style = {
    borderBottomStyle: `solid`, 
    borderBottomWidth: 3, 
    borderBottomColor: `#${routeColor}`
  }

  let feedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  let serviceDays = getServiceDays(serviceCalendars)
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays)

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <Link to={`/${feedIndexes[feedIndex]}/route/${routeShortName}`}>
        <h1 style={style}>
          {routeShortName} -- {routeLongName}
        </h1>
        </Link>
        <p>This route has {trips.length} trips.</p>
        {Object.keys(tripsByServiceDay).map(day => (
          <p>There are {tripsByServiceDay[day].length} trips on {day}</p>
        ))}
        
    </div>
  )
}

export const query = graphql`
  query RouteQuery($feedIndex: Int, $routeNo: String) {
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

export default Route;