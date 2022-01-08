import { graphql, Link } from "gatsby"
import React from "react"
import { getServiceDays, getTripsByServiceDay, getTripsByServiceAndDirection, getHeadsignsByDirectionId } from "../util"
import config from "../config"

const Route = ({ data, pageContext }) => {

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

  return (
    <div>
      <Link to={`/`}>Home</Link>
      <Link to={`/${feedIndexes[feedIndex]}/route/${routeShortName}`}>
        <h1 style={style}>
          {routeShortName} -- {routeLongName}
        </h1>
      </Link>
      <Link to={`./timetable`}>
        <h2>Route timetable</h2>
      </Link>
      <p>
        This route has {Object.keys(headsignsByDirectionId).length} directions.
      </p>
      {Object.keys(headsignsByDirectionId).map(dir => (
        <p key={dir}>Direction {dir} goes to {headsignsByDirectionId[dir].join(", ")}</p>
      ))}
      <hr />
      <p>This route has {trips.length} trips.</p>
      {Object.keys(tripsByServiceDay).map(day => (
        <>
          <p key={day}>There are {tripsByServiceDay[day].length} trips on {day}</p>
          {Object.keys(headsignsByDirectionId).map(dir => (
            <p>{tripsByServiceAndDirection[day][dir].length} go in direction {dir}: {headsignsByDirectionId[dir].join(", ")}</p>
          ))}
        </>
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