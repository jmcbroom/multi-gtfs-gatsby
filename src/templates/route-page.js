import { graphql, Link } from "gatsby";
import React from "react";
import AgencyHeader from '../components/AgencyHeader';
import RouteHeader from '../components/RouteHeader';
import { getHeadsignsByDirectionId, getServiceDays, getTripsByServiceAndDirection, getTripsByServiceDay } from "../util";

const Route = ({ data, pageContext }) => {

  let route = data.postgres.routes[0]
  let agency = data.postgres.agencies[0]
  let { trips } = route

  let { serviceCalendars } = agency.feedInfo

  let serviceDays = getServiceDays(serviceCalendars)
  let tripsByServiceDay = getTripsByServiceDay(trips, serviceDays)
  let headsignsByDirectionId = getHeadsignsByDirectionId(trips)
  let tripsByServiceAndDirection = getTripsByServiceAndDirection(trips, serviceDays, headsignsByDirectionId)

  let pages = {
    "Overview": `./`,
    "Route timetable": `./timetable`,
    "Stops": `./stops`,
  }

  return (
    <div className="mt-4">
      <AgencyHeader agency={agency} />
      <RouteHeader {...route} />
      <section className="grid grid-cols-2 md:grid-cols-3">
        {Object.keys(pages).map(p => (
          <div key={p} className="bg-gray-300 py-2 text-center text-semibold">
            <Link to={pages[p]}>
              <h2>{p}</h2>
            </Link>
          </div>
        ))}
      </section>
      <p>
        This route has {Object.keys(headsignsByDirectionId).length} directions.
      </p>
      {Object.keys(headsignsByDirectionId).map(dir => (
        <p key={dir}>Direction {dir} goes to {headsignsByDirectionId[dir].join(", ")}</p>
      ))}
      <hr />
      <p>This route has {trips.length} trips.</p>
      {Object.keys(tripsByServiceDay).map(day => (
        <div key={day}>
          <p key={day}>There are {tripsByServiceDay[day].length} trips on {day}</p>
          {Object.keys(headsignsByDirectionId).map(dir => (
            <p key={dir}>{tripsByServiceAndDirection[day][dir].length} go in direction {dir}: {headsignsByDirectionId[dir].join(", ")}</p>
          ))}
        </div>
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